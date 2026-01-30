import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  MOMO_MTN = 'momo-mtn',
  MOMO_VODAFONE = 'momo-vodafone',
  MOMO_AIRTELTIGO = 'momo-airteltigo',
  CARD = 'card',
}

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Amount in GHS' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Payment method' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment type (FULL, DEPOSIT, INSTALLMENT)' })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiPropertyOptional({ description: 'Return URL after payment' })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({ description: 'Mobile number for MoMo payments' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Idempotency key for duplicate prevention' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class HubtelWebhookDto {
  @ApiProperty()
  ResponseCode: string;

  @ApiProperty()
  Status: string;

  @ApiProperty()
  Data: {
    CheckoutId: string;
    SalesInvoiceId: string;
    ClientReference: string;
    Amount: number;
    Charges: number;
    AmountAfterCharges: number;
    Description: string;
    CustomerPhoneNumber: string;
    PaymentDetails: {
      MobileNumber?: string;
      PaymentType?: string;
      Channel?: string;
    };
  };
}

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Payment ID to verify' })
  @IsUUID()
  paymentId: string;
}

export class RefundPaymentDto {
  @ApiProperty({ description: 'Payment ID to refund' })
  @IsUUID()
  paymentId: string;

  @ApiPropertyOptional({ description: 'Reason for refund' })
  @IsOptional()
  @IsString()
  reason?: string;
}
