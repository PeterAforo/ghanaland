import { PrismaClient, LandCategory, LandType, TenureType, ListingStatus, VerificationStatus, TierType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create or get default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Ghana Lands',
      slug: 'default',
    },
  });

  console.log('✅ Tenant created');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const seller1 = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      email: 'seller@example.com',
      passwordHash: hashedPassword,
      fullName: 'Kwame Asante',
      phone: '+233201234567',
      ghanaCardNumber: 'GHA-123456789-1',
      tenantId: tenant.id,
      emailVerified: true,
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@example.com' },
    update: {},
    create: {
      email: 'seller2@example.com',
      passwordHash: hashedPassword,
      fullName: 'Ama Mensah',
      phone: '+233209876543',
      ghanaCardNumber: 'GHA-123456789-2',
      tenantId: tenant.id,
      emailVerified: true,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      passwordHash: hashedPassword,
      fullName: 'Kofi Owusu',
      phone: '+233205551234',
      ghanaCardNumber: 'GHA-123456789-3',
      tenantId: tenant.id,
      emailVerified: true,
    },
  });

  console.log('✅ Users created');

  // Create listings
  const listingsData = [
    {
      title: 'Prime Residential Land in East Legon',
      description: 'Beautiful plot of land in the heart of East Legon. Perfect for building your dream home. Close to schools, hospitals, and shopping centers. Fully documented with all necessary permits.',
      category: LandCategory.RESIDENTIAL,
      landType: LandType.TITLED,
      tenureType: TenureType.FREEHOLD,
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      town: 'East Legon',
      address: 'East Legon Extension, Near American House',
      priceGhs: 850000,
      pricePerPlot: 850000,
      totalPlots: 1,
      availablePlots: 1,
      sizeAcres: 0.25,
      verificationStatus: VerificationStatus.VERIFIED,
      listingStatus: ListingStatus.PUBLISHED,
      sellerId: seller1.id,
      tenantId: tenant.id,
      latitude: 5.6350,
      longitude: -0.1550,
    },
    {
      title: 'Commercial Land at Spintex Road',
      description: 'Strategic commercial plot along Spintex Road. High traffic area ideal for office complex, shopping center, or mixed-use development. All utilities available.',
      category: LandCategory.COMMERCIAL,
      landType: LandType.TITLED,
      tenureType: TenureType.FREEHOLD,
      region: 'Greater Accra',
      district: 'Tema Metropolitan',
      town: 'Spintex',
      address: 'Spintex Road, Near Palace Mall',
      priceGhs: 2500000,
      pricePerPlot: 1250000,
      totalPlots: 2,
      availablePlots: 2,
      sizeAcres: 0.5,
      verificationStatus: VerificationStatus.VERIFIED,
      listingStatus: ListingStatus.PUBLISHED,
      sellerId: seller1.id,
      tenantId: tenant.id,
      latitude: 5.6450,
      longitude: -0.1050,
    },
    {
      title: 'Agricultural Land in Akuapem Ridge',
      description: 'Fertile agricultural land perfect for farming. Natural water source nearby. Suitable for cocoa, palm, or mixed farming. Peaceful environment with good road access.',
      category: LandCategory.AGRICULTURAL,
      landType: LandType.CUSTOMARY,
      tenureType: TenureType.CUSTOMARY,
      region: 'Eastern',
      district: 'Akuapem South',
      town: 'Aburi',
      address: 'Aburi-Koforidua Road',
      priceGhs: 180000,
      pricePerPlot: 45000,
      totalPlots: 4,
      availablePlots: 4,
      sizeAcres: 2.0,
      verificationStatus: VerificationStatus.PENDING,
      listingStatus: ListingStatus.PUBLISHED,
      sellerId: seller2.id,
      tenantId: tenant.id,
      latitude: 5.8500,
      longitude: -0.1750,
    },
    {
      title: 'Beachfront Land at Ada Foah',
      description: 'Stunning beachfront property at Ada Foah. Perfect for resort development or private beach house. Unobstructed ocean views. Rare opportunity!',
      category: LandCategory.RESIDENTIAL,
      landType: LandType.TITLED,
      tenureType: TenureType.FREEHOLD,
      region: 'Greater Accra',
      district: 'Ada East',
      town: 'Ada Foah',
      address: 'Ada Foah Beach Road',
      priceGhs: 1200000,
      pricePerPlot: 600000,
      totalPlots: 2,
      availablePlots: 2,
      sizeAcres: 0.5,
      verificationStatus: VerificationStatus.VERIFIED,
      listingStatus: ListingStatus.PUBLISHED,
      sellerId: seller2.id,
      tenantId: tenant.id,
      latitude: 5.7850,
      longitude: 0.6350,
    },
    {
      title: 'Industrial Land at Tema Free Zone',
      description: 'Prime industrial land within Tema Free Zone enclave. Ideal for manufacturing, warehousing, or logistics. Tax incentives available. Ready for development.',
      category: LandCategory.INDUSTRIAL,
      landType: LandType.LEASEHOLD,
      tenureType: TenureType.LEASEHOLD,
      leasePeriodYears: 50,
      region: 'Greater Accra',
      district: 'Tema Metropolitan',
      town: 'Tema Free Zone',
      address: 'Tema Free Zone Enclave',
      priceGhs: 5000000,
      pricePerPlot: 2500000,
      totalPlots: 2,
      availablePlots: 2,
      sizeAcres: 1.0,
      verificationStatus: VerificationStatus.VERIFIED,
      listingStatus: ListingStatus.PUBLISHED,
      sellerId: seller1.id,
      tenantId: tenant.id,
      latitude: 5.6650,
      longitude: -0.0150,
    },
    {
      title: 'Affordable Plots in Kasoa',
      description: 'Budget-friendly residential plots in fast-developing Kasoa area. Good road network. Electricity and water available. Ideal for first-time buyers.',
      category: LandCategory.RESIDENTIAL,
      landType: LandType.TITLED,
      tenureType: TenureType.FREEHOLD,
      region: 'Central',
      district: 'Awutu Senya East',
      town: 'Kasoa',
      address: 'Kasoa New Town',
      priceGhs: 95000,
      pricePerPlot: 95000,
      totalPlots: 1,
      availablePlots: 1,
      sizeAcres: 0.2,
      verificationStatus: VerificationStatus.PENDING,
      listingStatus: ListingStatus.PUBLISHED,
      sellerId: seller2.id,
      tenantId: tenant.id,
      latitude: 5.5350,
      longitude: -0.4250,
    },
    {
      title: 'Luxury Estate Land in Trasacco',
      description: 'Exclusive plot in prestigious Trasacco Valley. Gated community with 24/7 security. Underground utilities. Build your luxury mansion here.',
      category: LandCategory.RESIDENTIAL,
      landType: LandType.TITLED,
      tenureType: TenureType.FREEHOLD,
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      town: 'Trasacco Valley',
      address: 'Trasacco Valley Estate',
      priceGhs: 3500000,
      pricePerPlot: 3500000,
      totalPlots: 1,
      availablePlots: 1,
      sizeAcres: 0.4,
      verificationStatus: VerificationStatus.VERIFIED,
      listingStatus: ListingStatus.PUBLISHED,
      sellerId: seller1.id,
      tenantId: tenant.id,
      latitude: 5.6150,
      longitude: -0.1350,
    },
    {
      title: 'Farm Land in Ashanti Region',
      description: 'Large agricultural land in Ashanti Region. Rich soil perfect for cocoa or food crops. Includes small farmhouse. Stream runs through property.',
      category: LandCategory.AGRICULTURAL,
      landType: LandType.CUSTOMARY,
      tenureType: TenureType.CUSTOMARY,
      region: 'Ashanti',
      district: 'Atwima Nwabiagya',
      town: 'Nkawie',
      address: 'Nkawie-Toase Road',
      priceGhs: 320000,
      pricePerPlot: 80000,
      totalPlots: 4,
      availablePlots: 4,
      sizeAcres: 5.0,
      verificationStatus: VerificationStatus.VERIFIED,
      listingStatus: ListingStatus.PUBLISHED,
      sellerId: seller2.id,
      tenantId: tenant.id,
      latitude: 6.5450,
      longitude: -1.7850,
    },
  ];

  for (const listing of listingsData) {
    await prisma.listing.create({
      data: listing,
    });
  }

  console.log(`✅ Created ${listingsData.length} listings`);

  // Create subscription plans
  const subscriptionPlans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'Basic access to browse and search listings',
      tierType: TierType.FREE,
      priceMonthlyGhs: 0,
      priceYearlyGhs: 0,
      features: ['browse_listings', 'save_favorites', 'send_inquiries'],
      limits: { maxListings: 1, maxFavorites: 10 },
      sortOrder: 1,
    },
    {
      name: 'Seller',
      slug: 'seller',
      description: 'For serious land sellers who want more visibility',
      tierType: TierType.SELLER_PRO,
      priceMonthlyGhs: 99,
      priceYearlyGhs: 990,
      features: [
        'browse_listings',
        'save_favorites',
        'send_inquiries',
        'featured_listings',
        'listing_analytics',
        'bulk_upload',
        'priority_verification',
        'virtual_tours',
      ],
      limits: { maxListings: 20, maxFeatured: 5 },
      sortOrder: 2,
    },
    {
      name: 'Buyer',
      slug: 'buyer',
      description: 'For buyers who want early access and insights',
      tierType: TierType.BUYER_PRO,
      priceMonthlyGhs: 49,
      priceYearlyGhs: 490,
      features: [
        'browse_listings',
        'save_favorites',
        'send_inquiries',
        'saved_search_alerts',
        'price_drop_alerts',
        'exclusive_listings',
        'due_diligence_basic',
      ],
      limits: { maxSavedSearches: 10, maxAlerts: 20 },
      sortOrder: 3,
    },
    {
      name: 'Professional',
      slug: 'professional',
      description: 'For surveyors, lawyers, architects & engineers',
      tierType: TierType.PROFESSIONAL_PRO,
      priceMonthlyGhs: 149,
      priceYearlyGhs: 1490,
      features: [
        'browse_listings',
        'save_favorites',
        'send_inquiries',
        'verified_badge',
        'priority_placement',
        'professional_profile',
        'service_catalog',
        'client_management',
        'booking_calendar',
        'review_management',
      ],
      limits: { maxServices: 20, maxClients: -1 },
      sortOrder: 4,
    },
    {
      name: 'Agent',
      slug: 'agent',
      description: 'For real estate agents and agencies',
      tierType: TierType.AGENT_PRO,
      priceMonthlyGhs: 299,
      priceYearlyGhs: 2990,
      features: [
        'browse_listings',
        'save_favorites',
        'send_inquiries',
        'featured_listings',
        'listing_analytics',
        'bulk_upload',
        'priority_verification',
        'virtual_tours',
        'saved_search_alerts',
        'price_drop_alerts',
        'exclusive_listings',
        'due_diligence_basic',
        'lead_generation',
        'verified_badge',
        'priority_placement',
        'professional_profile',
        'client_management',
        'team_management',
      ],
      limits: { maxListings: -1, maxTeamMembers: 10 },
      sortOrder: 5,
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthlyGhs: plan.priceMonthlyGhs,
        priceYearlyGhs: plan.priceYearlyGhs,
        features: plan.features,
        limits: plan.limits,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    });
  }

  console.log(`✅ Created ${subscriptionPlans.length} subscription plans`);

  console.log('🎉 Seeding completed!');
  console.log('\n📧 Test accounts:');
  console.log('   Seller: seller@example.com / password123');
  console.log('   Seller: seller2@example.com / password123');
  console.log('   Buyer: buyer@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
