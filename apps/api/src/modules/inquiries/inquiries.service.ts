import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationTemplate, NotificationType } from '../notifications/dto';

@Injectable()
export class InquiriesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createInquiry(senderId: string, dto: { listingId: string; message: string }) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { seller: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId === senderId) {
      throw new BadRequestException('You cannot send an inquiry for your own listing');
    }

    const inquiry = await this.prisma.inquiry.create({
      data: {
        listingId: dto.listingId,
        senderId,
        sellerId: listing.sellerId,
        message: dto.message,
      },
      include: {
        listing: { select: { id: true, title: true } },
        sender: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    // Notify seller
    try {
      await this.notifications.sendNotification(
        listing.sellerId,
        NotificationTemplate.LISTING_INQUIRY,
        NotificationType.BOTH,
        {
          listing: listing.title,
          senderName: inquiry.sender.fullName,
          message: dto.message.substring(0, 100),
        },
      );
    } catch (err) {
      console.error('Failed to send inquiry notification:', err);
    }

    return {
      success: true,
      data: {
        id: inquiry.id,
        listingId: inquiry.listingId,
        message: inquiry.message,
        status: inquiry.status,
        createdAt: inquiry.createdAt.toISOString(),
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getReceivedInquiries(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where: { sellerId: userId },
        include: {
          listing: { select: { id: true, title: true, media: { take: 1 } } },
          sender: { select: { id: true, fullName: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inquiry.count({ where: { sellerId: userId } }),
    ]);

    return {
      success: true,
      data: inquiries.map((i) => ({
        id: i.id,
        message: i.message,
        status: i.status,
        readAt: i.readAt?.toISOString(),
        createdAt: i.createdAt.toISOString(),
        listing: i.listing,
        sender: i.sender,
      })),
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
      },
      error: null,
    };
  }

  async getSentInquiries(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where: { senderId: userId },
        include: {
          listing: { select: { id: true, title: true, media: { take: 1 } } },
          seller: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inquiry.count({ where: { senderId: userId } }),
    ]);

    return {
      success: true,
      data: inquiries.map((i) => ({
        id: i.id,
        message: i.message,
        status: i.status,
        createdAt: i.createdAt.toISOString(),
        listing: i.listing,
        seller: i.seller,
      })),
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
      },
      error: null,
    };
  }

  async markAsRead(userId: string, inquiryId: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    if (inquiry.sellerId !== userId) {
      throw new BadRequestException('You can only mark your own inquiries as read');
    }

    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status: 'READ', readAt: new Date() },
    });

    return {
      success: true,
      data: { marked: true },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.inquiry.count({
      where: { sellerId: userId, status: 'PENDING' },
    });

    return {
      success: true,
      data: { count },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
