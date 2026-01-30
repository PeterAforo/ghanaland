import { IsString, IsEnum, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationRequestStatus } from '@prisma/client';

export class CreateVerificationRequestDto {
  @ApiProperty({ description: 'Listing ID to verify' })
  @IsUUID()
  listingId: string;

  @ApiPropertyOptional({ description: 'Additional notes for the verification request' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Document IDs to attach' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds?: string[];
}

export class ReviewVerificationDto {
  @ApiProperty({ description: 'Verification request ID' })
  @IsUUID()
  verificationRequestId: string;

  @ApiProperty({ enum: ['APPROVED', 'REJECTED'], description: 'Review decision' })
  @IsEnum(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Reason for rejection (required if rejected)' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVerificationStatusDto {
  @ApiProperty({ enum: VerificationRequestStatus, description: 'New status' })
  @IsEnum(VerificationRequestStatus)
  status: VerificationRequestStatus;

  @ApiPropertyOptional({ description: 'Notes about the status change' })
  @IsOptional()
  @IsString()
  notes?: string;
}
