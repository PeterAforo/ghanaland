import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateUserLandDto,
  UpdateUserLandDto,
  UpdateStageStatusDto,
  AddLandDocumentDto,
  LandJourneyStage,
  JourneyStageStatus,
  JOURNEY_STAGE_CONFIG,
} from './dto';

// Order of stages in the journey
const STAGE_ORDER: LandJourneyStage[] = [
  LandJourneyStage.LAND_ACQUIRED,
  LandJourneyStage.LAND_SEARCH,
  LandJourneyStage.SURVEY_SITE_PLAN,
  LandJourneyStage.INDENTURE_PREPARATION,
  LandJourneyStage.STAMP_DUTY,
  LandJourneyStage.LAND_VALUATION,
  LandJourneyStage.TITLE_REGISTRATION,
  LandJourneyStage.TITLE_CERTIFICATE,
  LandJourneyStage.ARCHITECTURAL_DESIGN,
  LandJourneyStage.STRUCTURAL_DESIGN,
  LandJourneyStage.DEVELOPMENT_PERMIT,
  LandJourneyStage.BUILDING_PERMIT_APPLICATION,
  LandJourneyStage.SITE_INSPECTION,
  LandJourneyStage.TECHNICAL_REVIEW,
  LandJourneyStage.BUILDING_PERMIT_ISSUED,
  LandJourneyStage.READY_TO_BUILD,
];

@Injectable()
export class LandJourneyService {
  constructor(private prisma: PrismaService) {}

  // Get all lands for a user
  async getUserLands(userId: string) {
    const lands = await this.prisma.userLand.findMany({
      where: { userId },
      include: {
        stages: {
          orderBy: { createdAt: 'asc' },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        transaction: {
          include: {
            listing: {
              select: { id: true, title: true, media: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add stage config and progress info to each land
    const landsWithProgress = lands.map((land) => {
      const currentStageIndex = STAGE_ORDER.indexOf(land.currentStage as LandJourneyStage);
      const progress = Math.round((currentStageIndex / (STAGE_ORDER.length - 1)) * 100);
      
      return {
        ...land,
        progress,
        totalStages: STAGE_ORDER.length,
        currentStageIndex,
        stageConfig: JOURNEY_STAGE_CONFIG,
      };
    });

    return {
      success: true,
      data: landsWithProgress,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Get single land with full details
  async getLandById(landId: string, userId: string) {
    const land = await this.prisma.userLand.findUnique({
      where: { id: landId },
      include: {
        stages: {
          include: {
            serviceRequest: {
              include: {
                professional: {
                  include: { user: { select: { fullName: true } } },
                },
                service: true,
              },
            },
            professional: {
              include: { user: { select: { fullName: true } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        transaction: {
          include: {
            listing: true,
          },
        },
      },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    if (land.userId !== userId) {
      throw new ForbiddenException('You do not have access to this land');
    }

    // Build full journey with all stages
    const currentStageIndex = STAGE_ORDER.indexOf(land.currentStage as LandJourneyStage);
    const progress = Math.round((currentStageIndex / (STAGE_ORDER.length - 1)) * 100);

    // Create a map of existing stage records
    const stageRecordMap = new Map(land.stages.map((s) => [s.stage, s]));

    // Build complete journey stages
    const journey = STAGE_ORDER.map((stage, index) => {
      const config = JOURNEY_STAGE_CONFIG[stage];
      const record = stageRecordMap.get(stage);
      
      let status: JourneyStageStatus;
      if (record) {
        status = record.status as JourneyStageStatus;
      } else if (index < currentStageIndex) {
        status = JourneyStageStatus.COMPLETED;
      } else if (index === currentStageIndex) {
        status = JourneyStageStatus.IN_PROGRESS;
      } else {
        status = JourneyStageStatus.NOT_STARTED;
      }

      // Get documents for this stage
      const stageDocuments = land.documents.filter((d) => d.stage === stage);

      return {
        stage,
        index,
        ...config,
        status,
        record,
        documents: stageDocuments,
        isCurrentStage: index === currentStageIndex,
        isCompleted: status === JourneyStageStatus.COMPLETED,
        isLocked: index > currentStageIndex + 1, // Can only work on current or next stage
      };
    });

    return {
      success: true,
      data: {
        ...land,
        progress,
        totalStages: STAGE_ORDER.length,
        currentStageIndex,
        journey,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Get completed transactions that don't have a UserLand yet
  async getUnlinkedTransactions(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        buyerId: userId,
        status: { in: ['RELEASED', 'COMPLETED'] },
        userLand: null, // No UserLand linked
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            region: true,
            district: true,
            town: true,
            sizeAcres: true,
            media: { take: 1 },
          },
        },
        seller: {
          select: { fullName: true, phone: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return {
      success: true,
      data: transactions,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Create UserLand from an existing completed transaction
  async createLandFromTransaction(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: true,
        seller: { select: { fullName: true, phone: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.buyerId !== userId) {
      throw new ForbiddenException('This transaction does not belong to you');
    }

    if (!['RELEASED', 'COMPLETED'].includes(transaction.status)) {
      throw new BadRequestException('Transaction is not completed yet');
    }

    // Check if land already exists
    const existingLand = await this.prisma.userLand.findUnique({
      where: { transactionId },
    });

    if (existingLand) {
      throw new BadRequestException('Land already exists for this transaction');
    }

    const listing = transaction.listing;

    const land = await this.prisma.userLand.create({
      data: {
        userId,
        transactionId,
        title: listing.title,
        description: listing.description,
        region: listing.region,
        district: listing.district,
        locality: listing.town || listing.district,
        landSize: listing.sizeAcres,
        landSizeUnit: 'acres',
        gpsAddress: listing.address,
        coordinates: listing.latitude && listing.longitude
          ? { lat: listing.latitude, lng: listing.longitude }
          : undefined,
        purchaseDate: transaction.completedAt || new Date(),
        purchasePrice: transaction.agreedPriceGhs,
        sellerName: transaction.seller?.fullName,
        sellerContact: transaction.seller?.phone,
        currentStage: 'LAND_ACQUIRED',
      },
    });

    // Create initial stage record
    await this.prisma.landJourneyStageRecord.create({
      data: {
        landId: land.id,
        stage: 'LAND_ACQUIRED',
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: `Purchased from ${transaction.seller?.fullName || 'seller'} via Ghana Lands platform`,
      },
    });

    return {
      success: true,
      data: land,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Create a new land (manually added)
  async createLand(userId: string, dto: CreateUserLandDto) {
    // If transactionId provided, verify it belongs to user
    if (dto.transactionId) {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: dto.transactionId },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.buyerId !== userId) {
        throw new ForbiddenException('This transaction does not belong to you');
      }

      // Check if land already exists for this transaction
      const existingLand = await this.prisma.userLand.findUnique({
        where: { transactionId: dto.transactionId },
      });

      if (existingLand) {
        throw new BadRequestException('Land already exists for this transaction');
      }
    }

    const land = await this.prisma.userLand.create({
      data: {
        userId,
        transactionId: dto.transactionId,
        title: dto.title,
        description: dto.description,
        region: dto.region,
        district: dto.district,
        locality: dto.locality,
        plotNumber: dto.plotNumber,
        landSize: dto.landSize,
        landSizeUnit: dto.landSizeUnit || 'acres',
        gpsAddress: dto.gpsAddress,
        coordinates: dto.coordinates,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchasePrice: dto.purchasePrice,
        sellerName: dto.sellerName,
        sellerContact: dto.sellerContact,
        currentStage: 'LAND_ACQUIRED',
      },
      include: {
        stages: true,
        documents: true,
      },
    });

    // Create initial stage record
    await this.prisma.landJourneyStageRecord.create({
      data: {
        landId: land.id,
        stage: 'LAND_ACQUIRED',
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      data: land,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Update land details
  async updateLand(landId: string, userId: string, dto: UpdateUserLandDto) {
    const land = await this.prisma.userLand.findUnique({
      where: { id: landId },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    if (land.userId !== userId) {
      throw new ForbiddenException('You do not have access to this land');
    }

    const updated = await this.prisma.userLand.update({
      where: { id: landId },
      data: dto,
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Update stage status
  async updateStageStatus(
    landId: string,
    stage: LandJourneyStage,
    userId: string,
    dto: UpdateStageStatusDto,
  ) {
    const land = await this.prisma.userLand.findUnique({
      where: { id: landId },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    if (land.userId !== userId) {
      throw new ForbiddenException('You do not have access to this land');
    }

    const stageIndex = STAGE_ORDER.indexOf(stage);
    const currentStageIndex = STAGE_ORDER.indexOf(land.currentStage as LandJourneyStage);

    // Can only update current stage or previous stages
    if (stageIndex > currentStageIndex + 1) {
      throw new BadRequestException('Cannot update a future stage');
    }

    // Upsert stage record
    const stageRecord = await this.prisma.landJourneyStageRecord.upsert({
      where: {
        landId_stage: { landId, stage },
      },
      update: {
        status: dto.status,
        notes: dto.notes,
        serviceRequestId: dto.serviceRequestId,
        completedAt: dto.status === 'COMPLETED' ? new Date() : null,
      },
      create: {
        landId,
        stage,
        status: dto.status,
        notes: dto.notes,
        serviceRequestId: dto.serviceRequestId,
        completedAt: dto.status === 'COMPLETED' ? new Date() : null,
      },
    });

    // If stage completed and it's the current stage, advance to next
    if (dto.status === 'COMPLETED' && stageIndex === currentStageIndex) {
      const nextStage = STAGE_ORDER[stageIndex + 1];
      if (nextStage) {
        await this.prisma.userLand.update({
          where: { id: landId },
          data: {
            currentStage: nextStage,
            journeyCompletedAt: nextStage === 'READY_TO_BUILD' ? new Date() : null,
          },
        });
      }
    }

    return {
      success: true,
      data: stageRecord,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Add document to land
  async addDocument(landId: string, userId: string, dto: AddLandDocumentDto) {
    const land = await this.prisma.userLand.findUnique({
      where: { id: landId },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    if (land.userId !== userId) {
      throw new ForbiddenException('You do not have access to this land');
    }

    const document = await this.prisma.landDocument.create({
      data: {
        landId,
        stage: dto.stage,
        documentType: dto.documentType,
        name: dto.name,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        notes: dto.notes,
      },
    });

    return {
      success: true,
      data: document,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Delete document
  async deleteDocument(landId: string, documentId: string, userId: string) {
    const land = await this.prisma.userLand.findUnique({
      where: { id: landId },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    if (land.userId !== userId) {
      throw new ForbiddenException('You do not have access to this land');
    }

    const document = await this.prisma.landDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.landId !== landId) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.landDocument.delete({
      where: { id: documentId },
    });

    return {
      success: true,
      data: null,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Get stage configuration (for frontend)
  async getStageConfig() {
    return {
      success: true,
      data: {
        stages: STAGE_ORDER,
        config: JOURNEY_STAGE_CONFIG,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Get professionals for a specific stage
  async getProfessionalsForStage(stage: LandJourneyStage) {
    const config = JOURNEY_STAGE_CONFIG[stage];
    
    if (!config.professionalType) {
      return {
        success: true,
        data: [],
        meta: { requestId: `req_${Date.now()}` },
        error: null,
      };
    }

    const professionals = await this.prisma.professionalProfile.findMany({
      where: {
        type: config.professionalType as any,
        isAvailable: true,
        licenseVerified: true,
      },
      include: {
        user: {
          select: { fullName: true, avatarUrl: true },
        },
        services: {
          where: { isActive: true },
          include: { catalog: true },
        },
      },
      orderBy: { rating: 'desc' },
    });

    return {
      success: true,
      data: professionals,
      meta: { 
        requestId: `req_${Date.now()}`,
        stage,
        professionalType: config.professionalType,
      },
      error: null,
    };
  }

  // Link a service request to a journey stage
  async linkServiceRequest(
    landId: string,
    stage: LandJourneyStage,
    serviceRequestId: string,
    userId: string,
  ) {
    const land = await this.prisma.userLand.findUnique({
      where: { id: landId },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    if (land.userId !== userId) {
      throw new ForbiddenException('You do not have access to this land');
    }

    const serviceRequest = await this.prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    });

    if (!serviceRequest) {
      throw new NotFoundException('Service request not found');
    }

    if (serviceRequest.clientId !== userId) {
      throw new ForbiddenException('This service request does not belong to you');
    }

    // Upsert stage record with service request
    const stageRecord = await this.prisma.landJourneyStageRecord.upsert({
      where: {
        landId_stage: { landId, stage },
      },
      update: {
        serviceRequestId,
        professionalId: serviceRequest.professionalId,
        status: 'PENDING_PROFESSIONAL',
      },
      create: {
        landId,
        stage,
        serviceRequestId,
        professionalId: serviceRequest.professionalId,
        status: 'PENDING_PROFESSIONAL',
      },
    });

    return {
      success: true,
      data: stageRecord,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Delete a land
  async deleteLand(landId: string, userId: string) {
    const land = await this.prisma.userLand.findUnique({
      where: { id: landId },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    if (land.userId !== userId) {
      throw new ForbiddenException('You do not have access to this land');
    }

    await this.prisma.userLand.delete({
      where: { id: landId },
    });

    return {
      success: true,
      data: null,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
