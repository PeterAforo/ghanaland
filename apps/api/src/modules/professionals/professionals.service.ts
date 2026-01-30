import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateProfessionalProfileDto,
  UpdateProfessionalProfileDto,
  CreateServiceDto,
  CreateServiceRequestDto,
  UpdateServiceRequestStatusDto,
  CreateReviewDto,
  SearchProfessionalsDto,
} from './dto';
import { ServiceRequestStatus, ServicePaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const PLATFORM_FEE_PERCENTAGE = 10; // 10% platform commission

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(private prisma: PrismaService) {}

  // Helper to check if user has admin role
  private async isAdmin(userId: string): Promise<boolean> {
    const adminRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          name: { in: ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'] },
        },
      },
    });
    return !!adminRole;
  }

  private async requireAdmin(userId: string): Promise<void> {
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  // ============================================================================
  // PROFESSIONAL PROFILES
  // ============================================================================

  async createProfile(userId: string, dto: CreateProfessionalProfileDto) {
    const existing = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('You already have a professional profile');
    }

    const profile = await this.prisma.professionalProfile.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        bio: dto.bio,
        yearsExperience: dto.yearsExperience,
        licenseNumber: dto.licenseNumber,
        regions: dto.regions || [],
        languages: dto.languages || ['English'],
        hourlyRateGhs: dto.hourlyRateGhs,
        fixedRateGhs: dto.fixedRateGhs,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
    });

    return {
      success: true,
      data: profile,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfessionalProfileDto) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    const updated = await this.prisma.professionalProfile.update({
      where: { userId },
      data: {
        type: dto.type,
        title: dto.title,
        bio: dto.bio,
        yearsExperience: dto.yearsExperience,
        licenseNumber: dto.licenseNumber,
        regions: dto.regions,
        languages: dto.languages,
        hourlyRateGhs: dto.hourlyRateGhs,
        fixedRateGhs: dto.fixedRateGhs,
        isAvailable: dto.isAvailable,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        services: true,
      },
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        services: { where: { isActive: true } },
        reviews: {
          include: { reviewer: { select: { fullName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!profile) {
      return {
        success: true,
        data: null,
        meta: { requestId: `req_${Date.now()}` },
        error: null,
      };
    }

    return {
      success: true,
      data: profile,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getProfile(profileId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { id: profileId },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        services: { where: { isActive: true } },
        reviews: {
          include: { reviewer: { select: { fullName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    return {
      success: true,
      data: profile,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async searchProfessionals(dto: SearchProfessionalsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isAvailable: true,
    };

    if (dto.type) {
      where.type = dto.type;
    }

    if (dto.region) {
      where.regions = { has: dto.region };
    }

    if (dto.verified) {
      where.licenseVerified = true;
    }

    const [professionals, total] = await Promise.all([
      this.prisma.professionalProfile.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          services: { where: { isActive: true }, take: 3 },
        },
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.professionalProfile.count({ where }),
    ]);

    return {
      success: true,
      data: professionals,
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
      },
      error: null,
    };
  }

  // ============================================================================
  // SERVICES
  // ============================================================================

  async addService(userId: string, dto: CreateServiceDto) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    // Check if service with same catalogId already exists for this profile
    if (dto.catalogId) {
      const existingService = await this.prisma.professionalService.findFirst({
        where: {
          profileId: profile.id,
          catalogId: dto.catalogId,
          isActive: true,
        },
      });

      if (existingService) {
        throw new BadRequestException('You have already added this service');
      }
    }

    const service = await this.prisma.professionalService.create({
      data: {
        profileId: profile.id,
        catalogId: dto.catalogId,
        name: dto.name,
        description: dto.description,
        priceGhs: dto.priceGhs,
        priceType: dto.priceType || 'FIXED',
        durationDays: dto.durationDays,
      },
    });

    return {
      success: true,
      data: service,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async removeService(userId: string, serviceId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    const service = await this.prisma.professionalService.findFirst({
      where: { id: serviceId, profileId: profile.id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.professionalService.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    return {
      success: true,
      data: { message: 'Service removed' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // SERVICE REQUESTS
  // ============================================================================

  async createServiceRequest(userId: string, dto: CreateServiceRequestDto) {
    const professional = await this.prisma.professionalProfile.findUnique({
      where: { id: dto.professionalId },
      include: { user: true },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    if (professional.userId === userId) {
      throw new BadRequestException('You cannot request your own services');
    }

    if (!professional.isAvailable) {
      throw new BadRequestException('This professional is not currently available');
    }

    const request = await this.prisma.serviceRequest.create({
      data: {
        clientId: userId,
        professionalId: dto.professionalId,
        serviceId: dto.serviceId,
        listingId: dto.listingId,
        description: dto.description,
      },
      include: {
        professional: {
          include: { user: { select: { fullName: true } } },
        },
        service: true,
        listing: { select: { id: true, title: true } },
      },
    });

    // If linked to a land journey stage, create the stage record
    if (dto.landId && dto.journeyStage) {
      try {
        // Check if land belongs to user
        const land = await this.prisma.userLand.findFirst({
          where: { id: dto.landId, userId },
        });

        if (land) {
          // Create or update the journey stage record
          await this.prisma.landJourneyStageRecord.upsert({
            where: {
              landId_stage: {
                landId: dto.landId,
                stage: dto.journeyStage as any,
              },
            },
            create: {
              landId: dto.landId,
              stage: dto.journeyStage as any,
              status: 'PENDING_PROFESSIONAL',
              serviceRequestId: request.id,
              professionalId: dto.professionalId,
            },
            update: {
              status: 'PENDING_PROFESSIONAL',
              serviceRequestId: request.id,
              professionalId: dto.professionalId,
            },
          });
        }
      } catch (error) {
        this.logger.error('Failed to link service request to journey stage', error);
      }
    }

    return {
      success: true,
      data: request,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getMyRequests(userId: string, role: 'client' | 'professional') {
    // For professional role, first find their profile
    let where: any;
    if (role === 'client') {
      where = { clientId: userId };
    } else {
      // Find the professional profile for this user
      const profile = await this.prisma.professionalProfile.findUnique({
        where: { userId },
      });
      
      if (!profile) {
        this.logger.log(`No professional profile found for user ${userId}`);
        return {
          success: true,
          data: [],
          meta: { requestId: `req_${Date.now()}` },
          error: null,
        };
      }
      
      this.logger.log(`Found profile ${profile.id} for user ${userId}, fetching requests...`);
      where = { professionalId: profile.id };
    }

    const requests = await this.prisma.serviceRequest.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        professional: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
        service: true,
        listing: { select: { id: true, title: true } },
        milestones: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: requests,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getServiceRequest(requestId: string, userId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        client: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        professional: {
          include: { user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } } },
        },
        service: true,
        listing: { select: { id: true, title: true, region: true, district: true } },
        milestones: { orderBy: { createdAt: 'asc' } },
        review: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    // Check access
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (request.clientId !== userId && profile?.id !== request.professionalId) {
      throw new ForbiddenException('You do not have access to this request');
    }

    return {
      success: true,
      data: request,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateRequestStatus(
    requestId: string,
    userId: string,
    dto: UpdateServiceRequestStatusDto,
  ) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { professional: true, client: true },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    const isProfessional = request.professional.userId === userId;
    const isClient = request.clientId === userId;

    if (!isProfessional && !isClient) {
      throw new ForbiddenException('You do not have access to this request');
    }

    // Validate status transitions
    this.validateStatusTransition(request.status, dto.status, isProfessional, isClient);

    const updateData: any = {
      status: dto.status as ServiceRequestStatus,
    };

    // ACCEPTED: Professional accepts and sets price
    if (dto.status === 'ACCEPTED' && dto.agreedPriceGhs) {
      const agreedPrice = new Decimal(dto.agreedPriceGhs);
      const platformFee = agreedPrice.mul(PLATFORM_FEE_PERCENTAGE).div(100);
      const professionalNet = agreedPrice.sub(platformFee);
      
      updateData.agreedPriceGhs = agreedPrice;
      updateData.platformFeeGhs = platformFee;
      updateData.professionalNetGhs = professionalNet;
    }

    // IN_PROGRESS: Work started (after escrow funded)
    if (dto.status === 'IN_PROGRESS') {
      if (request.paymentStatus !== 'ESCROW_FUNDED') {
        throw new BadRequestException('Cannot start work until payment is in escrow');
      }
      updateData.startedAt = new Date();
    }

    // DELIVERED: Professional marks work as delivered
    if (dto.status === 'DELIVERED') {
      if (request.status !== 'IN_PROGRESS') {
        throw new BadRequestException('Can only deliver after work is in progress');
      }
    }

    // COMPLETED: Client confirms delivery, release escrow
    if (dto.status === 'COMPLETED') {
      if (request.status !== 'DELIVERED') {
        throw new BadRequestException('Can only complete after professional delivers');
      }
      updateData.completedAt = new Date();
      updateData.paymentStatus = 'RELEASED' as ServicePaymentStatus;
      updateData.escrowReleasedAt = new Date();
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        client: { select: { id: true, fullName: true } },
        professional: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        service: true,
      },
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    isProfessional: boolean,
    isClient: boolean,
  ) {
    const validTransitions: Record<string, { status: string; by: 'professional' | 'client' | 'both' }[]> = {
      PENDING: [
        { status: 'ACCEPTED', by: 'professional' },
        { status: 'CANCELLED', by: 'both' },
      ],
      ACCEPTED: [
        { status: 'ESCROW_FUNDED', by: 'client' }, // After payment
        { status: 'CANCELLED', by: 'both' },
      ],
      ESCROW_FUNDED: [
        { status: 'IN_PROGRESS', by: 'professional' },
        { status: 'CANCELLED', by: 'both' }, // Refund needed
      ],
      IN_PROGRESS: [
        { status: 'DELIVERED', by: 'professional' },
        { status: 'DISPUTED', by: 'both' },
      ],
      DELIVERED: [
        { status: 'COMPLETED', by: 'client' },
        { status: 'DISPUTED', by: 'both' },
      ],
    };

    const allowed = validTransitions[currentStatus];
    if (!allowed) {
      throw new BadRequestException(`Cannot change status from ${currentStatus}`);
    }

    const transition = allowed.find(t => t.status === newStatus);
    if (!transition) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    if (transition.by === 'professional' && !isProfessional) {
      throw new ForbiddenException('Only the professional can make this status change');
    }
    if (transition.by === 'client' && !isClient) {
      throw new ForbiddenException('Only the client can make this status change');
    }
  }

  // Fund escrow for a service request
  async fundEscrow(requestId: string, userId: string, paymentReference: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.clientId !== userId) {
      throw new ForbiddenException('Only the client can fund escrow');
    }

    if (request.status !== 'ACCEPTED') {
      throw new BadRequestException('Can only fund escrow for accepted requests');
    }

    if (!request.agreedPriceGhs) {
      throw new BadRequestException('No agreed price set for this request');
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'ESCROW_FUNDED',
        paymentStatus: 'ESCROW_FUNDED',
        escrowFundedAt: new Date(),
        paymentReference,
      },
      include: {
        client: { select: { id: true, fullName: true } },
        professional: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        service: true,
      },
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // REVIEWS
  // ============================================================================

  async createReview(requestId: string, userId: string, dto: CreateReviewDto) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { review: true, professional: true },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.clientId !== userId) {
      throw new ForbiddenException('Only the client can leave a review');
    }

    if (request.status !== 'COMPLETED') {
      throw new BadRequestException('Can only review completed requests');
    }

    if (request.review) {
      throw new BadRequestException('You have already reviewed this request');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.professionalReview.create({
        data: {
          requestId,
          profileId: request.professionalId,
          reviewerId: userId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      // Update professional's rating
      const allReviews = await tx.professionalReview.findMany({
        where: { profileId: request.professionalId },
        select: { rating: true },
      });

      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await tx.professionalProfile.update({
        where: { id: request.professionalId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: allReviews.length,
        },
      });

      return newReview;
    });

    return {
      success: true,
      data: review,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // SERVICE REQUEST DOCUMENTS
  // ============================================================================

  async uploadDocument(
    requestId: string,
    userId: string,
    dto: {
      type: string;
      category: string;
      name: string;
      description?: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
      isRequired?: boolean;
    },
  ) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { professional: true },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    const isProfessional = request.professional.userId === userId;
    const isClient = request.clientId === userId;

    if (!isProfessional && !isClient) {
      throw new ForbiddenException('You do not have access to this request');
    }

    // Validate document type based on role
    if (dto.type === 'INPUT' && !isClient) {
      throw new BadRequestException('Only clients can upload input documents');
    }
    if (dto.type === 'DELIVERABLE' && !isProfessional) {
      throw new BadRequestException('Only professionals can upload deliverables');
    }

    const document = await this.prisma.serviceRequestDocument.create({
      data: {
        requestId,
        uploadedById: userId,
        type: dto.type as any,
        category: dto.category as any,
        name: dto.name,
        description: dto.description,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        isRequired: dto.isRequired || false,
      },
      include: {
        uploadedBy: { select: { id: true, fullName: true } },
      },
    });

    return {
      success: true,
      data: document,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getRequestDocuments(requestId: string, userId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { professional: true },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    const isProfessional = request.professional.userId === userId;
    const isClient = request.clientId === userId;

    if (!isProfessional && !isClient) {
      throw new ForbiddenException('You do not have access to this request');
    }

    const documents = await this.prisma.serviceRequestDocument.findMany({
      where: { requestId },
      include: {
        uploadedBy: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    // Group by type
    const inputDocs = documents.filter(d => d.type === 'INPUT');
    const deliverables = documents.filter(d => d.type === 'DELIVERABLE');
    const referenceDocs = documents.filter(d => d.type === 'REFERENCE');
    const contracts = documents.filter(d => d.type === 'CONTRACT');

    return {
      success: true,
      data: {
        all: documents,
        inputDocuments: inputDocs,
        deliverables,
        referenceDocuments: referenceDocs,
        contracts,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async deleteDocument(documentId: string, userId: string) {
    const document = await this.prisma.serviceRequestDocument.findUnique({
      where: { id: documentId },
      include: { request: { include: { professional: true } } },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Only the uploader can delete
    if (document.uploadedById !== userId) {
      throw new ForbiddenException('You can only delete your own documents');
    }

    await this.prisma.serviceRequestDocument.delete({
      where: { id: documentId },
    });

    return {
      success: true,
      data: { deleted: true },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // SERVICE CONFIRMATIONS
  // ============================================================================

  async confirmAction(
    requestId: string,
    userId: string,
    dto: {
      type: string;
      notes?: string;
    },
  ) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { professional: true, documents: true, confirmations: true },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    const isProfessional = request.professional.userId === userId;
    const isClient = request.clientId === userId;

    if (!isProfessional && !isClient) {
      throw new ForbiddenException('You do not have access to this request');
    }

    const role = isProfessional ? 'PROFESSIONAL' : 'CLIENT';

    // Validate confirmation type based on role and request state
    this.validateConfirmation(request, dto.type, role, isProfessional, isClient);

    // Create or update confirmation
    const confirmation = await this.prisma.serviceConfirmation.upsert({
      where: {
        requestId_userId_type: {
          requestId,
          userId,
          type: dto.type as any,
        },
      },
      create: {
        requestId,
        userId,
        role: role as any,
        type: dto.type as any,
        confirmed: true,
        notes: dto.notes,
        confirmedAt: new Date(),
      },
      update: {
        confirmed: true,
        notes: dto.notes,
        confirmedAt: new Date(),
      },
    });

    // Handle state transitions based on confirmations
    await this.handleConfirmationStateChange(request, dto.type, role);

    return {
      success: true,
      data: confirmation,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  private validateConfirmation(
    request: any,
    type: string,
    role: string,
    isProfessional: boolean,
    isClient: boolean,
  ) {
    switch (type) {
      case 'DOCUMENTS_RECEIVED':
        // Professional confirms they received client's input documents
        if (!isProfessional) {
          throw new BadRequestException('Only professionals can confirm documents received');
        }
        if (request.status !== 'ESCROW_FUNDED' && request.status !== 'IN_PROGRESS') {
          throw new BadRequestException('Can only confirm documents after escrow is funded');
        }
        // Validate that required input documents are uploaded
        const reqInputDocs = this.getRequiredInputDocsForType(request.professional.type);
        const uplInputDocs = request.documents
          .filter((d: any) => d.type === 'INPUT')
          .map((d: any) => d.category);
        const missInputDocs = reqInputDocs.filter((doc: string) => !uplInputDocs.includes(doc));
        if (missInputDocs.length > 0) {
          throw new BadRequestException(
            `Missing required documents: ${missInputDocs.map((d: string) => d.replace(/_/g, ' ')).join(', ')}`
          );
        }
        break;

      case 'WORK_STARTED':
        if (!isProfessional) {
          throw new BadRequestException('Only professionals can confirm work started');
        }
        if (request.status !== 'ESCROW_FUNDED') {
          throw new BadRequestException('Can only start work after escrow is funded');
        }
        break;

      case 'DELIVERABLES_UPLOADED':
        if (!isProfessional) {
          throw new BadRequestException('Only professionals can confirm deliverables uploaded');
        }
        if (request.status !== 'IN_PROGRESS') {
          throw new BadRequestException('Can only upload deliverables when work is in progress');
        }
        // Validate that required output documents are uploaded
        const reqOutputDocs = this.getRequiredOutputDocsForType(request.professional.type);
        const uplOutputDocs = request.documents
          .filter((d: any) => d.type === 'DELIVERABLE')
          .map((d: any) => d.category);
        const missOutputDocs = reqOutputDocs.filter((doc: string) => !uplOutputDocs.includes(doc));
        if (missOutputDocs.length > 0) {
          throw new BadRequestException(
            `Missing required deliverables: ${missOutputDocs.map((d: string) => d.replace(/_/g, ' ')).join(', ')}`
          );
        }
        break;

      case 'WORK_ACCEPTED':
        if (!isClient) {
          throw new BadRequestException('Only clients can confirm work acceptance');
        }
        if (request.status !== 'DELIVERED') {
          throw new BadRequestException('Can only accept work after professional delivers');
        }
        break;

      case 'PAYMENT_RELEASED':
        // Only admin can release payment after client confirms work accepted
        throw new BadRequestException('Payment release is handled by admin after checklist verification');

      default:
        throw new BadRequestException('Invalid confirmation type');
    }
  }

  private async handleConfirmationStateChange(
    request: any,
    confirmationType: string,
    role: string,
  ) {
    const requestId = request.id;

    switch (confirmationType) {
      case 'WORK_STARTED':
        // Update request status to IN_PROGRESS
        await this.prisma.serviceRequest.update({
          where: { id: requestId },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
          },
        });
        break;

      case 'DELIVERABLES_UPLOADED':
        // Update request status to DELIVERED
        await this.prisma.serviceRequest.update({
          where: { id: requestId },
          data: {
            status: 'DELIVERED',
            professionalConfirmedWork: true,
          },
        });
        break;

      case 'WORK_ACCEPTED':
        // Client confirmed, update flag
        await this.prisma.serviceRequest.update({
          where: { id: requestId },
          data: {
            clientConfirmedWork: true,
          },
        });
        break;

      case 'PAYMENT_RELEASED':
        // Check if both parties have confirmed
        const confirmations = await this.prisma.serviceConfirmation.findMany({
          where: {
            requestId,
            type: 'PAYMENT_RELEASED',
            confirmed: true,
          },
        });

        const clientConfirmed = confirmations.some(c => c.role === 'CLIENT');
        const professionalConfirmed = confirmations.some(c => c.role === 'PROFESSIONAL');

        if (clientConfirmed && professionalConfirmed) {
          // Both confirmed - release escrow
          await this.prisma.serviceRequest.update({
            where: { id: requestId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              paymentStatus: 'RELEASED',
              escrowReleasedAt: new Date(),
              clientConfirmedWork: true,
              professionalConfirmedWork: true,
            },
          });
        }
        break;
    }
  }

  async getRequestConfirmations(requestId: string, userId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { professional: true },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    const isProfessional = request.professional.userId === userId;
    const isClient = request.clientId === userId;

    if (!isProfessional && !isClient) {
      throw new ForbiddenException('You do not have access to this request');
    }

    const confirmations = await this.prisma.serviceConfirmation.findMany({
      where: { requestId },
      include: {
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      data: confirmations,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Get required documents for a service type
  getRequiredDocuments(professionalType: string, serviceCategory?: string) {
    return {
      success: true,
      data: {
        input: this.getRequiredInputDocsForType(professionalType),
        output: this.getRequiredOutputDocsForType(professionalType),
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  private getRequiredInputDocsForType(professionalType: string): string[] {
    const requirements: Record<string, string[]> = {
      SURVEYOR: ['LAND_TITLE', 'PROOF_OF_OWNERSHIP', 'ID_DOCUMENT'],
      LAWYER: ['LAND_TITLE', 'SITE_PLAN', 'ID_DOCUMENT', 'PROOF_OF_OWNERSHIP'],
      ARCHITECT: ['SITE_PLAN', 'SURVEY_REPORT'],
      ENGINEER: ['ARCHITECTURAL_DRAWING', 'SITE_PLAN', 'SURVEY_REPORT'],
      VALUER: ['LAND_TITLE', 'SITE_PLAN', 'PROOF_OF_OWNERSHIP'],
      PLANNER: ['SITE_PLAN', 'ARCHITECTURAL_DRAWING', 'LAND_TITLE'],
      AGENT: ['ID_DOCUMENT'],
      LAND_AGENT: ['LAND_TITLE', 'ID_DOCUMENT'],
    };
    return requirements[professionalType] || [];
  }

  private getRequiredOutputDocsForType(professionalType: string): string[] {
    const requirements: Record<string, string[]> = {
      SURVEYOR: ['SURVEY_PLAN'],
      LAWYER: ['LEGAL_OPINION'],
      ARCHITECT: ['ARCHITECTURAL_DESIGN'],
      ENGINEER: ['STRUCTURAL_DESIGN'],
      VALUER: ['VALUATION_CERTIFICATE'],
      PLANNER: ['PERMIT_APPLICATION'],
      AGENT: ['INSPECTION_REPORT'],
      LAND_AGENT: ['SEARCH_REPORT'],
    };
    return requirements[professionalType] || [];
  }

  // ============================================================================
  // ADMIN: SERVICE REQUEST MANAGEMENT
  // ============================================================================

  async adminGetServiceRequests(
    userId: string,
    filters: {
      status?: string;
      professionalType?: string;
      page?: number;
      limit?: number;
    },
  ) {
    await this.requireAdmin(userId);
    const { status, professionalType, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (professionalType) {
      where.professional = { type: professionalType };
    }

    const [requests, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        include: {
          client: { select: { id: true, fullName: true, email: true } },
          professional: {
            include: { user: { select: { id: true, fullName: true } } },
          },
          service: true,
          documents: true,
          confirmations: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    return {
      success: true,
      data: requests,
      meta: {
        requestId: `req_${Date.now()}`,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      error: null,
    };
  }

  async adminGetServiceRequestChecklist(userId: string, requestId: string) {
    await this.requireAdmin(userId);
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        client: { select: { id: true, fullName: true, email: true, phone: true } },
        professional: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        service: true,
        documents: {
          include: { uploadedBy: { select: { id: true, fullName: true } } },
        },
        confirmations: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    // Build checklist
    const requiredInputDocs = this.getRequiredInputDocsForType(request.professional.type);
    const requiredOutputDocs = this.getRequiredOutputDocsForType(request.professional.type);

    const uploadedInputDocs = request.documents
      .filter((d: any) => d.type === 'INPUT')
      .map((d: any) => d.category);
    const uploadedOutputDocs = request.documents
      .filter((d: any) => d.type === 'DELIVERABLE')
      .map((d: any) => d.category);

    const checklist = {
      escrowFunded: request.paymentStatus === 'ESCROW_FUNDED' || request.paymentStatus === 'RELEASED',
      inputDocuments: requiredInputDocs.map((doc: string) => ({
        document: doc,
        label: doc.replace(/_/g, ' '),
        uploaded: uploadedInputDocs.includes(doc),
      })),
      outputDocuments: requiredOutputDocs.map((doc: string) => ({
        document: doc,
        label: doc.replace(/_/g, ' '),
        uploaded: uploadedOutputDocs.includes(doc),
      })),
      professionalConfirmedDocumentsReceived: request.confirmations.some(
        (c: any) => c.type === 'DOCUMENTS_RECEIVED' && c.confirmed
      ),
      professionalConfirmedDeliverablesUploaded: request.confirmations.some(
        (c: any) => c.type === 'DELIVERABLES_UPLOADED' && c.confirmed
      ),
      clientConfirmedWorkAccepted: request.clientConfirmedWork,
      allInputDocsUploaded: requiredInputDocs.every((doc: string) => uploadedInputDocs.includes(doc)),
      allOutputDocsUploaded: requiredOutputDocs.every((doc: string) => uploadedOutputDocs.includes(doc)),
      readyForRelease: 
        request.clientConfirmedWork &&
        requiredInputDocs.every((doc: string) => uploadedInputDocs.includes(doc)) &&
        requiredOutputDocs.every((doc: string) => uploadedOutputDocs.includes(doc)),
    };

    return {
      success: true,
      data: {
        request,
        checklist,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async adminReleaseEscrow(adminUserId: string, requestId: string, notes?: string) {
    await this.requireAdmin(adminUserId);
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        professional: true,
        documents: true,
        confirmations: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.status === 'COMPLETED') {
      throw new BadRequestException('Escrow has already been released');
    }

    if (!request.clientConfirmedWork) {
      throw new BadRequestException('Client has not confirmed work acceptance yet');
    }

    // Validate all required documents are uploaded
    const requiredInputDocs = this.getRequiredInputDocsForType(request.professional.type);
    const requiredOutputDocs = this.getRequiredOutputDocsForType(request.professional.type);

    const uploadedInputDocs = request.documents
      .filter((d: any) => d.type === 'INPUT')
      .map((d: any) => d.category);
    const uploadedOutputDocs = request.documents
      .filter((d: any) => d.type === 'DELIVERABLE')
      .map((d: any) => d.category);

    const missingInputDocs = requiredInputDocs.filter((doc: string) => !uploadedInputDocs.includes(doc));
    const missingOutputDocs = requiredOutputDocs.filter((doc: string) => !uploadedOutputDocs.includes(doc));

    if (missingInputDocs.length > 0 || missingOutputDocs.length > 0) {
      throw new BadRequestException(
        `Cannot release escrow. Missing documents: ${[...missingInputDocs, ...missingOutputDocs].join(', ')}`
      );
    }

    // Release escrow
    const updatedRequest = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        paymentStatus: 'RELEASED',
        escrowReleasedAt: new Date(),
      },
    });

    // Create admin confirmation record
    await this.prisma.serviceConfirmation.create({
      data: {
        requestId,
        userId: adminUserId,
        role: 'ADMIN' as any, // Will be valid after prisma generate
        type: 'ESCROW_RELEASED' as any, // Will be valid after prisma generate
        confirmed: true,
        notes: notes || 'Escrow released by admin after checklist verification',
        confirmedAt: new Date(),
      },
    });

    // TODO: Trigger actual payment transfer to professional

    return {
      success: true,
      data: {
        message: 'Escrow released successfully',
        request: updatedRequest,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
