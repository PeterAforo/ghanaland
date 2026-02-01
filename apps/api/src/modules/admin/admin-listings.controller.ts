import { Controller, Get, Put, Delete, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@ApiTags('Admin - Listings')
@Controller('admin/listings')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminListingsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get all listings with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'verificationStatus', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getListings(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getListings({
      search,
      status,
      verificationStatus,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single listing by ID' })
  async getListing(@Param('id') id: string) {
    return this.adminService.getListing(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update listing' })
  async updateListing(
    @Param('id') id: string,
    @Body() body: { title?: string; listingStatus?: string; verificationStatus?: string; priceGhs?: number },
  ) {
    return this.adminService.updateListing(id, body);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update listing status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateListingStatus(id, body.status);
  }

  @Put(':id/verification')
  @ApiOperation({ summary: 'Update listing verification status' })
  async updateVerification(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.adminService.updateVerificationStatus(id, body.status, body.notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete listing' })
  async deleteListing(@Param('id') id: string) {
    return this.adminService.deleteListing(id);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete listings' })
  async bulkDeleteListings(@Body() body: { ids: string[] }) {
    return this.adminService.deleteListings(body.ids);
  }
}
