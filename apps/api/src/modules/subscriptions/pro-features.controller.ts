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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProFeaturesService } from './pro-features.service';

@ApiTags('Pro Features')
@Controller('pro')
export class ProFeaturesController {
  constructor(private proFeaturesService: ProFeaturesService) {}

  // ============================================================================
  // FEATURED LISTINGS
  // ============================================================================

  @Post('featured-listings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Feature a listing' })
  async featureListing(
    @Request() req: any,
    @Body() body: {
      listingId: string;
      featuredType: 'STANDARD' | 'PREMIUM' | 'SPOTLIGHT';
      paymentReference?: string;
    },
  ) {
    return this.proFeaturesService.featureListing(
      req.user.id,
      body.listingId,
      body.featuredType,
      body.paymentReference,
    );
  }

  @Get('featured-listings')
  @ApiOperation({ summary: 'Get featured listings' })
  async getFeaturedListings(@Query('limit') limit?: string) {
    return this.proFeaturesService.getFeaturedListings(limit ? parseInt(limit) : 10);
  }

  // ============================================================================
  // LISTING ANALYTICS
  // ============================================================================

  @Get('analytics/listings/:listingId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get listing analytics' })
  async getListingAnalytics(
    @Request() req: any,
    @Param('listingId') listingId: string,
    @Query('days') days?: string,
  ) {
    return this.proFeaturesService.getListingAnalytics(
      req.user.id,
      listingId,
      days ? parseInt(days) : 30,
    );
  }

  @Post('analytics/track')
  @ApiOperation({ summary: 'Track listing action (internal)' })
  async trackAction(
    @Body() body: {
      listingId: string;
      action: 'view' | 'inquiry' | 'favorite' | 'share' | 'phone_click' | 'map_view';
      isUnique?: boolean;
    },
  ) {
    if (body.action === 'view') {
      await this.proFeaturesService.trackListingView(body.listingId, body.isUnique);
    } else {
      await this.proFeaturesService.trackListingAction(body.listingId, body.action);
    }
    return { success: true, data: null, meta: { requestId: `req_${Date.now()}` }, error: null };
  }

  // ============================================================================
  // PRICE ALERTS
  // ============================================================================

  @Post('price-alerts')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create price alert' })
  async createPriceAlert(
    @Request() req: any,
    @Body() body: {
      listingId: string;
      targetPrice: number;
      alertType?: 'PRICE_DROP' | 'PRICE_CHANGE' | 'BACK_ON_MARKET';
    },
  ) {
    return this.proFeaturesService.createPriceAlert(
      req.user.id,
      body.listingId,
      body.targetPrice,
      body.alertType,
    );
  }

  @Get('price-alerts')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user price alerts' })
  async getUserPriceAlerts(@Request() req: any) {
    return this.proFeaturesService.getUserPriceAlerts(req.user.id);
  }

  @Delete('price-alerts/:alertId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete price alert' })
  async deletePriceAlert(@Request() req: any, @Param('alertId') alertId: string) {
    return this.proFeaturesService.deletePriceAlert(req.user.id, alertId);
  }

  // ============================================================================
  // SAVED SEARCH ALERTS
  // ============================================================================

  @Post('search-alerts')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create saved search alert' })
  async createSearchAlert(
    @Request() req: any,
    @Body() body: {
      savedSearchId: string;
      frequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
    },
  ) {
    return this.proFeaturesService.createSavedSearchAlert(
      req.user.id,
      body.savedSearchId,
      body.frequency,
    );
  }

  @Get('search-alerts')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user search alerts' })
  async getUserSearchAlerts(@Request() req: any) {
    return this.proFeaturesService.getUserSearchAlerts(req.user.id);
  }

  // ============================================================================
  // DUE DILIGENCE REPORTS
  // ============================================================================

  @Post('due-diligence')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request due diligence report' })
  async requestDueDiligence(
    @Request() req: any,
    @Body() body: {
      listingId?: string;
      landId?: string;
      reportType?: 'BASIC' | 'STANDARD' | 'COMPREHENSIVE';
      paymentReference?: string;
    },
  ) {
    return this.proFeaturesService.requestDueDiligenceReport(
      req.user.id,
      body.listingId || null,
      body.landId || null,
      body.reportType,
      body.paymentReference,
    );
  }

  @Get('due-diligence')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user due diligence reports' })
  async getUserDueDiligence(@Request() req: any) {
    return this.proFeaturesService.getUserDueDiligenceReports(req.user.id);
  }

  // ============================================================================
  // VIRTUAL TOURS
  // ============================================================================

  @Post('virtual-tours')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create/update virtual tour' })
  async createVirtualTour(
    @Request() req: any,
    @Body() body: {
      listingId: string;
      tourType: 'PHOTOS_360' | 'VIDEO_WALKTHROUGH' | 'MATTERPORT' | 'EXTERNAL_LINK';
      tourUrl?: string;
      embedCode?: string;
      mediaUrls?: string[];
    },
  ) {
    return this.proFeaturesService.createVirtualTour(
      req.user.id,
      body.listingId,
      body.tourType,
      { tourUrl: body.tourUrl, embedCode: body.embedCode, mediaUrls: body.mediaUrls },
    );
  }

  @Get('virtual-tours/:listingId')
  @ApiOperation({ summary: 'Get virtual tour for listing' })
  async getVirtualTour(@Param('listingId') listingId: string) {
    return this.proFeaturesService.getVirtualTour(listingId);
  }

  // ============================================================================
  // TEAM MANAGEMENT
  // ============================================================================

  @Post('team/invite')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite team member' })
  async inviteTeamMember(
    @Request() req: any,
    @Body() body: {
      memberEmail: string;
      role?: 'ADMIN' | 'MEMBER' | 'VIEWER';
    },
  ) {
    return this.proFeaturesService.inviteTeamMember(req.user.id, body.memberEmail, body.role);
  }

  @Get('team')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get team members' })
  async getTeamMembers(@Request() req: any) {
    return this.proFeaturesService.getTeamMembers(req.user.id);
  }

  @Delete('team/:memberId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove team member' })
  async removeTeamMember(@Request() req: any, @Param('memberId') memberId: string) {
    return this.proFeaturesService.removeTeamMember(req.user.id, memberId);
  }

  // ============================================================================
  // API KEYS
  // ============================================================================

  @Post('api-keys')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create API key' })
  async createApiKey(
    @Request() req: any,
    @Body() body: { name: string; permissions: string[] },
  ) {
    return this.proFeaturesService.createApiKey(req.user.id, body.name, body.permissions);
  }

  @Get('api-keys')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user API keys' })
  async getUserApiKeys(@Request() req: any) {
    return this.proFeaturesService.getUserApiKeys(req.user.id);
  }

  @Delete('api-keys/:keyId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke API key' })
  async revokeApiKey(@Request() req: any, @Param('keyId') keyId: string) {
    return this.proFeaturesService.revokeApiKey(req.user.id, keyId);
  }

  // ============================================================================
  // LEADS (for Professionals)
  // ============================================================================

  @Get('leads')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get professional leads' })
  async getLeads(@Request() req: any) {
    return this.proFeaturesService.getProfessionalLeads(req.user.id);
  }

  @Put('leads/:leadId/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead status' })
  async updateLeadStatus(
    @Request() req: any,
    @Param('leadId') leadId: string,
    @Body() body: {
      status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
      notes?: string;
    },
  ) {
    return this.proFeaturesService.updateLeadStatus(req.user.id, leadId, body.status, body.notes);
  }
}
