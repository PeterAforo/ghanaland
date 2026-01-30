import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationTemplate } from '../notifications/dto';
import { CreateVerificationRequestDto, ReviewVerificationDto } from './dto';
import { VerificationRequestStatus, VerificationStatus } from '@prisma/client';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createVerificationRequest(
    userId: string,
    tenantId: string,
    dto: CreateVerificationRequestDto,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { seller: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only request verification for your own listings');
    }

    const existingRequest = await this.prisma.verificationRequest.findFirst({
      where: {
        listingId: dto.listingId,
        status: { in: [VerificationRequestStatus.PENDING, VerificationRequestStatus.IN_REVIEW] },
      },
    });

    if (existingRequest) {
      throw new BadRequestException('A verification request is already pending for this listing');
    }

    const verificationRequest = await this.prisma.verificationRequest.create({
      data: {
        listingId: dto.listingId,
        requesterId: userId,
        notes: dto.notes,
        status: VerificationRequestStatus.PENDING,
      },
    });

    await this.prisma.listing.update({
      where: { id: dto.listingId },
      data: { verificationStatus: VerificationStatus.PENDING },
    });

    if (dto.documentIds && dto.documentIds.length > 0) {
      await this.prisma.document.updateMany({
        where: { id: { in: dto.documentIds } },
        data: { verificationRequestId: verificationRequest.id },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        action: 'VERIFICATION_REQUEST_CREATED',
        entityType: 'VerificationRequest',
        entityId: verificationRequest.id,
        metadata: {
          listingId: dto.listingId,
          listingTitle: listing.title,
        },
      },
    });

    await this.notifications.sendNotification(
      userId,
      NotificationTemplate.VERIFICATION_SUBMITTED,
      NotificationType.BOTH,
      { listing: listing.title },
    );

    return {
      success: true,
      data: {
        id: verificationRequest.id,
        listingId: verificationRequest.listingId,
        status: verificationRequest.status,
        createdAt: verificationRequest.createdAt,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getVerificationRequest(requestId: string, userId: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: {
        listing: { select: { id: true, title: true, sellerId: true } },
        documents: true,
        requester: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    return {
      success: true,
      data: request,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getListingVerificationRequests(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const requests = await this.prisma.verificationRequest.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: { select: { id: true, name: true, documentType: true } },
      },
    });

    return {
      success: true,
      data: requests,
      meta: { requestId: `req_${Date.now()}`, count: requests.length },
      error: null,
    };
  }

  async getUserVerificationRequests(userId: string) {
    const requests = await this.prisma.verificationRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true, region: true, district: true } },
      },
    });

    return {
      success: true,
      data: requests,
      meta: { requestId: `req_${Date.now()}`, count: requests.length },
      error: null,
    };
  }

  async getPendingVerificationRequests() {
    const requests = await this.prisma.verificationRequest.findMany({
      where: {
        status: { in: [VerificationRequestStatus.PENDING, VerificationRequestStatus.IN_REVIEW] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            region: true,
            district: true,
            category: true,
            landType: true,
          },
        },
        requester: { select: { id: true, fullName: true, email: true, phone: true } },
        documents: { select: { id: true, name: true, documentType: true } },
      },
    });

    return {
      success: true,
      data: requests,
      meta: { requestId: `req_${Date.now()}`, count: requests.length },
      error: null,
    };
  }

  async reviewVerificationRequest(
    verifierId: string,
    tenantId: string,
    dto: ReviewVerificationDto,
  ) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: dto.verificationRequestId },
      include: {
        listing: true,
        requester: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    if (request.status !== VerificationRequestStatus.PENDING && 
        request.status !== VerificationRequestStatus.IN_REVIEW) {
      throw new BadRequestException('This verification request has already been processed');
    }

    if (dto.decision === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting');
    }

    const newStatus = dto.decision === 'APPROVED' 
      ? VerificationRequestStatus.APPROVED 
      : VerificationRequestStatus.REJECTED;

    const listingVerificationStatus = dto.decision === 'APPROVED'
      ? VerificationStatus.VERIFIED
      : VerificationStatus.REJECTED;

    await this.prisma.$transaction(async (tx) => {
      await tx.verificationRequest.update({
        where: { id: dto.verificationRequestId },
        data: {
          status: newStatus,
          verifiedBy: verifierId,
          verifiedAt: new Date(),
          rejectionReason: dto.rejectionReason,
          notes: dto.notes ? `${request.notes || ''}\n\nVerifier notes: ${dto.notes}` : request.notes,
        },
      });

      await tx.listing.update({
        where: { id: request.listingId },
        data: {
          verificationStatus: listingVerificationStatus,
          verifiedAt: dto.decision === 'APPROVED' ? new Date() : null,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: verifierId,
          action: dto.decision === 'APPROVED' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
          entityType: 'VerificationRequest',
          entityId: dto.verificationRequestId,
          metadata: {
            listingId: request.listingId,
            listingTitle: request.listing.title,
            decision: dto.decision,
            rejectionReason: dto.rejectionReason,
          },
        },
      });
    });

    const template = dto.decision === 'APPROVED'
      ? NotificationTemplate.VERIFICATION_APPROVED
      : NotificationTemplate.VERIFICATION_REJECTED;

    await this.notifications.sendNotification(
      request.requesterId,
      template,
      NotificationType.BOTH,
      {
        listing: request.listing.title,
        reason: dto.rejectionReason || '',
      },
    );

    return {
      success: true,
      data: {
        id: dto.verificationRequestId,
        status: newStatus,
        decision: dto.decision,
        verifiedAt: new Date(),
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async startReview(requestId: string, verifierId: string, tenantId: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    if (request.status !== VerificationRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be started for review');
    }

    await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: VerificationRequestStatus.IN_REVIEW },
    });

    await this.prisma.listing.update({
      where: { id: request.listingId },
      data: { verificationStatus: VerificationStatus.IN_REVIEW },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: verifierId,
        action: 'VERIFICATION_REVIEW_STARTED',
        entityType: 'VerificationRequest',
        entityId: requestId,
      },
    });

    return {
      success: true,
      data: { id: requestId, status: VerificationRequestStatus.IN_REVIEW },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async cancelVerificationRequest(requestId: string, userId: string, tenantId: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { listing: true },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    if (request.requesterId !== userId) {
      throw new ForbiddenException('You can only cancel your own verification requests');
    }

    if (request.status !== VerificationRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: VerificationRequestStatus.CANCELLED },
    });

    await this.prisma.listing.update({
      where: { id: request.listingId },
      data: { verificationStatus: VerificationStatus.UNVERIFIED },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        action: 'VERIFICATION_REQUEST_CANCELLED',
        entityType: 'VerificationRequest',
        entityId: requestId,
      },
    });

    return {
      success: true,
      data: { message: 'Verification request cancelled successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
