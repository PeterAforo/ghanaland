import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreatePermitApplicationDto,
  UpdatePermitApplicationDto,
  AddPermitDocumentDto,
  UpdatePermitStatusDto,
  VerifyDocumentDto,
} from './dto';
import { PermitStatus } from '@prisma/client';

const PERMIT_FEES: Record<string, number> = {
  BUILDING_PERMIT: 500,
  LAND_USE_PERMIT: 300,
  DEVELOPMENT_PERMIT: 750,
  SUBDIVISION_PERMIT: 1000,
  OCCUPANCY_PERMIT: 200,
  DEMOLITION_PERMIT: 400,
  RENOVATION_PERMIT: 350,
};

@Injectable()
export class PermitsService {
  private readonly logger = new Logger(PermitsService.name);

  constructor(private prisma: PrismaService) {}

  private generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PRM-${year}-${random}`;
  }

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  async createApplication(userId: string, dto: CreatePermitApplicationDto) {
    const applicationFee = PERMIT_FEES[dto.type] || 500;

    const application = await this.prisma.permitApplication.create({
      data: {
        applicantId: userId,
        listingId: dto.listingId,
        type: dto.type,
        propertyAddress: dto.propertyAddress,
        propertyRegion: dto.propertyRegion,
        propertyDistrict: dto.propertyDistrict,
        plotNumber: dto.plotNumber,
        landSize: dto.landSize,
        landSizeUnit: dto.landSizeUnit || 'acres',
        projectDescription: dto.projectDescription,
        buildingType: dto.buildingType,
        numberOfFloors: dto.numberOfFloors,
        estimatedCost: dto.estimatedCost,
        applicationFee,
      },
      include: {
        applicant: { select: { id: true, fullName: true, email: true } },
        documents: true,
      },
    });

    // Create initial status history
    await this.prisma.permitStatusHistory.create({
      data: {
        applicationId: application.id,
        toStatus: 'DRAFT',
        notes: 'Application created',
      },
    });

    return {
      success: true,
      data: application,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateApplication(userId: string, applicationId: string, dto: UpdatePermitApplicationDto) {
    const application = await this.prisma.permitApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.applicantId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }

    if (application.status !== 'DRAFT') {
      throw new BadRequestException('Can only edit draft applications');
    }

    const updated = await this.prisma.permitApplication.update({
      where: { id: applicationId },
      data: {
        propertyAddress: dto.propertyAddress,
        propertyRegion: dto.propertyRegion,
        propertyDistrict: dto.propertyDistrict,
        plotNumber: dto.plotNumber,
        landSize: dto.landSize,
        projectDescription: dto.projectDescription,
        buildingType: dto.buildingType,
        numberOfFloors: dto.numberOfFloors,
        estimatedCost: dto.estimatedCost,
      },
      include: {
        documents: true,
      },
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getMyApplications(userId: string) {
    const applications = await this.prisma.permitApplication.findMany({
      where: { applicantId: userId },
      include: {
        documents: true,
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: applications,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getApplication(userId: string, applicationId: string) {
    const application = await this.prisma.permitApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: { select: { id: true, fullName: true, email: true, phone: true } },
        listing: { select: { id: true, title: true, region: true, district: true } },
        documents: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.applicantId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }

    return {
      success: true,
      data: application,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async addDocument(userId: string, applicationId: string, dto: AddPermitDocumentDto) {
    const application = await this.prisma.permitApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.applicantId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }

    if (!['DRAFT', 'ADDITIONAL_INFO_REQUIRED'].includes(application.status)) {
      throw new BadRequestException('Cannot add documents at this stage');
    }

    const document = await this.prisma.permitDocument.create({
      data: {
        applicationId,
        type: dto.type,
        name: dto.name,
        url: dto.url,
      },
    });

    return {
      success: true,
      data: document,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async removeDocument(userId: string, applicationId: string, documentId: string) {
    const application = await this.prisma.permitApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.applicantId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }

    if (!['DRAFT', 'ADDITIONAL_INFO_REQUIRED'].includes(application.status)) {
      throw new BadRequestException('Cannot remove documents at this stage');
    }

    const document = await this.prisma.permitDocument.findFirst({
      where: { id: documentId, applicationId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.permitDocument.delete({
      where: { id: documentId },
    });

    return {
      success: true,
      data: { message: 'Document removed' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async submitApplication(userId: string, applicationId: string) {
    const application = await this.prisma.permitApplication.findUnique({
      where: { id: applicationId },
      include: { documents: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.applicantId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }

    if (!['DRAFT', 'ADDITIONAL_INFO_REQUIRED'].includes(application.status)) {
      throw new BadRequestException('Application cannot be submitted at this stage');
    }

    if (application.documents.length === 0) {
      throw new BadRequestException('Please upload at least one document before submitting');
    }

    const referenceNumber = this.generateReferenceNumber();

    await this.prisma.$transaction(async (tx) => {
      await tx.permitApplication.update({
        where: { id: applicationId },
        data: {
          status: 'SUBMITTED',
          referenceNumber,
          submittedAt: new Date(),
        },
      });

      await tx.permitStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: 'SUBMITTED',
          notes: 'Application submitted for review',
        },
      });
    });

    return {
      success: true,
      data: { 
        message: 'Application submitted successfully',
        referenceNumber,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async cancelApplication(userId: string, applicationId: string) {
    const application = await this.prisma.permitApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.applicantId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }

    if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(application.status)) {
      throw new BadRequestException('Application cannot be cancelled at this stage');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.permitApplication.update({
        where: { id: applicationId },
        data: { status: 'CANCELLED' },
      });

      await tx.permitStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status as PermitStatus,
          toStatus: 'CANCELLED',
          notes: 'Application cancelled by applicant',
        },
      });
    });

    return {
      success: true,
      data: { message: 'Application cancelled' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  async getAllApplications(page = 1, limit = 20, status?: string, type?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [applications, total] = await Promise.all([
      this.prisma.permitApplication.findMany({
        where,
        include: {
          applicant: { select: { id: true, fullName: true, email: true } },
          documents: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.permitApplication.count({ where }),
    ]);

    return {
      success: true,
      data: applications,
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
      },
      error: null,
    };
  }

  async getApplicationAdmin(applicationId: string) {
    const application = await this.prisma.permitApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: { select: { id: true, fullName: true, email: true, phone: true } },
        listing: { select: { id: true, title: true, region: true, district: true } },
        documents: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return {
      success: true,
      data: application,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateApplicationStatus(
    adminId: string,
    applicationId: string,
    dto: UpdatePermitStatusDto,
  ) {
    const application = await this.prisma.permitApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const updateData: any = {
      status: dto.status as PermitStatus,
    };

    if (dto.status === 'UNDER_REVIEW') {
      updateData.reviewStartedAt = new Date();
    }

    if (dto.status === 'APPROVED') {
      updateData.approvedAt = new Date();
      // Set expiry to 1 year from approval
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      updateData.expiresAt = expiryDate;
    }

    if (dto.status === 'REJECTED') {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = dto.rejectionReason;
    }

    if (dto.notes) {
      updateData.adminNotes = dto.notes;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.permitApplication.update({
        where: { id: applicationId },
        data: updateData,
      });

      await tx.permitStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: dto.status as PermitStatus,
          changedBy: adminId,
          notes: dto.notes || dto.rejectionReason,
        },
      });
    });

    return {
      success: true,
      data: { message: `Application status updated to ${dto.status}` },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async verifyDocument(adminId: string, documentId: string, dto: VerifyDocumentDto) {
    const document = await this.prisma.permitDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updated = await this.prisma.permitDocument.update({
      where: { id: documentId },
      data: {
        verified: dto.verified,
        verifiedAt: dto.verified ? new Date() : null,
        verifiedBy: dto.verified ? adminId : null,
        notes: dto.notes,
      },
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getPermitStats() {
    const [total, byStatus, byType] = await Promise.all([
      this.prisma.permitApplication.count(),
      this.prisma.permitApplication.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.permitApplication.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
