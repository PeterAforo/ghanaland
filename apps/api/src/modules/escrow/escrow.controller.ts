import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EscrowService } from './escrow.service';
import {
  CreateTransactionDto,
  DisputeTransactionDto,
  ResolveDisputeDto,
  ReleaseEscrowDto,
} from './dto';

@ApiTags('Escrow & Transactions')
@Controller('escrow')
export class EscrowController {
  constructor(private escrowService: EscrowService) {}

  @Post('transaction')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new transaction for a listing' })
  async createTransaction(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.escrowService.createTransaction(req.user.id, req.user.tenantId, dto);
  }

  @Get('transaction/:transactionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction details' })
  async getTransaction(
    @Request() req: any,
    @Param('transactionId') transactionId: string,
  ) {
    return this.escrowService.getTransaction(transactionId, req.user.id);
  }

  @Get('my-transactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user transactions' })
  @ApiQuery({ name: 'role', required: false, enum: ['buyer', 'seller'] })
  async getUserTransactions(
    @Request() req: any,
    @Query('role') role?: 'buyer' | 'seller',
  ) {
    return this.escrowService.getUserTransactions(req.user.id, role);
  }

  @Post('release')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release escrow funds to seller (admin only)' })
  async releaseEscrow(@Request() req: any, @Body() dto: ReleaseEscrowDto) {
    return this.escrowService.releaseEscrow(
      dto.transactionId,
      req.user.id,
      req.user.tenantId,
      dto.notes,
    );
  }

  @Post('dispute')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'File a dispute for a transaction' })
  async disputeTransaction(@Request() req: any, @Body() dto: DisputeTransactionDto) {
    return this.escrowService.disputeTransaction(req.user.id, req.user.tenantId, dto);
  }

  @Post('resolve-dispute')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve a dispute (admin only)' })
  async resolveDispute(@Request() req: any, @Body() dto: ResolveDisputeDto) {
    return this.escrowService.resolveDispute(req.user.id, req.user.tenantId, dto);
  }

  @Delete('transaction/:transactionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a transaction (buyer only, before funding)' })
  async cancelTransaction(
    @Request() req: any,
    @Param('transactionId') transactionId: string,
  ) {
    return this.escrowService.cancelTransaction(
      transactionId,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get escrow summary (admin only)' })
  async getEscrowSummary() {
    return this.escrowService.getEscrowSummary();
  }
}
