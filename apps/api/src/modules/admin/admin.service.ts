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

    const [transactions, total, stats, disputedCount] = await Promise.all([
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
      // Get aggregate stats for ALL transactions (not filtered)
      this.prisma.transaction.aggregate({
        _sum: {
          agreedPriceGhs: true,
          platformFeeGhs: true,
        },
        _count: true,
      }),
      this.prisma.transaction.count({ where: { status: 'DISPUTED' } }),
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
        stats: {
          totalTransactions: stats._count,
          totalVolume: stats._sum.agreedPriceGhs?.toString() || '0',
          totalFees: stats._sum.platformFeeGhs?.toString() || '0',
          disputedCount,
        },
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalUsers,
      totalListings,
      pendingVerifications,
      activeTransactions,
      disputedTransactions,
      monthlyRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.transaction.count({
        where: { status: { in: ['CREATED', 'ESCROW_FUNDED', 'VERIFICATION_PERIOD', 'READY_TO_RELEASE'] } },
      }),
      this.prisma.transaction.count({ where: { status: 'DISPUTED' } }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: startOfMonth } },
        _sum: { amountGhs: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amountGhs: true },
      }),
    ]);

    const currentRevenue = Number(monthlyRevenue._sum.amountGhs || 0);
    const previousRevenue = Number(lastMonthRevenue._sum.amountGhs || 0);
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    return {
      success: true,
      data: {
        totalUsers,
        totalListings,
        pendingVerifications,
        activeTransactions,
        disputedTransactions,
        monthlyRevenue: currentRevenue,
        revenueChange: Math.round(revenueChange * 10) / 10,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getPendingItems() {
    const [pendingVerifications, pendingListings, disputedTransactions] = await Promise.all([
      this.prisma.listing.findMany({
        where: { verificationStatus: 'PENDING' },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.listing.findMany({
        where: { listingStatus: 'UNDER_REVIEW' },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.transaction.findMany({
        where: { status: 'DISPUTED' },
        select: { id: true, listing: { select: { title: true } }, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const items = [
      ...pendingVerifications.map(v => ({
        id: v.id,
        type: 'verification' as const,
        title: v.title,
        status: 'pending',
        createdAt: v.createdAt.toISOString().split('T')[0],
      })),
      ...pendingListings.map(l => ({
        id: l.id,
        type: 'listing' as const,
        title: l.title,
        status: 'under_review',
        createdAt: l.createdAt.toISOString().split('T')[0],
      })),
      ...disputedTransactions.map(t => ({
        id: t.id,
        type: 'transaction' as const,
        title: t.listing?.title || `Transaction #${t.id.slice(-8)}`,
        status: 'disputed',
        createdAt: t.createdAt.toISOString().split('T')[0],
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, 10);

    return {
      success: true,
      data: items,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  async getAuditLogs(query: {
    entityType?: string;
    action?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { entityType, action, search, page = 1, limit = 25 } = query;

    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = action;
    }

    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { actor: { email: { contains: search, mode: 'insensitive' } } },
        { actor: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, email: true, fullName: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.actorUserId,
        userEmail: log.actor?.email || 'Unknown',
        userName: log.actor?.fullName || 'Unknown',
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
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
}
