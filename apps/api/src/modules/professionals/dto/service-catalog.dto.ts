import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProfessionalType } from './index';

export class CreateServiceCatalogDto {
  @ApiProperty({ enum: ProfessionalType })
  @IsEnum(ProfessionalType)
  professionalType: ProfessionalType;

  @ApiProperty({ example: 'Land Survey' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Complete boundary survey with GPS coordinates' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 500, description: 'Suggested base price in GHS' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceGhs: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationDays?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateServiceCatalogDto {
  @ApiPropertyOptional({ example: 'Land Survey' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceGhs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;
}
