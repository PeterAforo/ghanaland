import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PermitType {
  BUILDING_PERMIT = 'BUILDING_PERMIT',
  LAND_USE_PERMIT = 'LAND_USE_PERMIT',
  DEVELOPMENT_PERMIT = 'DEVELOPMENT_PERMIT',
  SUBDIVISION_PERMIT = 'SUBDIVISION_PERMIT',
  OCCUPANCY_PERMIT = 'OCCUPANCY_PERMIT',
  DEMOLITION_PERMIT = 'DEMOLITION_PERMIT',
  RENOVATION_PERMIT = 'RENOVATION_PERMIT',
}

export enum PermitDocumentType {
  SITE_PLAN = 'SITE_PLAN',
  ARCHITECTURAL_DRAWING = 'ARCHITECTURAL_DRAWING',
  STRUCTURAL_DRAWING = 'STRUCTURAL_DRAWING',
  LAND_TITLE = 'LAND_TITLE',
  SURVEY_PLAN = 'SURVEY_PLAN',
  TAX_CLEARANCE = 'TAX_CLEARANCE',
  ENVIRONMENTAL_ASSESSMENT = 'ENVIRONMENTAL_ASSESSMENT',
  ID_DOCUMENT = 'ID_DOCUMENT',
  PROOF_OF_OWNERSHIP = 'PROOF_OF_OWNERSHIP',
  OTHER = 'OTHER',
}

export class CreatePermitApplicationDto {
  @ApiProperty({ enum: PermitType })
  @IsEnum(PermitType)
  type: PermitType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiProperty({ example: '123 Main Street, Accra' })
  @IsString()
  propertyAddress: string;

  @ApiProperty({ example: 'Greater Accra' })
  @IsString()
  propertyRegion: string;

  @ApiProperty({ example: 'Accra Metropolitan' })
  @IsString()
  propertyDistrict: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  landSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landSizeUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  numberOfFloors?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedCost?: number;
}

export class UpdatePermitApplicationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyRegion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyDistrict?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  landSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  numberOfFloors?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedCost?: number;
}

export class AddPermitDocumentDto {
  @ApiProperty({ enum: PermitDocumentType })
  @IsEnum(PermitDocumentType)
  type: PermitDocumentType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  url: string;
}

export class UpdatePermitStatusDto {
  @ApiProperty({ enum: ['SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class VerifyDocumentDto {
  @ApiProperty()
  @IsBoolean()
  verified: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
