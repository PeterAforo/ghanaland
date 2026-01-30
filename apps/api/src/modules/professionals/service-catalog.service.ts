import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceCatalogDto, UpdateServiceCatalogDto } from './dto/service-catalog.dto';

@Injectable()
export class ServiceCatalogService {
  constructor(private prisma: PrismaService) {}

  async getAll(type?: string) {
    const where: any = { isActive: true };
    if (type) {
      where.professionalType = type;
    }

    const items = await this.prisma.serviceCatalog.findMany({
      where,
      orderBy: [{ professionalType: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return {
      success: true,
      data: items,
    };
  }

  async getByType(type: string) {
    const items = await this.prisma.serviceCatalog.findMany({
      where: {
        professionalType: type as any,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return {
      success: true,
      data: items,
    };
  }

  async create(dto: CreateServiceCatalogDto) {
    // Check for duplicate
    const existing = await this.prisma.serviceCatalog.findUnique({
      where: {
        professionalType_name: {
          professionalType: dto.professionalType,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Service with this name already exists for this professional type');
    }

    const item = await this.prisma.serviceCatalog.create({
      data: {
        professionalType: dto.professionalType,
        name: dto.name,
        description: dto.description,
        priceGhs: dto.priceGhs,
        durationDays: dto.durationDays,
        sortOrder: dto.sortOrder || 0,
      },
    });

    return {
      success: true,
      data: item,
      message: 'Service catalog item created successfully',
    };
  }

  async update(id: string, dto: UpdateServiceCatalogDto) {
    const existing = await this.prisma.serviceCatalog.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Service catalog item not found');
    }

    const item = await this.prisma.serviceCatalog.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      data: item,
      message: 'Service catalog item updated successfully',
    };
  }

  async delete(id: string) {
    const existing = await this.prisma.serviceCatalog.findUnique({
      where: { id },
      include: { professionalServices: true },
    });

    if (!existing) {
      throw new NotFoundException('Service catalog item not found');
    }

    // Soft delete if there are linked services
    if (existing.professionalServices.length > 0) {
      await this.prisma.serviceCatalog.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        success: true,
        message: 'Service catalog item deactivated (has linked professional services)',
      };
    }

    await this.prisma.serviceCatalog.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Service catalog item deleted successfully',
    };
  }

  async seedDefaults() {
    const defaultServices = [
      // SURVEYOR services
      { professionalType: 'SURVEYOR', name: 'Land Survey', description: 'Complete boundary survey with GPS coordinates and site plan', priceGhs: 500, durationDays: 3, sortOrder: 1 },
      { professionalType: 'SURVEYOR', name: 'Boundary Demarcation', description: 'Physical marking of land boundaries with pillars', priceGhs: 800, durationDays: 2, sortOrder: 2 },
      { professionalType: 'SURVEYOR', name: 'Topographic Survey', description: 'Detailed elevation and contour mapping', priceGhs: 1500, durationDays: 5, sortOrder: 3 },
      { professionalType: 'SURVEYOR', name: 'Site Plan Preparation', description: 'Preparation of site plan for building permit', priceGhs: 600, durationDays: 3, sortOrder: 4 },
      { professionalType: 'SURVEYOR', name: 'GPS Coordinate Capture', description: 'Capture and documentation of GPS coordinates', priceGhs: 300, durationDays: 1, sortOrder: 5 },

      // LAWYER services
      { professionalType: 'LAWYER', name: 'Title Search', description: 'Comprehensive search at Lands Commission to verify ownership', priceGhs: 500, durationDays: 7, sortOrder: 1 },
      { professionalType: 'LAWYER', name: 'Indenture Preparation', description: 'Drafting of land sale/purchase indenture', priceGhs: 1500, durationDays: 5, sortOrder: 2 },
      { professionalType: 'LAWYER', name: 'Contract Review', description: 'Legal review of land transaction contracts', priceGhs: 800, durationDays: 3, sortOrder: 3 },
      { professionalType: 'LAWYER', name: 'Land Registration', description: 'Processing land registration at Lands Commission', priceGhs: 2000, durationDays: 30, sortOrder: 4 },
      { professionalType: 'LAWYER', name: 'Legal Opinion', description: 'Written legal opinion on land matters', priceGhs: 1000, durationDays: 5, sortOrder: 5 },
      { professionalType: 'LAWYER', name: 'Due Diligence Report', description: 'Comprehensive legal due diligence on property', priceGhs: 2500, durationDays: 14, sortOrder: 6 },

      // ARCHITECT services
      { professionalType: 'ARCHITECT', name: 'Building Design', description: 'Complete architectural design for residential/commercial building', priceGhs: 5000, durationDays: 21, sortOrder: 1 },
      { professionalType: 'ARCHITECT', name: 'Floor Plan Design', description: 'Detailed floor plan layout design', priceGhs: 2000, durationDays: 7, sortOrder: 2 },
      { professionalType: 'ARCHITECT', name: '3D Visualization', description: '3D rendering and visualization of proposed building', priceGhs: 3000, durationDays: 10, sortOrder: 3 },
      { professionalType: 'ARCHITECT', name: 'Permit Drawings', description: 'Preparation of drawings for building permit application', priceGhs: 2500, durationDays: 7, sortOrder: 4 },
      { professionalType: 'ARCHITECT', name: 'Site Analysis', description: 'Analysis of site conditions and constraints', priceGhs: 1500, durationDays: 5, sortOrder: 5 },

      // ENGINEER services
      { professionalType: 'ENGINEER', name: 'Structural Design', description: 'Structural engineering design and calculations', priceGhs: 4000, durationDays: 14, sortOrder: 1 },
      { professionalType: 'ENGINEER', name: 'Foundation Design', description: 'Foundation design based on soil conditions', priceGhs: 2500, durationDays: 7, sortOrder: 2 },
      { professionalType: 'ENGINEER', name: 'Structural Assessment', description: 'Assessment of existing structure condition', priceGhs: 2000, durationDays: 5, sortOrder: 3 },
      { professionalType: 'ENGINEER', name: 'Bill of Quantities', description: 'Detailed bill of quantities for construction', priceGhs: 1500, durationDays: 7, sortOrder: 4 },

      // VALUER services
      { professionalType: 'VALUER', name: 'Property Valuation', description: 'Professional valuation of land or property', priceGhs: 1500, durationDays: 5, sortOrder: 1 },
      { professionalType: 'VALUER', name: 'Market Analysis', description: 'Comparative market analysis for pricing', priceGhs: 1000, durationDays: 3, sortOrder: 2 },
      { professionalType: 'VALUER', name: 'Valuation Report', description: 'Formal valuation report for bank/legal purposes', priceGhs: 2000, durationDays: 7, sortOrder: 3 },

      // PLANNER services
      { professionalType: 'PLANNER', name: 'Development Permit', description: 'Processing of development/building permit', priceGhs: 2000, durationDays: 30, sortOrder: 1 },
      { professionalType: 'PLANNER', name: 'Zoning Verification', description: 'Verification of land zoning and permitted uses', priceGhs: 500, durationDays: 3, sortOrder: 2 },
      { professionalType: 'PLANNER', name: 'Land Use Planning', description: 'Land use planning and advisory', priceGhs: 3000, durationDays: 14, sortOrder: 3 },

      // AGENT services
      { professionalType: 'AGENT', name: 'Property Listing', description: 'List and market your property for sale', priceGhs: 0, durationDays: 90, sortOrder: 1 },
      { professionalType: 'AGENT', name: 'Property Search', description: 'Find properties matching your requirements', priceGhs: 500, durationDays: 14, sortOrder: 2 },
      { professionalType: 'AGENT', name: 'Site Visit Coordination', description: 'Arrange and accompany site visits', priceGhs: 200, durationDays: 1, sortOrder: 3 },
      { professionalType: 'AGENT', name: 'Negotiation Services', description: 'Negotiate on your behalf with buyers/sellers', priceGhs: 0, durationDays: 7, sortOrder: 4 },
    ];

    let created = 0;
    let skipped = 0;

    for (const service of defaultServices) {
      try {
        await this.prisma.serviceCatalog.upsert({
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
            sortOrder: service.sortOrder,
            isActive: true,
          },
          create: {
            professionalType: service.professionalType as any,
            name: service.name,
            description: service.description,
            priceGhs: service.priceGhs,
            durationDays: service.durationDays,
            sortOrder: service.sortOrder,
          },
        });
        created++;
      } catch (error) {
        skipped++;
      }
    }

    return {
      success: true,
      message: `Seeded ${created} service catalog items (${skipped} skipped)`,
    };
  }
}
