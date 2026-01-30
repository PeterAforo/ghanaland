import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Document name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: DocumentType, description: 'Type of document' })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({ description: 'Associated listing ID' })
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ApiPropertyOptional({ description: 'Associated verification request ID' })
  @IsOptional()
  @IsUUID()
  verificationRequestId?: string;
}

export class GetSignedUrlDto {
  @ApiProperty({ description: 'Document ID' })
  @IsUUID()
  documentId: string;
}

export class DeleteDocumentDto {
  @ApiProperty({ description: 'Document ID to delete' })
  @IsUUID()
  documentId: string;
}
