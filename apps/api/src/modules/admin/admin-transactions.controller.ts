import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@ApiTags('Admin - Transactions')
@Controller('admin/transactions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminTransactionsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTransactions(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTransactions({
      search,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Put(':id/action')
  @ApiOperation({ summary: 'Perform action on transaction (release, refund, dispute, resolve)' })
  async performAction(
    @Param('id') id: string,
    @Body() body: { action: string; notes?: string },
  ) {
    return this.adminService.updateTransactionStatus(id, body.action, body.notes);
  }
}
