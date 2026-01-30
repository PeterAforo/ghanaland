import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { FlutterwaveService } from './flutterwave.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationTemplate } from '../notifications/dto';
import { InitiatePaymentDto } from './dto';
import { PaymentStatus, PaymentType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private flutterwave: FlutterwaveService,
    private notifications: NotificationsService,
    private config: ConfigService,
  ) {}

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      include: { buyer: true, listing: true, seller: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.buyerId !== userId) {
      throw new BadRequestException('You are not the buyer of this transaction');
    }

    // Check for existing pending/processing payment for this transaction
    const existingPendingPayment = await this.prisma.payment.findFirst({
      where: {
        transactionId: dto.transactionId,
        status: {
          in: [PaymentStatus.INITIATED, PaymentStatus.PROCESSING],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPendingPayment) {
      // Return existing pending payment instead of creating duplicate
      this.logger.log(`Returning existing pending payment: ${existingPendingPayment.id}`);
      const metadata = existingPendingPayment.metadata as any;
      return {
        success: true,
        data: {
          paymentId: existingPendingPayment.id,
          status: existingPendingPayment.status,
          amount: existingPendingPayment.amountGhs,
          checkoutUrl: metadata?.flutterwaveResponse?.link,
          checkoutId: metadata?.flutterwaveResponse?.id,
        },
        meta: { requestId: `req_${Date.now()}` },
        error: null,
      };
    }

    const idempotencyKey = dto.idempotencyKey || uuidv4();

    const payment = await this.prisma.payment.create({
      data: {
        transactionId: dto.transactionId,
        amountGhs: dto.amount,
        type: PaymentType.ESCROW_DEPOSIT,
        status: PaymentStatus.INITIATED,
        provider: 'flutterwave',
        idempotencyKey,
        metadata: {
          paymentMethod: dto.paymentMethod,
          mobileNumber: dto.mobileNumber,
          customerName: dto.customerName || transaction.buyer.fullName,
          customerEmail: dto.customerEmail || transaction.buyer.email,
        },
      },
    });

    const webUrl = this.config.get('WEB_URL', 'http://localhost:3002');
    const returnUrl = dto.returnUrl || `${webUrl}/dashboard/transactions/${dto.transactionId}?status=success`;

    // Initiate Flutterwave payment
    const flutterwaveResponse = await this.flutterwave.initiatePayment({
      amount: dto.amount,
      currency: 'GHS',
      redirectUrl: returnUrl,
      customerEmail: dto.customerEmail || transaction.buyer.email,
      customerName: dto.customerName || transaction.buyer.fullName,
      customerPhone: dto.mobileNumber,
      txRef: payment.id,
      title: 'Ghana Lands Payment',
      description: `Payment for ${transaction.listing.title}`,
      meta: {
        transactionId: dto.transactionId,
        paymentType: dto.paymentType,
      },
    });

    if (flutterwaveResponse.status === 'error') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...(payment.metadata as object),
            error: flutterwaveResponse.message,
          },
        },
      });

      throw new BadRequestException(flutterwaveResponse.message || 'Payment initiation failed');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PROCESSING,
        providerRef: flutterwaveResponse.data?.id?.toString(),
        metadata: {
          ...(payment.metadata as object),
          flutterwaveResponse: flutterwaveResponse.data,
        },
      },
    });

    return this.formatPaymentResponse(payment, flutterwaveResponse);
  }

  async handleWebhook(payload: any) {
    this.logger.log(`Received webhook: ${JSON.stringify(payload)}`);

    // Flutterwave webhook format
    const txRef = payload.data?.tx_ref || payload.txRef;
    if (!txRef) {
      this.logger.warn('Webhook missing tx_ref');
      return { received: true };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: txRef },
      include: { 
        transaction: {
          include: { buyer: true, seller: true, listing: true },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${txRef}`);
      return { received: true };
    }

    // Flutterwave success status
    const isSuccess = payload.data?.status === 'successful' || payload.status === 'successful';
    const newStatus = isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          paidAt: isSuccess ? new Date() : null,
          metadata: {
            ...(payment.metadata as object),
            webhookPayload: payload,
          },
        },
      });

      if (isSuccess && payment.type === PaymentType.ESCROW_DEPOSIT) {
        await tx.transaction.update({
          where: { id: payment.transactionId },
          data: {
            status: 'ESCROW_FUNDED',
            escrowStatus: 'FUNDED',
          },
        });
      }
    });

    // Notify seller about payment (outside transaction for non-critical operation)
    if (isSuccess) {
      try {
        await this.notifications.sendNotification(
          payment.transaction.sellerId,
          NotificationTemplate.PAYMENT_RECEIVED,
          NotificationType.BOTH,
          {
            amount: String(payment.amountGhs),
            listing: payment.transaction.listing.title,
            reference: payment.id,
          },
        );
      } catch (err: any) {
        this.logger.error(`Failed to notify seller: ${err.message}`);
      }
    }

    this.logger.log(`Payment ${payment.id} updated to ${newStatus}`);

    return { received: true, status: newStatus };
  }

  async getPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        transaction: {
          include: { listing: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (
      payment.transaction.buyerId !== userId &&
      payment.transaction.sellerId !== userId
    ) {
      throw new BadRequestException('You do not have access to this payment');
    }

    return {
      success: true,
      data: payment,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getTransactionPayments(transactionId: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new BadRequestException('You do not have access to this transaction');
    }

    const payments = await this.prisma.payment.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: payments,
      meta: { requestId: `req_${Date.now()}`, count: payments.length },
      error: null,
    };
  }

  async verifyPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    try {
      // Verify with Flutterwave using tx_ref (payment.id)
      const verifyResponse = await this.flutterwave.verifyByTxRef(payment.id);

      const isSuccess = verifyResponse.status === 'success' && 
                        verifyResponse.data?.status === 'successful';
      
      if (isSuccess && payment.status !== PaymentStatus.COMPLETED) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
            providerRef: verifyResponse.data?.flw_ref,
          },
        });
      }

      return {
        success: true,
        data: {
          paymentId: payment.id,
          status: isSuccess ? 'COMPLETED' : payment.status,
          providerStatus: verifyResponse.data,
        },
        meta: { requestId: `req_${Date.now()}` },
        error: null,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        meta: { requestId: `req_${Date.now()}` },
        error: { message: error.message },
      };
    }
  }

  private formatPaymentResponse(payment: any, flutterwaveResponse: any) {
    return {
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amountGhs,
        checkoutUrl: flutterwaveResponse?.data?.link,
        checkoutId: flutterwaveResponse?.data?.id,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
