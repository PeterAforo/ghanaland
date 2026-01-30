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
import { PermitsService } from './permits.service';
import {
  CreatePermitApplicationDto,
  UpdatePermitApplicationDto,
  AddPermitDocumentDto,
  UpdatePermitStatusDto,
  VerifyDocumentDto,
} from './dto';

@ApiTags('Permits')
@Controller('permits')
export class PermitsController {
  constructor(private permitsService: PermitsService) {}

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new permit application' })
  async createApplication(@Request() req: any, @Body() dto: CreatePermitApplicationDto) {
    return this.permitsService.createApplication(req.user.id, dto);
  }

  @Get('my-applications')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my permit applications' })
  async getMyApplications(@Request() req: any) {
    return this.permitsService.getMyApplications(req.user.id);
  }

  @Get('application/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get permit application details' })
  async getApplication(@Request() req: any, @Param('id') id: string) {
    return this.permitsService.getApplication(req.user.id, id);
  }

  @Patch('application/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update permit application (draft only)' })
  async updateApplication(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePermitApplicationDto,
  ) {
    return this.permitsService.updateApplication(req.user.id, id, dto);
  }

  @Post('application/:id/documents')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add document to application' })
  async addDocument(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddPermitDocumentDto,
  ) {
    return this.permitsService.addDocument(req.user.id, id, dto);
  }

  @Delete('application/:id/documents/:documentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove document from application' })
  async removeDocument(
    @Request() req: any,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.permitsService.removeDocument(req.user.id, id, documentId);
  }

  @Post('application/:id/submit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit application for review' })
  async submitApplication(@Request() req: any, @Param('id') id: string) {
    return this.permitsService.submitApplication(req.user.id, id);
  }

  @Post('application/:id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel application' })
  async cancelApplication(@Request() req: any, @Param('id') id: string) {
    return this.permitsService.cancelApplication(req.user.id, id);
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all permit applications (admin)' })
  async getAllApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.permitsService.getAllApplications(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      type,
    );
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get permit statistics (admin)' })
  async getPermitStats() {
    return this.permitsService.getPermitStats();
  }

  @Get('admin/application/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get application details (admin)' })
  async getApplicationAdmin(@Param('id') id: string) {
    return this.permitsService.getApplicationAdmin(id);
  }

  @Patch('admin/application/:id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update application status (admin)' })
  async updateApplicationStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePermitStatusDto,
  ) {
    return this.permitsService.updateApplicationStatus(req.user.id, id, dto);
  }

  @Patch('admin/documents/:documentId/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify document (admin)' })
  async verifyDocument(
    @Request() req: any,
    @Param('documentId') documentId: string,
    @Body() dto: VerifyDocumentDto,
  ) {
    return this.permitsService.verifyDocument(req.user.id, documentId, dto);
  }
}
