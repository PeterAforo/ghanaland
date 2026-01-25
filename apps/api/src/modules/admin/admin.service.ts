import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // USERS
  // ============================================================================

  async getUsers(query: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 20 } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.accountStatus = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: { include: { role: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        accountStatus: u.accountStatus,
        emailVerified: u.emailVerified,
        phoneVerified: u.phoneVerified,
        roles: u.userRoles.map((ur) => ur.role.name),
        createdAt: u.createdAt.toISOString(),
      })),
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
      },
      error: null,
    };
  }

  async updateUserStatus(userId: string, status: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { accountStatus: status as any },
    });

    return {
      success: true,
      data: { id: updated.id, accountStatus: updated.accountStatus },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // LISTINGS
  // ============================================================================

  async getListings(query: {
    search?: string;
    status?: string;
    verificationStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, verificationStatus, page = 1, limit = 20 } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.listingStatus = status;
    }

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, fullName: true, email: true } },
          media: { take: 1 },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      success: true,
      data: listings.map((l) => ({
        ...l,
        priceGhs: l.priceGhs.toString(),
        sizeAcres: l.sizeAcres.toString(),
      })),
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
      },
      error: null,
    };
  }

  async updateListingStatus(listingId: string, status: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        listingStatus: status as any,
        publishedAt: status === 'PUBLISHED' ? new Date() : listing.publishedAt,
      },
    });

    return {
      success: true,
      data: { id: updated.id, listingStatus: updated.listingStatus },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateVerificationStatus(listingId: string, status: string, notes?: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        verificationStatus: status as any,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });

    return {
      success: true,
      data: { id: updated.id, verificationStatus: updated.verificationStatus },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  async getTransactions(query: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 20 } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          listing: { select: { id: true, title: true } },
          buyer: { select: { id: true, fullName: true, email: true } },
          seller: { select: { id: true, fullName: true, email: true } },
          payments: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      success: true,
      data: transactions.map((t) => ({
        ...t,
        agreedPriceGhs: t.agreedPriceGhs.toString(),
        platformFeeGhs: t.platformFeeGhs.toString(),
        sellerNetGhs: t.sellerNetGhs.toString(),
      })),
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
      },
      error: null,
    };
  }

  async updateTransactionStatus(transactionId: string, action: string, notes?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    let newStatus: string;
    let escrowStatus: string | undefined;

    switch (action) {
      case 'release':
        if (transaction.status !== 'READY_TO_RELEASE' && transaction.status !== 'ESCROW_FUNDED') {
          throw new BadRequestException('Cannot release funds in current state');
        }
        newStatus = 'RELEASED';
        escrowStatus = 'RELEASED';
        break;
      case 'refund':
        newStatus = 'REFUNDED';
        escrowStatus = 'REFUNDED';
        break;
      case 'dispute':
        newStatus = 'DISPUTED';
        break;
      case 'resolve':
        if (transaction.status !== 'DISPUTED') {
          throw new BadRequestException('Transaction is not disputed');
        }
        newStatus = 'READY_TO_RELEASE';
        break;
      default:
        throw new BadRequestException('Invalid action');
    }

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus as any,
        escrowStatus: escrowStatus as any,
        completedAt: ['RELEASED', 'REFUNDED', 'COMPLETED'].includes(newStatus)
          ? new Date()
          : null,
      },
    });

    return {
      success: true,
      data: { id: updated.id, status: updated.status, escrowStatus: updated.escrowStatus },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // STATS
  // ============================================================================

  async getDashboardStats() {
    const [
      totalUsers,
      totalListings,
      pendingVerifications,
      activeTransactions,
      disputedTransactions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.transaction.count({
        where: { status: { in: ['ESCROW_FUNDED', 'VERIFICATION_PERIOD', 'READY_TO_RELEASE'] } },
      }),
      this.prisma.transaction.count({ where: { status: 'DISPUTED' } }),
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        totalListings,
        pendingVerifications,
        activeTransactions,
        disputedTransactions,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
