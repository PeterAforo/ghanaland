import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('pending-items')
  @ApiOperation({ summary: 'Get items requiring attention' })
  async getPendingItems() {
    return this.adminService.getPendingItems();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAuditLogs(
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs({
      entityType,
      action,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 25,
    });
  }
}
