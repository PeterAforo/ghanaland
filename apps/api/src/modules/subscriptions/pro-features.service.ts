import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class ProFeaturesService {
  private readonly logger = new Logger(ProFeaturesService.name);

  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  // ============================================================================
  // FEATURED LISTINGS
  // ============================================================================

  async featureListing(
    userId: string,
    listingId: string,
    featuredType: 'STANDARD' | 'PREMIUM' | 'SPOTLIGHT',
    paymentReference?: string,
  ) {
    // Check feature access
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(userId, 'featured_listings');
    if (!hasAccess) {
      throw new ForbiddenException('Featured listings require a Pro subscription');
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, sellerId: userId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found or not owned by user');
    }

    // Calculate dates and pricing
    const durationDays = featuredType === 'STANDARD' ? 7 : featuredType === 'PREMIUM' ? 14 : 30;
    const pricing = { STANDARD: 50, PREMIUM: 100, SPOTLIGHT: 200 };
    const amount = pricing[featuredType];

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const featured = await this.prisma.featuredListing.create({
      data: {
        listingId,
        userId,
        featuredType,
        startDate,
        endDate,
        amountPaidGhs: amount,
        paymentReference,
        isActive: true,
      },
      include: { listing: true },
    });

    // Update listing isFeatured flag
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { isFeatured: true },
    });

    this.logger.log(`Listing ${listingId} featured as ${featuredType} until ${endDate}`);

    return {
      success: true,
      data: featured,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getFeaturedListings(limit: number = 10) {
    const now = new Date();
    const featured = await this.prisma.featuredListing.findMany({
      where: {
        isActive: true,
        endDate: { gte: now },
      },
      include: {
        listing: {
          include: {
            media: { take: 1 },
            seller: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: [
        { featuredType: 'desc' }, // SPOTLIGHT first
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return {
      success: true,
      data: featured.map(f => f.listing),
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // LISTING ANALYTICS
  // ============================================================================

  async trackListingView(listingId: string, isUnique: boolean = false) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.listingAnalytics.upsert({
      where: { listingId_date: { listingId, date: today } },
      update: {
        views: { increment: 1 },
        uniqueViews: isUnique ? { increment: 1 } : undefined,
      },
      create: {
        listingId,
        date: today,
        views: 1,
        uniqueViews: isUnique ? 1 : 0,
      },
    });
  }

  async trackListingAction(
    listingId: string,
    action: 'inquiry' | 'favorite' | 'share' | 'phone_click' | 'map_view',
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateData: any = {};
    switch (action) {
      case 'inquiry': updateData.inquiries = { increment: 1 }; break;
      case 'favorite': updateData.favorites = { increment: 1 }; break;
      case 'share': updateData.shares = { increment: 1 }; break;
      case 'phone_click': updateData.phoneClicks = { increment: 1 }; break;
      case 'map_view': updateData.mapViews = { increment: 1 }; break;
    }

    await this.prisma.listingAnalytics.upsert({
      where: { listingId_date: { listingId, date: today } },
      update: updateData,
      create: {
        listingId,
        date: today,
        [action === 'inquiry' ? 'inquiries' : 
         action === 'favorite' ? 'favorites' :
         action === 'share' ? 'shares' :
         action === 'phone_click' ? 'phoneClicks' : 'mapViews']: 1,
      },
    });
  }

  async getListingAnalytics(userId: string, listingId: string, days: number = 30) {
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(userId, 'listing_analytics');
    if (!hasAccess) {
      throw new ForbiddenException('Analytics require a Pro subscription');
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, sellerId: userId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found or not owned by user');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await this.prisma.listingAnalytics.findMany({
      where: {
        listingId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        views: acc.views + day.views,
        uniqueViews: acc.uniqueViews + day.uniqueViews,
        inquiries: acc.inquiries + day.inquiries,
        favorites: acc.favorites + day.favorites,
        shares: acc.shares + day.shares,
        phoneClicks: acc.phoneClicks + day.phoneClicks,
        mapViews: acc.mapViews + day.mapViews,
      }),
      { views: 0, uniqueViews: 0, inquiries: 0, favorites: 0, shares: 0, phoneClicks: 0, mapViews: 0 },
    );

    return {
      success: true,
      data: {
        listingId,
        period: { start: startDate, end: new Date(), days },
        totals,
        daily: analytics,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // PRICE ALERTS
  // ============================================================================

  async createPriceAlert(
    userId: string,
    listingId: string,
    targetPrice: number,
    alertType: 'PRICE_DROP' | 'PRICE_CHANGE' | 'BACK_ON_MARKET' = 'PRICE_DROP',
  ) {
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(userId, 'price_drop_alerts');
    if (!hasAccess) {
      throw new ForbiddenException('Price alerts require a Pro subscription');
    }

    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const alert = await this.prisma.priceAlert.upsert({
      where: { userId_listingId_alertType: { userId, listingId, alertType } },
      update: { targetPrice, isActive: true },
      create: { userId, listingId, targetPrice, alertType, isActive: true },
    });

    return {
      success: true,
      data: alert,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getUserPriceAlerts(userId: string) {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { userId, isActive: true },
      include: {
        listing: {
          include: { media: { take: 1 } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: alerts,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async deletePriceAlert(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    await this.prisma.priceAlert.delete({ where: { id: alertId } });

    return {
      success: true,
      data: { message: 'Alert deleted' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // SAVED SEARCH ALERTS
  // ============================================================================

  async createSavedSearchAlert(
    userId: string,
    savedSearchId: string,
    frequency: 'INSTANT' | 'DAILY' | 'WEEKLY' = 'INSTANT',
  ) {
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(userId, 'saved_search_alerts');
    if (!hasAccess) {
      throw new ForbiddenException('Search alerts require a Pro subscription');
    }

    const savedSearch = await this.prisma.savedSearch.findFirst({
      where: { id: savedSearchId, userId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    const alert = await this.prisma.savedSearchAlert.upsert({
      where: { savedSearchId },
      update: { frequency, isActive: true },
      create: { savedSearchId, userId, frequency, isActive: true },
    });

    return {
      success: true,
      data: alert,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getUserSearchAlerts(userId: string) {
    const alerts = await this.prisma.savedSearchAlert.findMany({
      where: { userId, isActive: true },
      include: { savedSearch: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: alerts,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // DUE DILIGENCE REPORTS
  // ============================================================================

  async requestDueDiligenceReport(
    userId: string,
    listingId: string | null,
    landId: string | null,
    reportType: 'BASIC' | 'STANDARD' | 'COMPREHENSIVE' = 'BASIC',
    paymentReference?: string,
  ) {
    const featureKey = reportType === 'COMPREHENSIVE' ? 'due_diligence_comprehensive' : 'due_diligence_basic';
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(userId, featureKey);
    if (!hasAccess) {
      throw new ForbiddenException('Due diligence reports require a Pro subscription');
    }

    if (!listingId && !landId) {
      throw new BadRequestException('Either listingId or landId is required');
    }

    const pricing = { BASIC: 100, STANDARD: 250, COMPREHENSIVE: 500 };

    const report = await this.prisma.dueDiligenceReport.create({
      data: {
        userId,
        listingId,
        landId,
        reportType,
        status: 'PENDING',
        amountPaidGhs: pricing[reportType],
        paymentReference,
      },
    });

    this.logger.log(`Due diligence report ${report.id} requested for ${listingId || landId}`);

    return {
      success: true,
      data: report,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getUserDueDiligenceReports(userId: string) {
    const reports = await this.prisma.dueDiligenceReport.findMany({
      where: { userId },
      include: {
        listing: { select: { id: true, title: true } },
        land: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: reports,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // VIRTUAL TOURS
  // ============================================================================

  async createVirtualTour(
    userId: string,
    listingId: string,
    tourType: 'PHOTOS_360' | 'VIDEO_WALKTHROUGH' | 'MATTERPORT' | 'EXTERNAL_LINK',
    data: { tourUrl?: string; embedCode?: string; mediaUrls?: string[] },
  ) {
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(userId, 'virtual_tours');
    if (!hasAccess) {
      throw new ForbiddenException('Virtual tours require a Pro subscription');
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, sellerId: userId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found or not owned by user');
    }

    const tour = await this.prisma.virtualTour.upsert({
      where: { listingId },
      update: { tourType, ...data, isActive: true },
      create: { listingId, tourType, ...data, isActive: true },
    });

    return {
      success: true,
      data: tour,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getVirtualTour(listingId: string) {
    const tour = await this.prisma.virtualTour.findUnique({
      where: { listingId },
    });

    return {
      success: true,
      data: tour,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // TEAM MANAGEMENT
  // ============================================================================

  async inviteTeamMember(
    ownerId: string,
    memberEmail: string,
    role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER',
  ) {
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(ownerId, 'team_management');
    if (!hasAccess) {
      throw new ForbiddenException('Team management requires an Enterprise subscription');
    }

    const member = await this.prisma.user.findUnique({ where: { email: memberEmail } });
    if (!member) {
      throw new NotFoundException('User not found with that email');
    }

    if (member.id === ownerId) {
      throw new BadRequestException('Cannot add yourself as a team member');
    }

    const teamMember = await this.prisma.teamMember.upsert({
      where: { ownerId_memberId: { ownerId, memberId: member.id } },
      update: { role, isActive: true },
      create: { ownerId, memberId: member.id, role, isActive: true },
      include: { member: { select: { id: true, fullName: true, email: true } } },
    });

    return {
      success: true,
      data: teamMember,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getTeamMembers(ownerId: string) {
    const members = await this.prisma.teamMember.findMany({
      where: { ownerId, isActive: true },
      include: { member: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
      orderBy: { invitedAt: 'desc' },
    });

    return {
      success: true,
      data: members,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async removeTeamMember(ownerId: string, memberId: string) {
    await this.prisma.teamMember.delete({
      where: { ownerId_memberId: { ownerId, memberId } },
    });

    return {
      success: true,
      data: { message: 'Team member removed' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // API KEYS
  // ============================================================================

  async createApiKey(userId: string, name: string, permissions: string[]) {
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(userId, 'api_access');
    if (!hasAccess) {
      throw new ForbiddenException('API access requires an Enterprise subscription');
    }

    // Generate API key
    const crypto = require('crypto');
    const rawKey = `gl_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        keyHash,
        keyPrefix,
        permissions,
        rateLimit: 1000,
        isActive: true,
      },
    });

    // Return the raw key only once - it won't be retrievable later
    return {
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // Only returned on creation
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getUserApiKeys(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: keys,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async revokeApiKey(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return {
      success: true,
      data: { message: 'API key revoked' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // LEAD GENERATION (for Professionals)
  // ============================================================================

  async createLead(
    professionalId: string,
    data: {
      inquiryType: 'BUYER_INQUIRY' | 'SELLER_INQUIRY' | 'SERVICE_REQUEST' | 'GENERAL';
      sourceListingId?: string;
      contactName: string;
      contactEmail?: string;
      contactPhone?: string;
      message?: string;
    },
  ) {
    const lead = await this.prisma.leadInquiry.create({
      data: {
        professionalId,
        ...data,
        status: 'NEW',
      },
    });

    return {
      success: true,
      data: lead,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getProfessionalLeads(userId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    const hasAccess = await this.subscriptionsService.checkFeatureAccess(userId, 'lead_generation');
    if (!hasAccess) {
      throw new ForbiddenException('Lead generation requires a Pro subscription');
    }

    const leads = await this.prisma.leadInquiry.findMany({
      where: { professionalId: profile.id },
      include: {
        sourceListing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: leads,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateLeadStatus(
    userId: string,
    leadId: string,
    status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST',
    notes?: string,
  ) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    const lead = await this.prisma.leadInquiry.findFirst({
      where: { id: leadId, professionalId: profile.id },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const updated = await this.prisma.leadInquiry.update({
      where: { id: leadId },
      data: {
        status,
        notes,
        convertedAt: status === 'CONVERTED' ? new Date() : undefined,
      },
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
