import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { category, region, district, minPrice, maxPrice, page = 1, limit = 20 } = query;

    const where: any = {
      listingStatus: 'PUBLISHED',
    };

    if (category) where.category = category;
    if (region) where.region = region;
    if (district) where.district = district;
    if (minPrice || maxPrice) {
      where.priceGhs = {};
      if (minPrice) where.priceGhs.gte = parseFloat(minPrice);
      if (maxPrice) where.priceGhs.lte = parseFloat(maxPrice);
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, fullName: true } },
          media: { take: 1 },
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
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
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(limit),
          total,
        },
      },
      error: null,
    };
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, fullName: true, phone: true } },
        media: true,
        documents: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count
    await this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      success: true,
      data: {
        ...listing,
        priceGhs: listing.priceGhs.toString(),
        sizeAcres: listing.sizeAcres.toString(),
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async create(user: any, dto: any) {
    // Calculate total price from per-plot pricing if provided
    const pricePerPlot = dto.pricePerPlot ? parseFloat(dto.pricePerPlot) : 0;
    const totalPlots = dto.totalPlots || 0;
    const totalPrice = pricePerPlot * totalPlots;
    
    // Calculate size in acres from plot dimensions if provided
    let sizeAcres = dto.sizeAcres || 0;
    if (dto.plotLength && dto.plotWidth && dto.totalPlots) {
      const plotArea = dto.plotLength * dto.plotWidth;
      const totalArea = plotArea * dto.totalPlots;
      // Convert to acres based on unit
      if (dto.plotDimensionUnit === 'FEET') {
        sizeAcres = totalArea / 43560; // sq ft to acres
      } else if (dto.plotDimensionUnit === 'METERS') {
        sizeAcres = totalArea / 4046.86; // sq m to acres
      }
    }

    const listing = await this.prisma.listing.create({
      data: {
        tenantId: user.tenantId,
        sellerId: user.id,
        title: dto.title,
        description: dto.description || null,
        category: dto.category,
        landType: dto.landType,
        tenureType: dto.tenureType,
        leasePeriodYears: dto.leasePeriodYears || null,
        sizeAcres: sizeAcres,
        priceGhs: totalPrice || dto.priceGhs || 0,
        
        // Per-plot pricing
        plotLength: dto.plotLength || null,
        plotWidth: dto.plotWidth || null,
        plotDimensionUnit: dto.plotDimensionUnit || 'FEET',
        totalPlots: dto.totalPlots || null,
        availablePlots: dto.totalPlots || null,
        pricePerPlot: pricePerPlot || null,
        
        // Payment options
        allowOneTimePayment: dto.allowOneTimePayment ?? true,
        allowInstallments: dto.allowInstallments ?? false,
        installmentPackages: dto.installmentPackages || null,
        
        // Payment milestones
        landAccessPercentage: dto.landAccessPercentage || null,
        sitePlanAccessPercentage: dto.sitePlanAccessPercentage || null,
        documentTransferPercentage: dto.documentTransferPercentage || null,
        
        // Location
        region: dto.region,
        district: dto.district,
        constituency: dto.constituency || null,
        town: dto.town || null,
        address: dto.address || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        
        listingStatus: 'DRAFT',
      },
    });

    return {
      success: true,
      data: {
        ...listing,
        priceGhs: listing.priceGhs.toString(),
        sizeAcres: listing.sizeAcres.toString(),
        pricePerPlot: listing.pricePerPlot?.toString() || null,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
