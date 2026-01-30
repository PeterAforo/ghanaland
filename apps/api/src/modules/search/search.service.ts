import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface SearchFilters {
  query?: string;
  region?: string;
  district?: string;
  category?: string;
  landType?: string;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  verifiedOnly?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async fullTextSearch(filters: SearchFilters) {
    const {
      query,
      region,
      district,
      category,
      landType,
      minPrice,
      maxPrice,
      minSize,
      maxSize,
      verifiedOnly,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {
      listingStatus: 'PUBLISHED',
    };

    // Full-text search using Postgres
    if (query && query.trim()) {
      // Use case-insensitive search across multiple fields
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { region: { contains: query, mode: 'insensitive' } },
        { district: { contains: query, mode: 'insensitive' } },
        { town: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (region) where.region = region;
    if (district) where.district = district;
    if (category) where.category = category;
    if (landType) where.landType = landType;
    if (verifiedOnly) where.verificationStatus = 'VERIFIED';

    if (minPrice || maxPrice) {
      where.priceGhs = {};
      if (minPrice) where.priceGhs.gte = minPrice;
      if (maxPrice) where.priceGhs.lte = maxPrice;
    }

    if (minSize || maxSize) {
      where.sizeAcres = {};
      if (minSize) where.sizeAcres.gte = minSize;
      if (maxSize) where.sizeAcres.lte = maxSize;
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price_low':
        orderBy = { priceGhs: 'asc' };
        break;
      case 'price_high':
        orderBy = { priceGhs: 'desc' };
        break;
      case 'size_low':
        orderBy = { sizeAcres: 'asc' };
        break;
      case 'size_high':
        orderBy = { sizeAcres: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'relevance':
      default:
        // For relevance, prioritize verified listings and view count
        orderBy = [
          { verificationStatus: 'desc' },
          { viewCount: 'desc' },
          { createdAt: 'desc' },
        ];
        break;
    }

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, fullName: true } },
          media: { take: 1, orderBy: { order: 'asc' } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      success: true,
      data: listings.map((l) => ({
        ...l,
        priceGhs: l.priceGhs.toString(),
        sizeAcres: l.sizeAcres.toString(),
        pricePerPlot: l.pricePerPlot?.toString() || null,
      })),
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: {
          page,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          query,
          region,
          district,
          category,
          landType,
          minPrice,
          maxPrice,
          verifiedOnly,
        },
      },
      error: null,
    };
  }

  async getNearbyListings(latitude: number, longitude: number, radiusKm: number = 10, limit: number = 20) {
    // Using raw SQL with PostGIS for geospatial queries
    const listings = await this.prisma.$queryRaw`
      SELECT 
        l.id,
        l.title,
        l.category,
        l.region,
        l.district,
        l.price_ghs as "priceGhs",
        l.size_acres as "sizeAcres",
        l.latitude,
        l.longitude,
        l.verification_status as "verificationStatus",
        ST_Distance(
          ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) / 1000 as "distanceKm"
      FROM listings l
      WHERE l.listing_status = 'PUBLISHED'
        AND l.latitude IS NOT NULL
        AND l.longitude IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusKm * 1000}
        )
      ORDER BY "distanceKm" ASC
      LIMIT ${limit}
    `;

    // Get media for each listing
    const listingIds = (listings as any[]).map((l) => l.id);
    const media = await this.prisma.listingMedia.findMany({
      where: { listingId: { in: listingIds } },
      orderBy: { order: 'asc' },
    });

    const mediaByListing = media.reduce((acc, m) => {
      if (!acc[m.listingId]) acc[m.listingId] = [];
      acc[m.listingId].push(m);
      return acc;
    }, {} as Record<string, typeof media>);

    return {
      success: true,
      data: (listings as any[]).map((l) => ({
        ...l,
        priceGhs: l.priceGhs?.toString() || '0',
        sizeAcres: l.sizeAcres?.toString() || '0',
        distanceKm: parseFloat(l.distanceKm?.toFixed(2) || '0'),
        media: mediaByListing[l.id]?.slice(0, 1) || [],
      })),
      meta: {
        requestId: `req_${Date.now()}`,
        center: { latitude, longitude },
        radiusKm,
      },
      error: null,
    };
  }

  async getSearchSuggestions(query: string) {
    if (!query || query.length < 2) {
      return { success: true, data: [], meta: { requestId: `req_${Date.now()}` }, error: null };
    }

    // Get suggestions from regions, districts, and listing titles
    const [regions, districts, titles] = await Promise.all([
      this.prisma.listing.findMany({
        where: {
          listingStatus: 'PUBLISHED',
          region: { contains: query, mode: 'insensitive' },
        },
        select: { region: true },
        distinct: ['region'],
        take: 5,
      }),
      this.prisma.listing.findMany({
        where: {
          listingStatus: 'PUBLISHED',
          district: { contains: query, mode: 'insensitive' },
        },
        select: { district: true, region: true },
        distinct: ['district'],
        take: 5,
      }),
      this.prisma.listing.findMany({
        where: {
          listingStatus: 'PUBLISHED',
          title: { contains: query, mode: 'insensitive' },
        },
        select: { id: true, title: true },
        take: 5,
      }),
    ]);

    const suggestions = [
      ...regions.map((r) => ({ type: 'region', value: r.region, label: r.region })),
      ...districts.map((d) => ({ type: 'district', value: d.district, label: `${d.district}, ${d.region}` })),
      ...titles.map((t) => ({ type: 'listing', value: t.id, label: t.title })),
    ];

    return {
      success: true,
      data: suggestions.slice(0, 10),
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Saved Searches
  async createSavedSearch(userId: string, name: string, filters: SearchFilters, notifyOnNew: boolean = true) {
    const savedSearch = await this.prisma.savedSearch.create({
      data: {
        userId,
        name,
        filters: filters as any,
        notifyOnNew,
      },
    });

    return {
      success: true,
      data: savedSearch,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getSavedSearches(userId: string) {
    const savedSearches = await this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: savedSearches,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getSavedSearch(userId: string, searchId: string) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    if (savedSearch.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      success: true,
      data: savedSearch,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateSavedSearch(userId: string, searchId: string, data: { name?: string; filters?: SearchFilters; notifyOnNew?: boolean }) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    if (savedSearch.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.savedSearch.update({
      where: { id: searchId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.filters && { filters: data.filters as any }),
        ...(data.notifyOnNew !== undefined && { notifyOnNew: data.notifyOnNew }),
      },
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async deleteSavedSearch(userId: string, searchId: string) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    if (savedSearch.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.savedSearch.delete({
      where: { id: searchId },
    });

    return {
      success: true,
      data: { message: 'Saved search deleted' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async runSavedSearch(userId: string, searchId: string) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    if (savedSearch.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const filters = savedSearch.filters as SearchFilters;
    return this.fullTextSearch(filters);
  }
}
