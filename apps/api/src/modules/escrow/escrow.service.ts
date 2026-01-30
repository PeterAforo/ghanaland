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
import {
  CreateTransactionDto,
  DisputeTransactionDto,
  ResolveDisputeDto,
} from './dto';
import { TransactionStatus, EscrowStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const PLATFORM_FEE_PERCENTAGE = 2.5;

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createTransaction(userId: string, tenantId: string, dto: CreateTransactionDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { 
        seller: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId === userId) {
      throw new BadRequestException('You cannot buy your own listing');
    }

    if (listing.listingStatus !== 'PUBLISHED') {
      throw new BadRequestException('This listing is not available for purchase');
    }

    // Calculate price from listing if not provided
    const plotCount = dto.plotCount || dto.numberOfPlots || 1;

    // Check if enough plots are available
    const availablePlots = listing.availablePlots ?? listing.totalPlots ?? 1;
    if (plotCount > availablePlots) {
      throw new BadRequestException(`Only ${availablePlots} plots are available. You requested ${plotCount}.`);
    }
    const pricePerPlot = listing.pricePerPlot ? Number(listing.pricePerPlot) : Number(listing.priceGhs);
    let agreedPriceGhs = dto.agreedPriceGhs || (pricePerPlot * plotCount);

    // Handle installment pricing with interest
    const paymentType = dto.paymentType || 'ONE_TIME';
    let installmentPackageId = dto.installmentPackageId;
    let installmentSchedule: any[] = [];
    
    const packages = listing.installmentPackages as Array<{
      id: string;
      interestRate: number;
      initialDepositPercent: number;
      durationMonths: number;
    }> | null;

    // Check for existing active transaction with SAME payment type for this buyer/listing
    // Allow new transactions if payment type is different (e.g., one-time vs installment)
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: {
        listingId: dto.listingId,
        buyerId: userId,
        status: {
          notIn: ['CANCELLED', 'REFUNDED', 'COMPLETED'],
        },
      },
      include: { payments: true },
    });

    // Only return existing if it's the same payment type AND has no completed payments
    // This allows buying more plots from same listing as separate transactions
    if (existingTransaction) {
      const existingMetadata = existingTransaction.payments?.[0]?.metadata as any;
      const existingPaymentType = existingMetadata?.paymentType;
      const hasCompletedPayments = existingTransaction.payments?.some(p => p.status === 'COMPLETED');
      
      // If same payment type and no payments made yet, return existing
      if (existingPaymentType === paymentType && !hasCompletedPayments) {
        return this.getTransaction(existingTransaction.id, userId);
      }
    }
    
    if (paymentType === 'INSTALLMENT' && packages && packages.length > 0) {
      const pkg = installmentPackageId 
        ? packages.find(p => p.id === installmentPackageId)
        : packages[0];
      
      if (pkg) {
        installmentPackageId = pkg.id;
        const interestAmount = (agreedPriceGhs * pkg.interestRate) / 100;
        const totalWithInterest = agreedPriceGhs + interestAmount;
        
        // Calculate installment schedule
        const initialDeposit = (totalWithInterest * pkg.initialDepositPercent) / 100;
        const remainingAmount = totalWithInterest - initialDeposit;
        const monthlyPayment = remainingAmount / pkg.durationMonths;
        
        // Create schedule
        const now = new Date();
        installmentSchedule.push({
          installmentNumber: 0,
          type: 'INITIAL_DEPOSIT',
          amount: Math.round(initialDeposit * 100) / 100,
          dueDate: now.toISOString(),
          status: 'PENDING',
        });
        
        for (let i = 1; i <= pkg.durationMonths; i++) {
          const dueDate = new Date(now);
          dueDate.setMonth(dueDate.getMonth() + i);
          installmentSchedule.push({
            installmentNumber: i,
            type: 'MONTHLY_INSTALLMENT',
            amount: Math.round(monthlyPayment * 100) / 100,
            dueDate: dueDate.toISOString(),
            status: 'PENDING',
          });
        }
        
        agreedPriceGhs = totalWithInterest;
      }
    }

    const platformFee = (agreedPriceGhs * PLATFORM_FEE_PERCENTAGE) / 100;
    const sellerNet = agreedPriceGhs - platformFee;

    const transaction = await this.prisma.transaction.create({
      data: {
        listingId: dto.listingId,
        buyerId: userId,
        sellerId: listing.sellerId,
        agreedPriceGhs: agreedPriceGhs,
        platformFeeGhs: platformFee,
        sellerNetGhs: sellerNet,
        status: TransactionStatus.CREATED,
        paymentType,
        plotCount,
        installmentSchedule: installmentSchedule.length > 0 ? installmentSchedule : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        action: 'TRANSACTION_CREATED',
        entityType: 'Transaction',
        entityId: transaction.id,
        metadata: {
          listingId: dto.listingId,
          listingTitle: listing.title,
          agreedPrice: agreedPriceGhs,
          plotCount,
          paymentType,
        },
      },
    });

    await this.notifications.sendNotification(
      listing.sellerId,
      NotificationTemplate.TRANSACTION_CREATED,
      NotificationType.BOTH,
      {
        listing: listing.title,
        amount: agreedPriceGhs.toString(),
      },
    );

    return {
      success: true,
      data: {
        id: transaction.id,
        listingId: transaction.listingId,
        agreedPriceGhs: transaction.agreedPriceGhs,
        platformFeeGhs: transaction.platformFeeGhs,
        sellerNetGhs: transaction.sellerNetGhs,
        status: transaction.status,
        createdAt: transaction.createdAt,
        paymentType: transaction.paymentType,
        plotCount: transaction.plotCount,
        installmentSchedule: transaction.installmentSchedule,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getTransaction(transactionId: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            region: true,
            district: true,
            priceGhs: true,
          },
        },
        buyer: { select: { id: true, fullName: true, email: true, phone: true } },
        seller: { select: { id: true, fullName: true, email: true, phone: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException('You do not have access to this transaction');
    }

    return {
      success: true,
      data: transaction,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getUserTransactions(userId: string, role?: 'buyer' | 'seller') {
    const where: any = {};

    if (role === 'buyer') {
      where.buyerId = userId;
    } else if (role === 'seller') {
      where.sellerId = userId;
    } else {
      where.OR = [{ buyerId: userId }, { sellerId: userId }];
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true, region: true, district: true, media: { select: { url: true }, take: 1 } } },
        buyer: { select: { id: true, fullName: true } },
        seller: { select: { id: true, fullName: true } },
        payments: { select: { id: true, amountGhs: true, status: true } },
      },
    });

    return {
      success: true,
      data: transactions,
      meta: { requestId: `req_${Date.now()}`, count: transactions.length },
      error: null,
    };
  }

  async markEscrowFunded(transactionId: string, tenantId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.ESCROW_FUNDED,
        escrowStatus: EscrowStatus.FUNDED,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: transaction.buyerId,
        action: 'ESCROW_FUNDED',
        entityType: 'Transaction',
        entityId: transactionId,
        metadata: {
          amount: transaction.agreedPriceGhs,
        },
      },
    });

    await Promise.all([
      this.notifications.sendNotification(
        transaction.buyerId,
        NotificationTemplate.ESCROW_FUNDED,
        NotificationType.BOTH,
        {
          listing: transaction.listing.title,
          amount: transaction.agreedPriceGhs.toString(),
        },
      ),
      this.notifications.sendNotification(
        transaction.sellerId,
        NotificationTemplate.ESCROW_FUNDED,
        NotificationType.BOTH,
        {
          listing: transaction.listing.title,
          amount: transaction.agreedPriceGhs.toString(),
        },
      ),
    ]);

    return {
      success: true,
      data: { transactionId, status: TransactionStatus.ESCROW_FUNDED },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async releaseEscrow(transactionId: string, adminId: string, tenantId: string, notes?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.escrowStatus !== EscrowStatus.FUNDED) {
      throw new BadRequestException('Escrow is not funded or already released');
    }

    await this.prisma.$transaction(async (tx) => {
      // Get the transaction with plotCount
      const txn = await tx.transaction.findUnique({
        where: { id: transactionId },
        select: { plotCount: true },
      });

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.RELEASED,
          escrowStatus: EscrowStatus.RELEASED,
          completedAt: new Date(),
        },
      });

      // Reduce available plots and update listing status
      const plotsSold = txn?.plotCount || 1;
      const currentAvailable = transaction.listing.availablePlots || 0;
      const newAvailable = Math.max(0, currentAvailable - plotsSold);
      
      // Calculate acres reduction if we have plot dimensions
      let newSizeAcres = transaction.listing.sizeAcres;
      if (transaction.listing.totalPlots && transaction.listing.totalPlots > 0) {
        const acresPerPlot = Number(transaction.listing.sizeAcres) / transaction.listing.totalPlots;
        newSizeAcres = new Decimal(Math.max(0, Number(transaction.listing.sizeAcres) - (acresPerPlot * plotsSold)));
      }

      // Only mark as SOLD if all plots are sold, otherwise keep PUBLISHED
      const newStatus = newAvailable <= 0 ? 'SOLD' : transaction.listing.listingStatus;

      await tx.listing.update({
        where: { id: transaction.listingId },
        data: { 
          listingStatus: newStatus,
          availablePlots: newAvailable,
          sizeAcres: newSizeAcres,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: adminId,
          action: 'ESCROW_RELEASED',
          entityType: 'Transaction',
          entityId: transactionId,
          metadata: {
            sellerAmount: transaction.sellerNetGhs,
            platformFee: transaction.platformFeeGhs,
            plotsSold,
            remainingPlots: newAvailable,
            notes,
          },
        },
      });
    });

    await Promise.all([
      this.notifications.sendNotification(
        transaction.sellerId,
        NotificationTemplate.ESCROW_RELEASED,
        NotificationType.BOTH,
        {
          listing: transaction.listing.title,
          amount: transaction.sellerNetGhs.toString(),
        },
      ),
      this.notifications.sendNotification(
        transaction.buyerId,
        NotificationTemplate.ESCROW_RELEASED,
        NotificationType.BOTH,
        {
          listing: transaction.listing.title,
          amount: transaction.agreedPriceGhs.toString(),
        },
      ),
    ]);

    // Auto-create UserLand entry for the buyer to start their land journey
    await this.createUserLandFromTransaction(transaction);

    return {
      success: true,
      data: {
        transactionId,
        status: TransactionStatus.RELEASED,
        sellerPayout: transaction.sellerNetGhs,
        platformFee: transaction.platformFeeGhs,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Create UserLand entry when a transaction is completed
  private async createUserLandFromTransaction(transaction: any) {
    try {
      // Check if UserLand already exists for this transaction
      const existingLand = await this.prisma.userLand.findUnique({
        where: { transactionId: transaction.id },
      });

      if (existingLand) {
        return; // Already created
      }

      const listing = transaction.listing;
      
      await this.prisma.userLand.create({
        data: {
          userId: transaction.buyerId,
          transactionId: transaction.id,
          title: listing.title,
          description: listing.description,
          region: listing.region,
          district: listing.district,
          locality: listing.town || listing.district,
          plotNumber: transaction.plotCount > 1 ? `${transaction.plotCount} plots` : null,
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
      const land = await this.prisma.userLand.findUnique({
        where: { transactionId: transaction.id },
      });

      if (land) {
        await this.prisma.landJourneyStageRecord.create({
          data: {
            landId: land.id,
            stage: 'LAND_ACQUIRED',
            status: 'COMPLETED',
            completedAt: new Date(),
            notes: `Purchased from ${transaction.seller?.fullName || 'seller'} via Ghana Lands platform`,
          },
        });
      }
    } catch (error) {
      // Log error but don't fail the transaction release
      console.error('Failed to create UserLand from transaction:', error);
    }
  }

  async disputeTransaction(userId: string, tenantId: string, dto: DisputeTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      include: { listing: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this transaction');
    }

    if (transaction.status === TransactionStatus.DISPUTED) {
      throw new BadRequestException('Transaction is already disputed');
    }

    if (
      transaction.status !== TransactionStatus.ESCROW_FUNDED &&
      transaction.status !== TransactionStatus.VERIFICATION_PERIOD
    ) {
      throw new BadRequestException('Transaction cannot be disputed in current state');
    }

    await this.prisma.transaction.update({
      where: { id: dto.transactionId },
      data: { status: TransactionStatus.DISPUTED },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        action: 'TRANSACTION_DISPUTED',
        entityType: 'Transaction',
        entityId: dto.transactionId,
        metadata: {
          reason: dto.reason,
          details: dto.details,
          disputedBy: userId,
        },
      },
    });

    return {
      success: true,
      data: {
        transactionId: dto.transactionId,
        status: TransactionStatus.DISPUTED,
        message: 'Dispute has been filed. Our team will review and contact both parties.',
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async resolveDispute(adminId: string, tenantId: string, dto: ResolveDisputeDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.DISPUTED) {
      throw new BadRequestException('Transaction is not in disputed state');
    }

    let newStatus: TransactionStatus;
    let escrowStatus: EscrowStatus;

    switch (dto.resolution) {
      case 'RELEASE_TO_SELLER':
        newStatus = TransactionStatus.RELEASED;
        escrowStatus = EscrowStatus.RELEASED;
        break;
      case 'REFUND_TO_BUYER':
        newStatus = TransactionStatus.REFUNDED;
        escrowStatus = EscrowStatus.REFUNDED;
        break;
      case 'PARTIAL_REFUND':
        newStatus = TransactionStatus.COMPLETED;
        escrowStatus = EscrowStatus.RELEASED;
        break;
      default:
        throw new BadRequestException('Invalid resolution');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: dto.transactionId },
        data: {
          status: newStatus,
          escrowStatus,
          completedAt: new Date(),
        },
      });

      if (dto.resolution === 'RELEASE_TO_SELLER' || dto.resolution === 'PARTIAL_REFUND') {
        // Reduce available plots when releasing to seller
        const plotsSold = transaction.plotCount || 1;
        const currentAvailable = transaction.listing.availablePlots || 0;
        const newAvailable = Math.max(0, currentAvailable - plotsSold);
        
        // Calculate acres reduction if we have plot dimensions
        let newSizeAcres = transaction.listing.sizeAcres;
        if (transaction.listing.totalPlots && transaction.listing.totalPlots > 0) {
          const acresPerPlot = Number(transaction.listing.sizeAcres) / transaction.listing.totalPlots;
          newSizeAcres = new Decimal(Math.max(0, Number(transaction.listing.sizeAcres) - (acresPerPlot * plotsSold)));
        }

        // Only mark as SOLD if all plots are sold
        const listingStatus = newAvailable <= 0 ? 'SOLD' : transaction.listing.listingStatus;

        await tx.listing.update({
          where: { id: transaction.listingId },
          data: { 
            listingStatus,
            availablePlots: newAvailable,
            sizeAcres: newSizeAcres,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: adminId,
          action: 'DISPUTE_RESOLVED',
          entityType: 'Transaction',
          entityId: dto.transactionId,
          metadata: {
            resolution: dto.resolution,
            refundAmount: dto.refundAmount,
            notes: dto.notes,
          },
        },
      });
    });

    return {
      success: true,
      data: {
        transactionId: dto.transactionId,
        resolution: dto.resolution,
        status: newStatus,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async cancelTransaction(transactionId: string, userId: string, tenantId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.buyerId !== userId) {
      throw new ForbiddenException('Only the buyer can cancel a transaction');
    }

    if (transaction.status !== TransactionStatus.CREATED) {
      throw new BadRequestException('Only newly created transactions can be cancelled');
    }

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.CANCELLED },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        action: 'TRANSACTION_CANCELLED',
        entityType: 'Transaction',
        entityId: transactionId,
      },
    });

    return {
      success: true,
      data: { message: 'Transaction cancelled successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getEscrowSummary() {
    const [funded, released, refunded, disputed] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { escrowStatus: EscrowStatus.FUNDED },
        _sum: { agreedPriceGhs: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { escrowStatus: EscrowStatus.RELEASED },
        _sum: { agreedPriceGhs: true, platformFeeGhs: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { escrowStatus: EscrowStatus.REFUNDED },
        _sum: { agreedPriceGhs: true },
        _count: true,
      }),
      this.prisma.transaction.count({
        where: { status: TransactionStatus.DISPUTED },
      }),
    ]);

    return {
      success: true,
      data: {
        currentlyInEscrow: {
          count: funded._count,
          totalGhs: funded._sum.agreedPriceGhs || 0,
        },
        released: {
          count: released._count,
          totalGhs: released._sum.agreedPriceGhs || 0,
          platformFeesGhs: released._sum.platformFeeGhs || 0,
        },
        refunded: {
          count: refunded._count,
          totalGhs: refunded._sum.agreedPriceGhs || 0,
        },
        activeDisputes: disputed,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
