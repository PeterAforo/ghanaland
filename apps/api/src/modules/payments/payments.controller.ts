import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a payment' })
  async initiatePayment(@Request() req: any, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(req.user.id, dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Hubtel webhook endpoint' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-hubtel-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(payload);
  }

  @Get(':paymentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details' })
  async getPayment(@Request() req: any, @Param('paymentId') paymentId: string) {
    return this.paymentsService.getPayment(paymentId, req.user.id);
  }

  @Get('transaction/:transactionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments for a transaction' })
  async getTransactionPayments(
    @Request() req: any,
    @Param('transactionId') transactionId: string,
  ) {
    return this.paymentsService.getTransactionPayments(transactionId, req.user.id);
  }

  @Post(':paymentId/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment status with provider' })
  async verifyPayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.verifyPayment(paymentId);
  }

  @Post(':paymentId/simulate-success')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate successful payment (dev only)' })
  async simulatePaymentSuccess(@Param('paymentId') paymentId: string) {
    // Simulate a successful webhook for development/testing
    return this.paymentsService.handleWebhook({
      data: {
        tx_ref: paymentId,
        status: 'successful',
        amount: 0,
        currency: 'GHS',
      },
      event: 'charge.completed',
    });
  }
}
