import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Service Catalog - Admin-managed standardized services
const serviceCatalog = [
  // SURVEYOR services
  { professionalType: 'SURVEYOR', name: 'Land Survey (Residential)', description: 'Complete boundary survey for residential plots up to 1 acre', priceGhs: 1500, durationDays: 7 },
  { professionalType: 'SURVEYOR', name: 'Land Survey (Commercial)', description: 'Complete boundary survey for commercial land up to 5 acres', priceGhs: 3500, durationDays: 14 },
  { professionalType: 'SURVEYOR', name: 'Topographic Survey', description: 'Detailed topographic mapping including contours and features', priceGhs: 2500, durationDays: 10 },
  { professionalType: 'SURVEYOR', name: 'Site Plan Preparation', description: 'Preparation of site plan for building permit application', priceGhs: 800, durationDays: 5 },
  
  // ARCHITECT services
  { professionalType: 'ARCHITECT', name: 'Residential Design (Basic)', description: 'Architectural design for homes up to 3 bedrooms', priceGhs: 5000, durationDays: 21 },
  { professionalType: 'ARCHITECT', name: 'Residential Design (Premium)', description: 'Architectural design for homes 4+ bedrooms with modern features', priceGhs: 12000, durationDays: 30 },
  { professionalType: 'ARCHITECT', name: 'Commercial Building Design', description: 'Full architectural design for commercial buildings', priceGhs: 25000, durationDays: 45 },
  { professionalType: 'ARCHITECT', name: 'Building Permit Drawings', description: 'Preparation of architectural drawings for permit submission', priceGhs: 3000, durationDays: 14 },
  
  // LAWYER services
  { professionalType: 'LAWYER', name: 'Land Title Search', description: 'Comprehensive search and verification of land title at Lands Commission', priceGhs: 1200, durationDays: 7 },
  { professionalType: 'LAWYER', name: 'Property Sale Agreement', description: 'Drafting and review of property sale/purchase agreement', priceGhs: 2000, durationDays: 5 },
  { professionalType: 'LAWYER', name: 'Land Registration', description: 'Complete land registration process at Lands Commission', priceGhs: 3500, durationDays: 30 },
  { professionalType: 'LAWYER', name: 'Property Dispute Resolution', description: 'Legal representation for land/property disputes', priceGhs: 5000, durationDays: 60 },
  
  // ENGINEER services
  { professionalType: 'ENGINEER', name: 'Structural Design (Residential)', description: 'Structural engineering design for residential buildings', priceGhs: 4000, durationDays: 14 },
  { professionalType: 'ENGINEER', name: 'Structural Design (Commercial)', description: 'Structural engineering design for commercial buildings', priceGhs: 10000, durationDays: 21 },
  { professionalType: 'ENGINEER', name: 'Foundation Assessment', description: 'Soil testing and foundation design recommendations', priceGhs: 2500, durationDays: 10 },
  { professionalType: 'ENGINEER', name: 'Building Inspection Report', description: 'Comprehensive structural inspection and report', priceGhs: 1500, durationDays: 5 },
  
  // VALUER services
  { professionalType: 'VALUER', name: 'Property Valuation (Residential)', description: 'Professional valuation for residential property', priceGhs: 1000, durationDays: 5 },
  { professionalType: 'VALUER', name: 'Property Valuation (Commercial)', description: 'Professional valuation for commercial property', priceGhs: 2500, durationDays: 7 },
  { professionalType: 'VALUER', name: 'Land Valuation', description: 'Valuation of undeveloped land parcels', priceGhs: 800, durationDays: 5 },
  { professionalType: 'VALUER', name: 'Insurance Valuation', description: 'Property valuation for insurance purposes', priceGhs: 1200, durationDays: 5 },
  
  // PLANNER services
  { professionalType: 'PLANNER', name: 'Development Permit Application', description: 'Preparation and submission of development permit', priceGhs: 2000, durationDays: 14 },
  { professionalType: 'PLANNER', name: 'Building Permit Application', description: 'Complete building permit application process', priceGhs: 1500, durationDays: 10 },
  { professionalType: 'PLANNER', name: 'Land Use Change Application', description: 'Application for change of land use/zoning', priceGhs: 3000, durationDays: 30 },
  { professionalType: 'PLANNER', name: 'Environmental Impact Assessment', description: 'EIA preparation and EPA submission', priceGhs: 8000, durationDays: 45 },
  
  // AGENT services
  { professionalType: 'AGENT', name: 'Property Listing & Marketing', description: 'Professional listing and marketing of property for sale', priceGhs: 500, durationDays: 30 },
  { professionalType: 'AGENT', name: 'Property Search Service', description: 'Find properties matching your requirements', priceGhs: 300, durationDays: 14 },
  { professionalType: 'AGENT', name: 'Property Viewing Coordination', description: 'Arrange and accompany property viewings', priceGhs: 200, durationDays: 7 },
  { professionalType: 'AGENT', name: 'Transaction Facilitation', description: 'End-to-end facilitation of property transaction', priceGhs: 1000, durationDays: 30 },
];

// Professional users to create
const professionals = [
  // SURVEYORS (3)
  { email: 'kwame.mensah@survey.gh', password: 'Survey123!', fullName: 'Kwame Mensah', phone: '+233244100001', type: 'SURVEYOR', title: 'Licensed Land Surveyor', bio: 'Over 15 years experience in land surveying across Greater Accra and Ashanti regions.', yearsExperience: 15, licenseNumber: 'GhIS/2010/0234', regions: ['Greater Accra', 'Ashanti'] },
  { email: 'abena.osei@survey.gh', password: 'Survey123!', fullName: 'Abena Osei', phone: '+233244100002', type: 'SURVEYOR', title: 'Certified Surveyor', bio: 'Specialist in topographic surveys and GIS mapping. Accurate and timely delivery.', yearsExperience: 8, licenseNumber: 'GhIS/2016/0567', regions: ['Greater Accra', 'Central', 'Western'] },
  { email: 'kofi.asante@survey.gh', password: 'Survey123!', fullName: 'Kofi Asante', phone: '+233244100003', type: 'SURVEYOR', title: 'Senior Land Surveyor', bio: 'Expert in cadastral surveys and land boundary disputes resolution.', yearsExperience: 20, licenseNumber: 'GhIS/2004/0089', regions: ['Ashanti', 'Bono', 'Ahafo'] },
  
  // ARCHITECTS (3)
  { email: 'ama.darko@arch.gh', password: 'Arch123!', fullName: 'Ama Darko', phone: '+233244200001', type: 'ARCHITECT', title: 'Principal Architect', bio: 'Award-winning architect specializing in sustainable residential designs.', yearsExperience: 12, licenseNumber: 'GIA/2012/0345', regions: ['Greater Accra', 'Eastern'] },
  { email: 'yaw.boateng@arch.gh', password: 'Arch123!', fullName: 'Yaw Boateng', phone: '+233244200002', type: 'ARCHITECT', title: 'Senior Architect', bio: 'Commercial and institutional building specialist. LEED certified.', yearsExperience: 18, licenseNumber: 'GIA/2006/0123', regions: ['Greater Accra', 'Ashanti', 'Western'] },
  { email: 'efua.mensah@arch.gh', password: 'Arch123!', fullName: 'Efua Mensah', phone: '+233244200003', type: 'ARCHITECT', title: 'Architect', bio: 'Modern residential designs with focus on affordability and functionality.', yearsExperience: 6, licenseNumber: 'GIA/2018/0789', regions: ['Greater Accra', 'Central'] },
  
  // LAWYERS (3)
  { email: 'nana.adjei@law.gh', password: 'Law123!', fullName: 'Nana Adjei Esq.', phone: '+233244300001', type: 'LAWYER', title: 'Property Law Specialist', bio: 'Barrister and Solicitor with 20+ years in property and land law.', yearsExperience: 22, licenseNumber: 'GBA/2002/1234', regions: ['Greater Accra', 'Ashanti', 'Eastern'] },
  { email: 'akua.owusu@law.gh', password: 'Law123!', fullName: 'Akua Owusu Esq.', phone: '+233244300002', type: 'LAWYER', title: 'Land Rights Attorney', bio: 'Expert in land registration, title disputes, and property transactions.', yearsExperience: 10, licenseNumber: 'GBA/2014/5678', regions: ['Greater Accra', 'Central', 'Volta'] },
  { email: 'kweku.annan@law.gh', password: 'Law123!', fullName: 'Kweku Annan Esq.', phone: '+233244300003', type: 'LAWYER', title: 'Real Estate Lawyer', bio: 'Specializing in commercial real estate transactions and development agreements.', yearsExperience: 15, licenseNumber: 'GBA/2009/3456', regions: ['Greater Accra', 'Western'] },
  
  // ENGINEERS (3)
  { email: 'kojo.appiah@eng.gh', password: 'Eng123!', fullName: 'Kojo Appiah', phone: '+233244400001', type: 'ENGINEER', title: 'Structural Engineer', bio: 'PE certified structural engineer. Expert in high-rise and commercial structures.', yearsExperience: 16, licenseNumber: 'GhIE/2008/0456', regions: ['Greater Accra', 'Ashanti'] },
  { email: 'adwoa.sarpong@eng.gh', password: 'Eng123!', fullName: 'Adwoa Sarpong', phone: '+233244400002', type: 'ENGINEER', title: 'Civil Engineer', bio: 'Specialist in foundation design and soil mechanics. Quality assured work.', yearsExperience: 9, licenseNumber: 'GhIE/2015/0789', regions: ['Greater Accra', 'Eastern', 'Volta'] },
  { email: 'papa.quaye@eng.gh', password: 'Eng123!', fullName: 'Papa Quaye', phone: '+233244400003', type: 'ENGINEER', title: 'Building Services Engineer', bio: 'MEP design and building inspection specialist.', yearsExperience: 11, licenseNumber: 'GhIE/2013/0234', regions: ['Greater Accra', 'Central'] },
  
  // VALUERS (3)
  { email: 'esi.tetteh@value.gh', password: 'Value123!', fullName: 'Esi Tetteh', phone: '+233244500001', type: 'VALUER', title: 'Certified Property Valuer', bio: 'RICS qualified valuer with expertise in residential and commercial properties.', yearsExperience: 14, licenseNumber: 'GhIVS/2010/0567', regions: ['Greater Accra', 'Ashanti', 'Western'] },
  { email: 'kwabena.frimpong@value.gh', password: 'Value123!', fullName: 'Kwabena Frimpong', phone: '+233244500002', type: 'VALUER', title: 'Senior Valuer', bio: 'Bank-approved valuer. Specializing in mortgage valuations and insurance assessments.', yearsExperience: 18, licenseNumber: 'GhIVS/2006/0123', regions: ['Greater Accra', 'Eastern'] },
  { email: 'akosua.mensah@value.gh', password: 'Value123!', fullName: 'Akosua Mensah', phone: '+233244500003', type: 'VALUER', title: 'Property Valuer', bio: 'Expert in land valuation and compensation assessments.', yearsExperience: 7, licenseNumber: 'GhIVS/2017/0890', regions: ['Ashanti', 'Bono', 'Northern'] },
  
  // PLANNERS (3)
  { email: 'fiifi.hammond@plan.gh', password: 'Plan123!', fullName: 'Fiifi Hammond', phone: '+233244600001', type: 'PLANNER', title: 'Town Planning Consultant', bio: 'Former TCPD officer. Expert in permit applications and development control.', yearsExperience: 20, licenseNumber: 'GhTP/2004/0234', regions: ['Greater Accra', 'Central', 'Western'] },
  { email: 'adjoa.asare@plan.gh', password: 'Plan123!', fullName: 'Adjoa Asare', phone: '+233244600002', type: 'PLANNER', title: 'Urban Planner', bio: 'Specialist in EIA preparation and environmental permits.', yearsExperience: 10, licenseNumber: 'GhTP/2014/0567', regions: ['Greater Accra', 'Ashanti'] },
  
  // AGENTS (2)
  { email: 'kofi.agyeman@realty.gh', password: 'Agent123!', fullName: 'Kofi Agyeman', phone: '+233244700001', type: 'AGENT', title: 'Licensed Real Estate Agent', bio: 'Top-rated agent with 500+ successful transactions. Specializing in Accra prime areas.', yearsExperience: 12, licenseNumber: 'GREDA/2012/0345', regions: ['Greater Accra'] },
  { email: 'mercy.ansah@realty.gh', password: 'Agent123!', fullName: 'Mercy Ansah', phone: '+233244700002', type: 'AGENT', title: 'Property Consultant', bio: 'Expert in residential rentals and sales. Excellent client service.', yearsExperience: 8, licenseNumber: 'GREDA/2016/0678', regions: ['Greater Accra', 'Ashanti', 'Eastern'] },
];

async function main() {
  console.log('🌱 Starting seed...\n');

  // 1. Create Service Catalog
  console.log('📋 Creating service catalog...');
  for (const service of serviceCatalog) {
    await prisma.serviceCatalog.upsert({
      where: {
        professionalType_name: {
          professionalType: service.professionalType as any,
          name: service.name,
        },
      },
      update: {
        description: service.description,
        priceGhs: service.priceGhs,
        durationDays: service.durationDays,
      },
      create: {
        professionalType: service.professionalType as any,
        name: service.name,
        description: service.description,
        priceGhs: service.priceGhs,
        durationDays: service.durationDays,
      },
    });
  }
  console.log(`✅ Created ${serviceCatalog.length} catalog services\n`);

  // 2. Get tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('❌ No tenant found. Please run main seed first.');
    return;
  }

  // 3. Get or create USER role
  let userRole = await prisma.role.findFirst({
    where: { name: 'USER' },
  });
  if (!userRole) {
    console.log('Creating USER role...');
    userRole = await prisma.role.create({
      data: {
        name: 'USER',
        description: 'Regular user role',
      },
    });
  }

  // 4. Create professionals
  console.log('👷 Creating professional users and profiles...\n');
  const createdProfessionals: { email: string; password: string; fullName: string; type: string }[] = [];

  for (const prof of professionals) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: prof.email },
    });

    if (existingUser) {
      console.log(`  ⏭️  ${prof.email} already exists, skipping...`);
      createdProfessionals.push({ email: prof.email, password: prof.password, fullName: prof.fullName, type: prof.type });
      continue;
    }

    // Create user
    const hashedPassword = await bcrypt.hash(prof.password, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: prof.email,
        passwordHash: hashedPassword,
        fullName: prof.fullName,
        phone: prof.phone,
        emailVerified: true,
        accountStatus: 'ACTIVE',
      },
    });

    // Assign role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: userRole.id,
      },
    });

    // Create professional profile
    const profile = await prisma.professionalProfile.create({
      data: {
        userId: user.id,
        type: prof.type as any,
        title: prof.title,
        bio: prof.bio,
        yearsExperience: prof.yearsExperience,
        licenseNumber: prof.licenseNumber,
        licenseVerified: true,
        verifiedAt: new Date(),
        regions: prof.regions,
        languages: ['English', 'Twi'],
        isAvailable: true,
        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5 and 5.0
        reviewCount: Math.floor(Math.random() * 50) + 10, // Random reviews 10-60
      },
    });

    // Add services from catalog for this professional type
    const catalogServices = await prisma.serviceCatalog.findMany({
      where: { professionalType: prof.type as any, isActive: true },
    });

    for (const catService of catalogServices) {
      await prisma.professionalService.create({
        data: {
          profileId: profile.id,
          catalogId: catService.id,
          name: catService.name,
          description: catService.description,
          priceGhs: catService.priceGhs,
          durationDays: catService.durationDays,
          priceType: 'FIXED',
          isActive: true,
        },
      });
    }

    console.log(`  ✅ Created ${prof.fullName} (${prof.type}) with ${catalogServices.length} services`);
    createdProfessionals.push({ email: prof.email, password: prof.password, fullName: prof.fullName, type: prof.type });
  }

  // Print credentials
  console.log('\n' + '='.repeat(80));
  console.log('📋 PROFESSIONAL LOGIN CREDENTIALS');
  console.log('='.repeat(80));
  console.log('\n| Type      | Name                  | Email                          | Password    |');
  console.log('|-----------|----------------------|--------------------------------|-------------|');
  
  for (const p of createdProfessionals) {
    const typeStr = p.type.padEnd(9);
    const nameStr = p.fullName.padEnd(20);
    const emailStr = p.email.padEnd(30);
    const passStr = p.password.padEnd(11);
    console.log(`| ${typeStr} | ${nameStr} | ${emailStr} | ${passStr} |`);
  }
  
  console.log('\n✅ Seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
