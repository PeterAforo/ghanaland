import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VerificationService } from './verification.service';
import { CreateVerificationRequestDto, ReviewVerificationDto } from './dto';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('request')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a verification request for a listing' })
  async createVerificationRequest(
    @Request() req: any,
    @Body() dto: CreateVerificationRequestDto,
  ) {
    return this.verificationService.createVerificationRequest(
      req.user.id,
      req.user.tenantId,
      dto,
    );
  }

  @Get('request/:requestId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get verification request details' })
  async getVerificationRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
  ) {
    return this.verificationService.getVerificationRequest(requestId, req.user.id);
  }

  @Get('listing/:listingId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all verification requests for a listing' })
  async getListingVerificationRequests(
    @Request() req: any,
    @Param('listingId') listingId: string,
  ) {
    return this.verificationService.getListingVerificationRequests(listingId, req.user.id);
  }

  @Get('my-requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user verification requests' })
  async getUserVerificationRequests(@Request() req: any) {
    return this.verificationService.getUserVerificationRequests(req.user.id);
  }

  @Get('pending')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending verification requests (admin/verifier)' })
  async getPendingVerificationRequests() {
    return this.verificationService.getPendingVerificationRequests();
  }

  @Post('review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review and approve/reject a verification request' })
  async reviewVerificationRequest(
    @Request() req: any,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.verificationService.reviewVerificationRequest(
      req.user.id,
      req.user.tenantId,
      dto,
    );
  }

  @Patch(':requestId/start-review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start reviewing a verification request' })
  async startReview(@Request() req: any, @Param('requestId') requestId: string) {
    return this.verificationService.startReview(
      requestId,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Delete(':requestId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a verification request' })
  async cancelVerificationRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
  ) {
    return this.verificationService.cancelVerificationRequest(
      requestId,
      req.user.id,
      req.user.tenantId,
    );
  }
}
