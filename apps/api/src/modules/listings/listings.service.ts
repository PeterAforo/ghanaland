import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../documents/cloudinary.service';
import { MediaType } from '@prisma/client';

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async findAll(query: any) {
    const { 
      category, 
      region, 
      district, 
      landType,
      minPrice, 
      maxPrice, 
      query: searchQuery,
      sortBy = 'newest',
      page = 1, 
      limit = 20 
    } = query;

    const where: any = {
      listingStatus: 'PUBLISHED',
    };

    if (category) where.category = category;
    if (region) where.region = region;
    if (district) where.district = district;
    if (landType) where.landType = landType;
    if (minPrice || maxPrice) {
      where.priceGhs = {};
      if (minPrice) where.priceGhs.gte = parseFloat(minPrice);
      if (maxPrice) where.priceGhs.lte = parseFloat(maxPrice);
    }
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { district: { contains: searchQuery, mode: 'insensitive' } },
        { region: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
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

  async findByUser(userId: string, query: any) {
    const { status, page = 1, limit = 20 } = query;

    const where: any = {
      sellerId: userId,
    };

    if (status) where.listingStatus = status;

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          media: { take: 1 },
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
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
        pricePerPlot: l.pricePerPlot?.toString() || null,
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

  async update(userId: string, id: string, dto: any) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    // Calculate total price from per-plot pricing if provided
    const pricePerPlot = dto.pricePerPlot ? parseFloat(dto.pricePerPlot) : (listing.pricePerPlot ? Number(listing.pricePerPlot) : 0);
    const totalPlots = dto.totalPlots || listing.totalPlots || 0;
    const totalPrice = pricePerPlot * totalPlots;

    // Calculate size in acres from plot dimensions if provided
    let sizeAcres = dto.sizeAcres || Number(listing.sizeAcres) || 0;
    const plotLength = dto.plotLength || listing.plotLength;
    const plotWidth = dto.plotWidth || listing.plotWidth;
    const plotDimensionUnit = dto.plotDimensionUnit || listing.plotDimensionUnit;
    
    if (plotLength && plotWidth && totalPlots) {
      const plotArea = plotLength * plotWidth;
      const totalArea = plotArea * totalPlots;
      if (plotDimensionUnit === 'FEET') {
        sizeAcres = totalArea / 43560;
      } else if (plotDimensionUnit === 'METERS') {
        sizeAcres = totalArea / 4046.86;
      }
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        title: dto.title ?? listing.title,
        description: dto.description ?? listing.description,
        category: dto.category ?? listing.category,
        landType: dto.landType ?? listing.landType,
        tenureType: dto.tenureType ?? listing.tenureType,
        leasePeriodYears: dto.leasePeriodYears ?? listing.leasePeriodYears,
        sizeAcres: sizeAcres,
        priceGhs: totalPrice || dto.priceGhs || Number(listing.priceGhs),
        
        plotLength: dto.plotLength ?? listing.plotLength,
        plotWidth: dto.plotWidth ?? listing.plotWidth,
        plotDimensionUnit: dto.plotDimensionUnit ?? listing.plotDimensionUnit,
        totalPlots: dto.totalPlots ?? listing.totalPlots,
        availablePlots: dto.availablePlots ?? listing.availablePlots,
        pricePerPlot: pricePerPlot || listing.pricePerPlot,
        
        allowOneTimePayment: dto.allowOneTimePayment ?? listing.allowOneTimePayment,
        allowInstallments: dto.allowInstallments ?? listing.allowInstallments,
        installmentPackages: dto.installmentPackages ?? listing.installmentPackages,
        
        landAccessPercentage: dto.landAccessPercentage ?? listing.landAccessPercentage,
        sitePlanAccessPercentage: dto.sitePlanAccessPercentage ?? listing.sitePlanAccessPercentage,
        documentTransferPercentage: dto.documentTransferPercentage ?? listing.documentTransferPercentage,
        
        region: dto.region ?? listing.region,
        district: dto.district ?? listing.district,
        constituency: dto.constituency ?? listing.constituency,
        town: dto.town ?? listing.town,
        address: dto.address ?? listing.address,
        latitude: dto.latitude ?? listing.latitude,
        longitude: dto.longitude ?? listing.longitude,
      },
    });

    return {
      success: true,
      data: {
        ...updated,
        priceGhs: updated.priceGhs.toString(),
        sizeAcres: updated.sizeAcres.toString(),
        pricePerPlot: updated.pricePerPlot?.toString() || null,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async delete(userId: string, id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.prisma.listing.delete({
      where: { id },
    });

    return {
      success: true,
      data: { id },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateStatus(userId: string, id: string, status: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    // Validate status transitions
    const validStatuses = ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      throw new ForbiddenException(`Invalid status: ${status}`);
    }

    // Business rules for status transitions
    const currentStatus = listing.listingStatus;
    
    // DRAFT can go to SUBMITTED or PUBLISHED
    // SUBMITTED can go to PUBLISHED (by admin) or back to DRAFT
    // PUBLISHED can go to ARCHIVED or DRAFT
    // For now, allow owner to publish directly (can add admin approval later)
    
    const updateData: any = {
      listingStatus: status,
    };

    // Set publishedAt when publishing
    if (status === 'PUBLISHED' && currentStatus !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: {
        ...updated,
        priceGhs: updated.priceGhs.toString(),
        sizeAcres: updated.sizeAcres.toString(),
        pricePerPlot: updated.pricePerPlot?.toString() || null,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async uploadMedia(userId: string, listingId: string, files: Express.Multer.File[]) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only upload media to your own listings');
    }

    const existingMediaCount = await this.prisma.listingMedia.count({
      where: { listingId },
    });

    const uploadedMedia = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = /\.(mp4|mov|avi)$/i.test(file.originalname);
      const folder = isVideo ? 'ghana-lands/listings/videos' : 'ghana-lands/listings/images';

      const uploadResult = await this.cloudinary.uploadFile(file, folder);

      const media = await this.prisma.listingMedia.create({
        data: {
          listingId,
          url: uploadResult.secureUrl,
          type: isVideo ? MediaType.VIDEO : MediaType.IMAGE,
          order: existingMediaCount + i,
        },
      });

      uploadedMedia.push({
        id: media.id,
        url: media.url,
        type: media.type,
        order: media.order,
        thumbnailUrl: isVideo ? null : this.cloudinary.getThumbnailUrl(uploadResult.publicId),
      });
    }

    return {
      success: true,
      data: uploadedMedia,
      meta: { requestId: `req_${Date.now()}`, count: uploadedMedia.length },
      error: null,
    };
  }

  async deleteMedia(userId: string, listingId: string, mediaId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only delete media from your own listings');
    }

    const media = await this.prisma.listingMedia.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.listingId !== listingId) {
      throw new NotFoundException('Media not found');
    }

    // Extract public ID from Cloudinary URL and delete
    const urlParts = media.url.split('/');
    const publicIdWithExt = urlParts.slice(-3).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    
    try {
      await this.cloudinary.deleteFile(publicId);
    } catch (error) {
      // Log but don't fail if Cloudinary delete fails
      console.error('Failed to delete from Cloudinary:', error);
    }

    await this.prisma.listingMedia.delete({
      where: { id: mediaId },
    });

    return {
      success: true,
      data: { message: 'Media deleted successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async reorderMedia(userId: string, listingId: string, mediaIds: string[]) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only reorder media for your own listings');
    }

    // Update order for each media item
    await Promise.all(
      mediaIds.map((mediaId, index) =>
        this.prisma.listingMedia.update({
          where: { id: mediaId },
          data: { order: index },
        }),
      ),
    );

    const updatedMedia = await this.prisma.listingMedia.findMany({
      where: { listingId },
      orderBy: { order: 'asc' },
    });

    return {
      success: true,
      data: updatedMedia,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
