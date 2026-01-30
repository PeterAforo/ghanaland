import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ProfessionalType {
  AGENT = 'AGENT',
  SURVEYOR = 'SURVEYOR',
  ARCHITECT = 'ARCHITECT',
  LAWYER = 'LAWYER',
  ENGINEER = 'ENGINEER',
  VALUER = 'VALUER',
  PLANNER = 'PLANNER',
}

export enum PriceType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  NEGOTIABLE = 'NEGOTIABLE',
}

export class CreateProfessionalProfileDto {
  @ApiProperty({ enum: ProfessionalType })
  @IsEnum(ProfessionalType)
  type: ProfessionalType;

  @ApiProperty({ example: 'Licensed Land Surveyor' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  hourlyRateGhs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fixedRateGhs?: number;
}

export class UpdateProfessionalProfileDto {
  @ApiPropertyOptional({ enum: ProfessionalType })
  @IsOptional()
  @IsEnum(ProfessionalType)
  type?: ProfessionalType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  hourlyRateGhs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fixedRateGhs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class CreateServiceDto {
  @ApiPropertyOptional({ description: 'ID of the service catalog item (required for controlled services)' })
  @IsOptional()
  @IsString()
  catalogId?: string;

  @ApiProperty({ example: 'Land Survey' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceGhs: number;

  @ApiPropertyOptional({ enum: PriceType })
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;
}

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsString()
  professionalId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiProperty({ example: 'I need a land survey for my property in Accra' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Link to a specific land in My Lands' })
  @IsOptional()
  @IsString()
  landId?: string;

  @ApiPropertyOptional({ description: 'Link to a specific journey stage' })
  @IsOptional()
  @IsString()
  journeyStage?: string;
}

export class UpdateServiceRequestStatusDto {
  @ApiProperty({ enum: ['ACCEPTED', 'ESCROW_FUNDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED'] })
  @IsString()
  status: 'ACCEPTED' | 'ESCROW_FUNDED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  agreedPriceGhs?: number;
}

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class SearchProfessionalsDto {
  @ApiPropertyOptional({ enum: ProfessionalType })
  @IsOptional()
  @IsEnum(ProfessionalType)
  type?: ProfessionalType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  verified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;
}
