import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../documents/cloudinary.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        roles: user.userRoles.map((ur) => ur.role.name),
        createdAt: user.createdAt.toISOString(),
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateProfile(userId: string, dto: { fullName?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
      },
    });

    return {
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getDashboardStats(userId: string) {
    const [
      totalListings,
      activeListings,
      totalViews,
      pendingTransactions,
      recentActivity,
    ] = await Promise.all([
      this.prisma.listing.count({ where: { sellerId: userId } }),
      this.prisma.listing.count({ where: { sellerId: userId, listingStatus: 'PUBLISHED' } }),
      this.prisma.listing.aggregate({
        where: { sellerId: userId },
        _sum: { viewCount: true },
      }),
      this.prisma.transaction.count({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
          status: { in: ['CREATED', 'ESCROW_FUNDED', 'VERIFICATION_PERIOD', 'READY_TO_RELEASE', 'DISPUTED'] },
        },
      }),
      this.prisma.auditLog.findMany({
        where: { actorUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalListings,
        activeListings,
        totalViews: totalViews._sum.viewCount || 0,
        pendingTransactions,
        recentActivity,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return {
      success: true,
      data: { message: 'Password changed successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload to Cloudinary
    const result = await this.cloudinary.uploadFile(file, 'ghana-lands/avatars');

    // Update user avatar URL
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.secureUrl },
    });

    return {
      success: true,
      data: {
        avatarUrl: updatedUser.avatarUrl,
        message: 'Profile photo uploaded successfully',
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
