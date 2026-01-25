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
    const listing = await this.prisma.listing.create({
      data: {
        tenantId: user.tenantId,
        sellerId: user.id,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        landType: dto.landType,
        tenureType: dto.tenureType,
        leasePeriodYears: dto.leasePeriodYears,
        sizeAcres: dto.sizeAcres,
        priceGhs: dto.priceGhs,
        region: dto.region,
        district: dto.district,
        town: dto.town,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        listingStatus: 'DRAFT',
      },
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
}
