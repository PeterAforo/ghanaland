import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async addFavorite(userId: string, listingId: string) {
    // Check if listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: { userId, listingId },
      },
    });

    if (existing) {
      throw new ConflictException('Listing already in favorites');
    }

    const favorite = await this.prisma.favorite.create({
      data: { userId, listingId },
      include: {
        listing: {
          include: {
            media: { take: 1 },
            seller: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    return {
      success: true,
      data: {
        id: favorite.id,
        listingId: favorite.listingId,
        createdAt: favorite.createdAt,
        listing: {
          ...favorite.listing,
          priceGhs: favorite.listing.priceGhs.toString(),
          sizeAcres: favorite.listing.sizeAcres.toString(),
        },
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async removeFavorite(userId: string, listingId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: { userId, listingId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return {
      success: true,
      data: { removed: true },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getUserFavorites(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          listing: {
            include: {
              media: { take: 1 },
              seller: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      success: true,
      data: favorites.map((f) => ({
        id: f.id,
        listingId: f.listingId,
        createdAt: f.createdAt,
        listing: {
          ...f.listing,
          priceGhs: f.listing.priceGhs.toString(),
          sizeAcres: f.listing.sizeAcres.toString(),
        },
      })),
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
      },
      error: null,
    };
  }

  async checkFavorite(userId: string, listingId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: { userId, listingId },
      },
    });

    return {
      success: true,
      data: { isFavorite: !!favorite },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async checkMultipleFavorites(userId: string, listingIds: string[]) {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        listingId: { in: listingIds },
      },
      select: { listingId: true },
    });

    const favoriteSet = new Set(favorites.map((f) => f.listingId));

    return {
      success: true,
      data: listingIds.reduce((acc, id) => {
        acc[id] = favoriteSet.has(id);
        return acc;
      }, {} as Record<string, boolean>),
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
