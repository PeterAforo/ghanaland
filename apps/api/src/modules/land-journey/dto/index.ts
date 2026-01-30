import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LandJourneyStage {
  LAND_ACQUIRED = 'LAND_ACQUIRED',
  LAND_SEARCH = 'LAND_SEARCH',
  SURVEY_SITE_PLAN = 'SURVEY_SITE_PLAN',
  INDENTURE_PREPARATION = 'INDENTURE_PREPARATION',
  STAMP_DUTY = 'STAMP_DUTY',
  LAND_VALUATION = 'LAND_VALUATION',
  TITLE_REGISTRATION = 'TITLE_REGISTRATION',
  TITLE_CERTIFICATE = 'TITLE_CERTIFICATE',
  ARCHITECTURAL_DESIGN = 'ARCHITECTURAL_DESIGN',
  STRUCTURAL_DESIGN = 'STRUCTURAL_DESIGN',
  DEVELOPMENT_PERMIT = 'DEVELOPMENT_PERMIT',
  BUILDING_PERMIT_APPLICATION = 'BUILDING_PERMIT_APPLICATION',
  SITE_INSPECTION = 'SITE_INSPECTION',
  TECHNICAL_REVIEW = 'TECHNICAL_REVIEW',
  BUILDING_PERMIT_ISSUED = 'BUILDING_PERMIT_ISSUED',
  READY_TO_BUILD = 'READY_TO_BUILD',
}

export enum JourneyStageStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_PROFESSIONAL = 'PENDING_PROFESSIONAL',
  PENDING_DOCUMENTS = 'PENDING_DOCUMENTS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export enum LandDocumentType {
  SALE_AGREEMENT = 'SALE_AGREEMENT',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  LAND_SEARCH_REPORT = 'LAND_SEARCH_REPORT',
  SITE_PLAN = 'SITE_PLAN',
  SURVEY_REPORT = 'SURVEY_REPORT',
  INDENTURE = 'INDENTURE',
  CERTIFIED_INDENTURE = 'CERTIFIED_INDENTURE',
  STAMP_DUTY_RECEIPT = 'STAMP_DUTY_RECEIPT',
  VALUATION_REPORT = 'VALUATION_REPORT',
  TITLE_CERTIFICATE = 'TITLE_CERTIFICATE',
  ARCHITECTURAL_DRAWINGS = 'ARCHITECTURAL_DRAWINGS',
  STRUCTURAL_DRAWINGS = 'STRUCTURAL_DRAWINGS',
  ELECTRICAL_DRAWINGS = 'ELECTRICAL_DRAWINGS',
  PLUMBING_DRAWINGS = 'PLUMBING_DRAWINGS',
  DEVELOPMENT_PERMIT = 'DEVELOPMENT_PERMIT',
  BUILDING_PERMIT = 'BUILDING_PERMIT',
  EPA_PERMIT = 'EPA_PERMIT',
  FIRE_CERTIFICATE = 'FIRE_CERTIFICATE',
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  OTHER = 'OTHER',
}

// Stage configuration with required professionals and documents
export const JOURNEY_STAGE_CONFIG: Record<
  LandJourneyStage,
  {
    name: string;
    description: string;
    professionalType?: string;
    requiredDocuments: LandDocumentType[];
    outputDocuments: LandDocumentType[];
    estimatedDays: number;
    estimatedCostGhs?: { min: number; max: number };
  }
> = {
  [LandJourneyStage.LAND_ACQUIRED]: {
    name: 'Land Acquired',
    description: 'You have purchased or own the land',
    requiredDocuments: [],
    outputDocuments: [LandDocumentType.SALE_AGREEMENT, LandDocumentType.PAYMENT_RECEIPT],
    estimatedDays: 0,
  },
  [LandJourneyStage.LAND_SEARCH]: {
    name: 'Land Search',
    description: 'Conduct a search at the Lands Commission to verify ownership and check for disputes',
    professionalType: 'LAWYER',
    requiredDocuments: [LandDocumentType.SALE_AGREEMENT],
    outputDocuments: [LandDocumentType.LAND_SEARCH_REPORT],
    estimatedDays: 7,
    estimatedCostGhs: { min: 1000, max: 1500 },
  },
  [LandJourneyStage.SURVEY_SITE_PLAN]: {
    name: 'Survey & Site Plan',
    description: 'Hire a licensed surveyor to verify boundaries and create an official site plan',
    professionalType: 'SURVEYOR',
    requiredDocuments: [LandDocumentType.SALE_AGREEMENT],
    outputDocuments: [LandDocumentType.SITE_PLAN, LandDocumentType.SURVEY_REPORT],
    estimatedDays: 7,
    estimatedCostGhs: { min: 1500, max: 3500 },
  },
  [LandJourneyStage.INDENTURE_PREPARATION]: {
    name: 'Indenture Preparation',
    description: 'Prepare or verify the indenture document with a licensed lawyer',
    professionalType: 'LAWYER',
    requiredDocuments: [LandDocumentType.SITE_PLAN, LandDocumentType.LAND_SEARCH_REPORT],
    outputDocuments: [LandDocumentType.CERTIFIED_INDENTURE],
    estimatedDays: 14,
    estimatedCostGhs: { min: 2000, max: 3500 },
  },
  [LandJourneyStage.STAMP_DUTY]: {
    name: 'Stamp Duty Payment',
    description: 'Pay stamp duty at the Lands Commission (0.5-1% of land value)',
    professionalType: 'LAWYER',
    requiredDocuments: [LandDocumentType.CERTIFIED_INDENTURE],
    outputDocuments: [LandDocumentType.STAMP_DUTY_RECEIPT],
    estimatedDays: 5,
    estimatedCostGhs: { min: 500, max: 5000 },
  },
  [LandJourneyStage.LAND_VALUATION]: {
    name: 'Land Valuation',
    description: 'Get the land professionally valued for registration purposes',
    professionalType: 'VALUER',
    requiredDocuments: [LandDocumentType.SITE_PLAN],
    outputDocuments: [LandDocumentType.VALUATION_REPORT],
    estimatedDays: 5,
    estimatedCostGhs: { min: 800, max: 1500 },
  },
  [LandJourneyStage.TITLE_REGISTRATION]: {
    name: 'Title Registration',
    description: 'Submit all documents to Lands Commission for title registration',
    professionalType: 'LAWYER',
    requiredDocuments: [
      LandDocumentType.CERTIFIED_INDENTURE,
      LandDocumentType.STAMP_DUTY_RECEIPT,
      LandDocumentType.VALUATION_REPORT,
      LandDocumentType.SITE_PLAN,
    ],
    outputDocuments: [],
    estimatedDays: 30,
    estimatedCostGhs: { min: 3000, max: 5000 },
  },
  [LandJourneyStage.TITLE_CERTIFICATE]: {
    name: 'Title Certificate',
    description: 'Receive your Land Title Certificate from the Lands Commission',
    requiredDocuments: [],
    outputDocuments: [LandDocumentType.TITLE_CERTIFICATE],
    estimatedDays: 30,
  },
  [LandJourneyStage.ARCHITECTURAL_DESIGN]: {
    name: 'Architectural Design',
    description: 'Hire an architect to design your building plans',
    professionalType: 'ARCHITECT',
    requiredDocuments: [LandDocumentType.SITE_PLAN],
    outputDocuments: [LandDocumentType.ARCHITECTURAL_DRAWINGS],
    estimatedDays: 21,
    estimatedCostGhs: { min: 5000, max: 25000 },
  },
  [LandJourneyStage.STRUCTURAL_DESIGN]: {
    name: 'Structural Design',
    description: 'Hire a structural engineer to prepare structural drawings',
    professionalType: 'ENGINEER',
    requiredDocuments: [LandDocumentType.ARCHITECTURAL_DRAWINGS],
    outputDocuments: [LandDocumentType.STRUCTURAL_DRAWINGS],
    estimatedDays: 14,
    estimatedCostGhs: { min: 4000, max: 10000 },
  },
  [LandJourneyStage.DEVELOPMENT_PERMIT]: {
    name: 'Development Permit',
    description: 'Apply for development permit (required for larger projects)',
    professionalType: 'PLANNER',
    requiredDocuments: [LandDocumentType.SITE_PLAN, LandDocumentType.ARCHITECTURAL_DRAWINGS],
    outputDocuments: [LandDocumentType.DEVELOPMENT_PERMIT],
    estimatedDays: 14,
    estimatedCostGhs: { min: 2000, max: 3000 },
  },
  [LandJourneyStage.BUILDING_PERMIT_APPLICATION]: {
    name: 'Building Permit Application',
    description: 'Submit building permit application to the District Assembly',
    professionalType: 'PLANNER',
    requiredDocuments: [
      LandDocumentType.SITE_PLAN,
      LandDocumentType.ARCHITECTURAL_DRAWINGS,
      LandDocumentType.STRUCTURAL_DRAWINGS,
      LandDocumentType.TITLE_CERTIFICATE,
    ],
    outputDocuments: [],
    estimatedDays: 7,
    estimatedCostGhs: { min: 1500, max: 2500 },
  },
  [LandJourneyStage.SITE_INSPECTION]: {
    name: 'Site Inspection',
    description: 'Assembly officials inspect your site for compliance',
    requiredDocuments: [],
    outputDocuments: [],
    estimatedDays: 14,
  },
  [LandJourneyStage.TECHNICAL_REVIEW]: {
    name: 'Technical Review',
    description: 'Technical committee reviews your building plans',
    requiredDocuments: [],
    outputDocuments: [],
    estimatedDays: 21,
  },
  [LandJourneyStage.BUILDING_PERMIT_ISSUED]: {
    name: 'Building Permit Issued',
    description: 'Your building permit has been approved and issued',
    requiredDocuments: [],
    outputDocuments: [LandDocumentType.BUILDING_PERMIT],
    estimatedDays: 7,
  },
  [LandJourneyStage.READY_TO_BUILD]: {
    name: 'Ready to Build',
    description: 'Congratulations! You have all permits and can start construction',
    requiredDocuments: [],
    outputDocuments: [],
    estimatedDays: 0,
  },
};

export class CreateUserLandDto {
  @ApiProperty({ example: 'My Residential Plot at East Legon' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Greater Accra' })
  @IsString()
  region: string;

  @ApiProperty({ example: 'Accra Metropolitan' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'East Legon' })
  @IsString()
  locality: string;

  @ApiPropertyOptional({ example: 'Plot 45, Block B' })
  @IsOptional()
  @IsString()
  plotNumber?: string;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  landSize?: number;

  @ApiPropertyOptional({ example: 'acres' })
  @IsOptional()
  @IsString()
  landSizeUnit?: string;

  @ApiPropertyOptional({ example: 'GA-123-4567' })
  @IsOptional()
  @IsString()
  gpsAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  coordinates?: { lat: number; lng: number };

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  purchasePrice?: number;

  @ApiPropertyOptional({ example: 'Nana Kwame Asante' })
  @IsOptional()
  @IsString()
  sellerName?: string;

  @ApiPropertyOptional({ example: '+233244123456' })
  @IsOptional()
  @IsString()
  sellerContact?: string;

  @ApiPropertyOptional({ description: 'Transaction ID if purchased on platform' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

export class UpdateUserLandDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  landSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gpsAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  coordinates?: { lat: number; lng: number };
}

export class UpdateStageStatusDto {
  @ApiProperty({ enum: JourneyStageStatus })
  @IsEnum(JourneyStageStatus)
  status: JourneyStageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Service request ID if engaging a professional' })
  @IsOptional()
  @IsString()
  serviceRequestId?: string;
}

export class AddLandDocumentDto {
  @ApiProperty({ enum: LandJourneyStage })
  @IsEnum(LandJourneyStage)
  stage: LandJourneyStage;

  @ApiProperty({ enum: LandDocumentType })
  @IsEnum(LandDocumentType)
  documentType: LandDocumentType;

  @ApiProperty({ example: 'Site Plan - Plot 45' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://storage.example.com/documents/site-plan.pdf' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fileSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
