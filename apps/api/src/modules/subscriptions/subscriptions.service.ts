import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TierType, BillingCycle, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // SUBSCRIPTION PLANS
  // ============================================================================

  async getPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      success: true,
      data: plans,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getAllPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return {
      success: true,
      data: plans,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getPlanBySlug(slug: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return {
      success: true,
      data: plan,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // USER SUBSCRIPTIONS
  // ============================================================================

  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: subscription,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async subscribe(
    userId: string,
    planSlug: string,
    billingCycle: BillingCycle = 'MONTHLY',
    paymentReference?: string,
  ) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: planSlug },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found or inactive');
    }

    // Check for existing active subscription
    const existing = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (existing) {
      throw new BadRequestException('User already has an active subscription. Please cancel first.');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'MONTHLY') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscription = await this.prisma.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentReference,
      },
      include: { plan: true },
    });

    this.logger.log(`User ${userId} subscribed to ${plan.name}`);

    return {
      success: true,
      data: subscription,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async cancelSubscription(userId: string, immediate: boolean = false) {
    const subscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (immediate) {
      await this.prisma.userSubscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELED' },
      });
    } else {
      await this.prisma.userSubscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: true },
      });
    }

    this.logger.log(`User ${userId} canceled subscription (immediate: ${immediate})`);

    return {
      success: true,
      data: { message: immediate ? 'Subscription canceled' : 'Subscription will cancel at period end' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async checkFeatureAccess(userId: string, featureKey: string): Promise<boolean> {
    const subscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
        currentPeriodEnd: { gte: new Date() },
      },
      include: { plan: true },
    });

    if (!subscription) {
      return false;
    }

    const features = subscription.plan.features as string[];
    return features.includes(featureKey);
  }

  async getUserTier(userId: string): Promise<TierType> {
    const subscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
        currentPeriodEnd: { gte: new Date() },
      },
      include: { plan: true },
    });

    return subscription?.plan.tierType || 'FREE';
  }

  // ============================================================================
  // ADMIN: PLAN MANAGEMENT
  // ============================================================================

  async createPlan(data: {
    name: string;
    slug: string;
    description?: string;
    tierType: TierType;
    priceMonthlyGhs: number;
    priceYearlyGhs: number;
    features: string[];
    limits: Record<string, number>;
    sortOrder?: number;
  }) {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        tierType: data.tierType,
        priceMonthlyGhs: data.priceMonthlyGhs,
        priceYearlyGhs: data.priceYearlyGhs,
        features: data.features,
        limits: data.limits,
        sortOrder: data.sortOrder || 0,
      },
    });

    return {
      success: true,
      data: plan,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updatePlan(
    planId: string,
    data: Partial<{
      name: string;
      description: string;
      priceMonthlyGhs: number;
      priceYearlyGhs: number;
      features: string[];
      limits: Record<string, number>;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) {
    const plan = await this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data,
    });

    return {
      success: true,
      data: plan,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async deletePlan(planId: string) {
    // Check if any users are subscribed to this plan
    const activeSubscriptions = await this.prisma.userSubscription.count({
      where: {
        planId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ${activeSubscriptions} active subscriptions. Deactivate it instead.`,
      );
    }

    await this.prisma.subscriptionPlan.delete({
      where: { id: planId },
    });

    return {
      success: true,
      data: { message: 'Plan deleted successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  getAvailableFeatures() {
    const features = [
      // Core features (Free tier)
      { key: 'browse_listings', name: 'Browse Listings', description: 'View all published land listings', category: 'core' },
      { key: 'save_favorites', name: 'Save Favorites', description: 'Save listings to favorites', category: 'core' },
      { key: 'send_inquiries', name: 'Send Inquiries', description: 'Contact sellers about listings', category: 'core' },
      
      // Seller features
      { key: 'featured_listings', name: 'Featured Listings', description: 'Promote listings with featured placement', category: 'seller' },
      { key: 'listing_analytics', name: 'Listing Analytics', description: 'View detailed analytics for your listings', category: 'seller' },
      { key: 'bulk_upload', name: 'Bulk Upload', description: 'Upload multiple listings at once', category: 'seller' },
      { key: 'priority_verification', name: 'Priority Verification', description: 'Fast-track listing verification (24-48h)', category: 'seller' },
      { key: 'virtual_tours', name: 'Virtual Tours', description: 'Add 360° virtual tours to listings', category: 'seller' },
      
      // Buyer features
      { key: 'saved_search_alerts', name: 'Saved Search Alerts', description: 'Get notified when new listings match your search', category: 'buyer' },
      { key: 'price_drop_alerts', name: 'Price Drop Alerts', description: 'Get notified when listing prices drop', category: 'buyer' },
      { key: 'exclusive_listings', name: 'Early Access', description: 'See new listings before they go public', category: 'buyer' },
      { key: 'due_diligence_basic', name: 'Basic Due Diligence', description: 'Access basic due diligence reports', category: 'buyer' },
      { key: 'due_diligence_comprehensive', name: 'Comprehensive Due Diligence', description: 'Access comprehensive due diligence reports', category: 'buyer' },
      
      // Professional features
      { key: 'verified_badge', name: 'Verified Badge', description: 'Display verified professional badge', category: 'professional' },
      { key: 'priority_placement', name: 'Priority Placement', description: 'Appear higher in professional search results', category: 'professional' },
      { key: 'professional_profile', name: 'Professional Profile', description: 'Create a detailed professional profile page', category: 'professional' },
      { key: 'service_catalog', name: 'Service Catalog', description: 'List your services with pricing', category: 'professional' },
      { key: 'client_management', name: 'Client Management', description: 'Manage client requests and communications', category: 'professional' },
      { key: 'booking_calendar', name: 'Booking Calendar', description: 'Allow clients to book appointments', category: 'professional' },
      { key: 'review_management', name: 'Review Management', description: 'Manage and respond to client reviews', category: 'professional' },
      { key: 'lead_generation', name: 'Lead Generation', description: 'Receive leads from platform users', category: 'professional' },
      
      // Agent/Team features
      { key: 'team_management', name: 'Team Management', description: 'Add and manage team members', category: 'agent' },
      { key: 'white_label', name: 'White Label Portal', description: 'Custom branded portal for your agency', category: 'enterprise' },
      { key: 'api_access', name: 'API Access', description: 'Access to Ghana Lands API', category: 'enterprise' },
      { key: 'dedicated_support', name: 'Dedicated Support', description: 'Priority customer support', category: 'enterprise' },
    ];

    return {
      success: true,
      data: features,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async seedDefaultPlans() {
    const plans = [
      {
        name: 'Free',
        slug: 'free',
        description: 'Basic access to Ghana Lands marketplace',
        tierType: 'FREE' as TierType,
        priceMonthlyGhs: 0,
        priceYearlyGhs: 0,
        features: ['browse_listings', 'save_favorites', 'send_inquiries'],
        limits: { maxListings: 2, maxSavedSearches: 3 },
        sortOrder: 0,
      },
      {
        name: 'Seller',
        slug: 'seller',
        description: 'For active land sellers with premium features',
        tierType: 'SELLER_PRO' as TierType,
        priceMonthlyGhs: 149,
        priceYearlyGhs: 1490,
        features: [
          'browse_listings', 'save_favorites', 'send_inquiries',
          'featured_listings', 'listing_analytics', 'bulk_upload',
          'priority_verification', 'virtual_tours',
        ],
        limits: { maxListings: 50, maxSavedSearches: 20, maxFeaturedListings: 5 },
        sortOrder: 1,
      },
      {
        name: 'Buyer',
        slug: 'buyer',
        description: 'For serious buyers with advanced search and alerts',
        tierType: 'BUYER_PRO' as TierType,
        priceMonthlyGhs: 79,
        priceYearlyGhs: 790,
        features: [
          'browse_listings', 'save_favorites', 'send_inquiries',
          'saved_search_alerts', 'price_drop_alerts', 'exclusive_listings',
          'due_diligence_basic',
        ],
        limits: { maxSavedSearches: 50, maxPriceAlerts: 20 },
        sortOrder: 2,
      },
      {
        name: 'Professional',
        slug: 'professional',
        description: 'For surveyors, lawyers, architects & other professionals',
        tierType: 'AGENT_PRO' as TierType,
        priceMonthlyGhs: 249,
        priceYearlyGhs: 2490,
        features: [
          'browse_listings', 'save_favorites', 'send_inquiries',
          'verified_badge', 'priority_placement', 'lead_generation',
          'professional_profile', 'service_catalog', 'client_management',
          'booking_calendar', 'review_management',
        ],
        limits: { maxServices: 20, maxLeads: 100 },
        sortOrder: 3,
      },
      {
        name: 'Agent',
        slug: 'agent',
        description: 'For real estate agents with full platform access',
        tierType: 'AGENT_PRO' as TierType,
        priceMonthlyGhs: 399,
        priceYearlyGhs: 3990,
        features: [
          'browse_listings', 'save_favorites', 'send_inquiries',
          'featured_listings', 'listing_analytics', 'bulk_upload',
          'priority_verification', 'virtual_tours',
          'saved_search_alerts', 'price_drop_alerts',
          'lead_generation', 'verified_badge', 'priority_placement',
        ],
        limits: { maxListings: 200, maxSavedSearches: 100, maxFeaturedListings: 20, maxTeamMembers: 5 },
        sortOrder: 4,
      },
    ];

    // Delete old plans that are no longer needed
    const oldSlugs = ['seller-pro', 'buyer-pro', 'professional-pro', 'agent-pro', 'enterprise'];
    await this.prisma.subscriptionPlan.deleteMany({
      where: { slug: { in: oldSlugs } },
    });

    for (const plan of plans) {
      await this.prisma.subscriptionPlan.upsert({
        where: { slug: plan.slug },
        update: plan,
        create: plan,
      });
    }

    this.logger.log('Default subscription plans seeded');

    return {
      success: true,
      data: { message: 'Plans seeded successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
