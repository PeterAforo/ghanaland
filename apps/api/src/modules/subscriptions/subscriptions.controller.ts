import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private prisma: PrismaService,
  ) {}

  private async requireAdmin(userId: string): Promise<void> {
    const adminRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: { name: 'ADMIN' },
      },
    });
    if (!adminRole) {
      throw new ForbiddenException('Admin access required');
    }
  }

  // ============================================================================
  // PUBLIC: PLANS
  // ============================================================================

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('plans/:slug')
  @ApiOperation({ summary: 'Get plan by slug' })
  async getPlanBySlug(@Param('slug') slug: string) {
    return this.subscriptionsService.getPlanBySlug(slug);
  }

  // ============================================================================
  // USER: SUBSCRIPTION MANAGEMENT
  // ============================================================================

  @Get('my-subscription')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  async getMySubscription(@Request() req: any) {
    return this.subscriptionsService.getUserSubscription(req.user.id);
  }

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  async subscribe(
    @Request() req: any,
    @Body() body: { planSlug: string; billingCycle?: 'MONTHLY' | 'YEARLY'; paymentReference?: string },
  ) {
    return this.subscriptionsService.subscribe(
      req.user.id,
      body.planSlug,
      body.billingCycle || 'MONTHLY',
      body.paymentReference,
    );
  }

  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(
    @Request() req: any,
    @Body() body: { immediate?: boolean },
  ) {
    return this.subscriptionsService.cancelSubscription(req.user.id, body.immediate);
  }

  @Get('check-feature/:featureKey')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user has access to a feature' })
  async checkFeature(@Request() req: any, @Param('featureKey') featureKey: string) {
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(req.user.id, featureKey);
    return {
      success: true,
      data: { hasAccess, featureKey },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  @Get('my-tier')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user tier' })
  async getMyTier(@Request() req: any) {
    const tier = await this.subscriptionsService.getUserTier(req.user.id);
    return {
      success: true,
      data: { tier },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // ADMIN: PLAN MANAGEMENT
  // ============================================================================

  @Get('admin/plans')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all plans including inactive (admin)' })
  async getAdminPlans(@Request() req: any) {
    await this.requireAdmin(req.user.id);
    return this.subscriptionsService.getAllPlans();
  }

  @Post('admin/plans')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new plan (admin)' })
  async createPlan(
    @Request() req: any,
    @Body() body: {
      name: string;
      slug: string;
      description?: string;
      tierType: 'FREE' | 'SELLER_PRO' | 'BUYER_PRO' | 'PROFESSIONAL_PRO' | 'AGENT_PRO' | 'ENTERPRISE';
      priceMonthlyGhs: number;
      priceYearlyGhs: number;
      features: string[];
      limits: Record<string, number>;
      sortOrder?: number;
    },
  ) {
    await this.requireAdmin(req.user.id);
    return this.subscriptionsService.createPlan(body);
  }

  @Put('admin/plans/:planId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a plan (admin)' })
  async updatePlan(
    @Request() req: any,
    @Param('planId') planId: string,
    @Body() body: Partial<{
      name: string;
      description: string;
      priceMonthlyGhs: number;
      priceYearlyGhs: number;
      features: string[];
      limits: Record<string, number>;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) {
    await this.requireAdmin(req.user.id);
    return this.subscriptionsService.updatePlan(planId, body);
  }

  @Delete('admin/plans/:planId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a plan (admin)' })
  async deletePlan(@Request() req: any, @Param('planId') planId: string) {
    await this.requireAdmin(req.user.id);
    return this.subscriptionsService.deletePlan(planId);
  }

  @Get('admin/features')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available features (admin)' })
  async getAvailableFeatures(@Request() req: any) {
    await this.requireAdmin(req.user.id);
    return this.subscriptionsService.getAvailableFeatures();
  }

  @Post('admin/seed-plans')
  @ApiOperation({ summary: 'Seed default plans (one-time setup)' })
  async seedPlans() {
    return this.subscriptionsService.seedDefaultPlans();
  }
}
