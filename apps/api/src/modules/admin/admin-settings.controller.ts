import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@ApiTags('Admin - Settings')
@Controller('admin/settings')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminSettingsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get platform settings' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Update platform settings' })
  async updateSettings(@Body() body: Record<string, any>) {
    return this.adminService.updateSettings(body);
  }
}
