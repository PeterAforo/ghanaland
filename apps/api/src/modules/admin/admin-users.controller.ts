import { Controller, Get, Put, Delete, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUsers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers({
      search,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single user by ID' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Param('id') id: string,
    @Body() body: { fullName?: string; phone?: string; accountStatus?: string },
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update user account status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateUserStatus(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (deactivate) user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete (deactivate) users' })
  async bulkDeleteUsers(@Body() body: { ids: string[] }) {
    return this.adminService.deleteUsers(body.ids);
  }
}
