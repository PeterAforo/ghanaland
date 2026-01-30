import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProfessionalsService } from './professionals.service';
import {
  CreateProfessionalProfileDto,
  UpdateProfessionalProfileDto,
  CreateServiceDto,
  CreateServiceRequestDto,
  UpdateServiceRequestStatusDto,
  CreateReviewDto,
  SearchProfessionalsDto,
} from './dto';

@ApiTags('Professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private professionalsService: ProfessionalsService) {}

  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Search professionals' })
  async searchProfessionals(@Query() dto: SearchProfessionalsDto) {
    return this.professionalsService.searchProfessionals(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get professional profile by ID' })
  async getProfile(@Param('id') id: string) {
    return this.professionalsService.getProfile(id);
  }

  // ============================================================================
  // PROFESSIONAL PROFILE MANAGEMENT
  // ============================================================================

  @Get('me/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my professional profile' })
  async getMyProfile(@Request() req: any) {
    return this.professionalsService.getMyProfile(req.user.id);
  }

  @Post('me/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create professional profile' })
  async createProfile(@Request() req: any, @Body() dto: CreateProfessionalProfileDto) {
    return this.professionalsService.createProfile(req.user.id, dto);
  }

  @Patch('me/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update professional profile' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfessionalProfileDto) {
    return this.professionalsService.updateProfile(req.user.id, dto);
  }

  // ============================================================================
  // SERVICES
  // ============================================================================

  @Post('me/services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a service to your profile' })
  async addService(@Request() req: any, @Body() dto: CreateServiceDto) {
    return this.professionalsService.addService(req.user.id, dto);
  }

  @Delete('me/services/:serviceId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a service from your profile' })
  async removeService(@Request() req: any, @Param('serviceId') serviceId: string) {
    return this.professionalsService.removeService(req.user.id, serviceId);
  }

  // ============================================================================
  // SERVICE REQUESTS
  // ============================================================================

  @Post('requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a service request' })
  async createServiceRequest(@Request() req: any, @Body() dto: CreateServiceRequestDto) {
    return this.professionalsService.createServiceRequest(req.user.id, dto);
  }

  @Get('requests/client')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my requests as a client' })
  async getMyClientRequests(@Request() req: any) {
    return this.professionalsService.getMyRequests(req.user.id, 'client');
  }

  @Get('requests/professional')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get requests for me as a professional' })
  async getMyProfessionalRequests(@Request() req: any) {
    return this.professionalsService.getMyRequests(req.user.id, 'professional');
  }

  @Get('requests/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get service request details' })
  async getServiceRequest(@Request() req: any, @Param('id') id: string) {
    return this.professionalsService.getServiceRequest(id, req.user.id);
  }

  @Patch('requests/:id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service request status' })
  async updateRequestStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateServiceRequestStatusDto,
  ) {
    return this.professionalsService.updateRequestStatus(id, req.user.id, dto);
  }

  @Post('requests/:id/fund-escrow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fund escrow for a service request (client pays)' })
  async fundEscrow(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { paymentReference: string },
  ) {
    return this.professionalsService.fundEscrow(id, req.user.id, body.paymentReference);
  }

  // ============================================================================
  // REVIEWS
  // ============================================================================

  @Post('requests/:id/review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a review for a completed request' })
  async createReview(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.professionalsService.createReview(id, req.user.id, dto);
  }

  // ============================================================================
  // SERVICE REQUEST DOCUMENTS
  // ============================================================================

  @Post('requests/:id/documents')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a document for a service request' })
  async uploadDocument(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: {
      type: string;
      category: string;
      name: string;
      description?: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
      isRequired?: boolean;
    },
  ) {
    return this.professionalsService.uploadDocument(id, req.user.id, dto);
  }

  @Get('requests/:id/documents')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all documents for a service request' })
  async getRequestDocuments(@Request() req: any, @Param('id') id: string) {
    return this.professionalsService.getRequestDocuments(id, req.user.id);
  }

  @Delete('documents/:documentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a document' })
  async deleteDocument(@Request() req: any, @Param('documentId') documentId: string) {
    return this.professionalsService.deleteDocument(documentId, req.user.id);
  }

  // ============================================================================
  // SERVICE CONFIRMATIONS
  // ============================================================================

  @Post('requests/:id/confirm')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm an action for a service request' })
  async confirmAction(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { type: string; notes?: string },
  ) {
    return this.professionalsService.confirmAction(id, req.user.id, dto);
  }

  @Get('requests/:id/confirmations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all confirmations for a service request' })
  async getRequestConfirmations(@Request() req: any, @Param('id') id: string) {
    return this.professionalsService.getRequestConfirmations(id, req.user.id);
  }

  @Get('required-documents/:professionalType')
  @ApiOperation({ summary: 'Get required documents for a professional type' })
  async getRequiredDocuments(@Param('professionalType') professionalType: string) {
    return this.professionalsService.getRequiredDocuments(professionalType);
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  @Get('admin/requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get all service requests with filters' })
  async adminGetServiceRequests(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('professionalType') professionalType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.professionalsService.adminGetServiceRequests(req.user.id, {
      status,
      professionalType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('admin/requests/:id/checklist')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get service request checklist for escrow release' })
  async adminGetServiceRequestChecklist(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.professionalsService.adminGetServiceRequestChecklist(req.user.id, id);
  }

  @Post('admin/requests/:id/release-escrow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Release escrow after checklist verification' })
  async adminReleaseEscrow(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    return this.professionalsService.adminReleaseEscrow(req.user.id, id, body.notes);
  }
}
