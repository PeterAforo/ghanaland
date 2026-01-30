import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Listing ID' })
  @IsString()
  listingId: string;

  @ApiPropertyOptional({ description: 'Agreed price in GHS (calculated from listing if not provided)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  agreedPriceGhs?: number;

  @ApiPropertyOptional({ description: 'Number of plots (for plot-based listings)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  numberOfPlots?: number;

  @ApiPropertyOptional({ description: 'Number of plots (alias for numberOfPlots)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  plotCount?: number;

  @ApiPropertyOptional({ description: 'Payment type', enum: ['ONE_TIME', 'INSTALLMENT'] })
  @IsOptional()
  @IsEnum(['ONE_TIME', 'INSTALLMENT'])
  paymentType?: 'ONE_TIME' | 'INSTALLMENT';

  @ApiPropertyOptional({ description: 'Installment package ID' })
  @IsOptional()
  @IsString()
  installmentPackageId?: string;
}

export class FundEscrowDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Amount to fund in GHS' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Payment method' })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Mobile number for MoMo' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;
}

export class ReleaseEscrowDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  transactionId: string;

  @ApiPropertyOptional({ description: 'Notes for the release' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DisputeTransactionDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Reason for dispute' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional details' })
  @IsOptional()
  @IsString()
  details?: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  transactionId: string;

  @ApiProperty({ enum: ['RELEASE_TO_SELLER', 'REFUND_TO_BUYER', 'PARTIAL_REFUND'], description: 'Resolution decision' })
  @IsEnum(['RELEASE_TO_SELLER', 'REFUND_TO_BUYER', 'PARTIAL_REFUND'])
  resolution: 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER' | 'PARTIAL_REFUND';

  @ApiPropertyOptional({ description: 'Refund amount (for partial refund)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @ApiProperty({ description: 'Resolution notes' })
  @IsString()
  notes: string;
}
