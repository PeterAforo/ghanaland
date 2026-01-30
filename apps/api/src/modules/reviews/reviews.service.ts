import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // Seller Reviews
  async createSellerReview(
    buyerId: string,
    transactionId: string,
    data: { rating: number; title?: string; comment?: string },
  ) {
    // Verify transaction exists and is completed
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { sellerReview: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer can review this transaction');
    }

    if (transaction.status !== 'COMPLETED') {
      throw new BadRequestException('Can only review completed transactions');
    }

    if (transaction.sellerReview) {
      throw new BadRequestException('Review already exists for this transaction');
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const review = await this.prisma.sellerReview.create({
      data: {
        transactionId,
        sellerId: transaction.sellerId,
        buyerId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        isVerified: true,
      },
      include: {
        buyer: { select: { id: true, fullName: true } },
      },
    });

    return {
      success: true,
      data: review,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getSellerReviews(sellerId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total, stats] = await Promise.all([
      this.prisma.sellerReview.findMany({
        where: { sellerId },
        include: {
          buyer: { select: { id: true, fullName: true, avatarUrl: true } },
          transaction: {
            select: {
              listing: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sellerReview.count({ where: { sellerId } }),
      this.prisma.sellerReview.aggregate({
        where: { sellerId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Calculate rating distribution
    const distribution = await this.prisma.sellerReview.groupBy({
      by: ['rating'],
      where: { sellerId },
      _count: { rating: true },
    });

    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    };
    distribution.forEach((d) => {
      ratingDistribution[d.rating as keyof typeof ratingDistribution] = d._count.rating;
    });

    return {
      success: true,
      data: reviews,
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
        stats: {
          averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
          totalReviews: stats._count.rating,
          ratingDistribution,
        },
      },
      error: null,
    };
  }

  async getSellerRatingSummary(sellerId: string) {
    const stats = await this.prisma.sellerReview.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const distribution = await this.prisma.sellerReview.groupBy({
      by: ['rating'],
      where: { sellerId },
      _count: { rating: true },
    });

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingDistribution[d.rating as keyof typeof ratingDistribution] = d._count.rating;
    });

    return {
      success: true,
      data: {
        averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
        totalReviews: stats._count.rating,
        ratingDistribution,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async updateSellerReview(
    buyerId: string,
    reviewId: string,
    data: { rating?: number; title?: string; comment?: string },
  ) {
    const review = await this.prisma.sellerReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.buyerId !== buyerId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const updated = await this.prisma.sellerReview.update({
      where: { id: reviewId },
      data: {
        ...(data.rating && { rating: data.rating }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.comment !== undefined && { comment: data.comment }),
      },
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async deleteSellerReview(buyerId: string, reviewId: string) {
    const review = await this.prisma.sellerReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.buyerId !== buyerId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.sellerReview.delete({
      where: { id: reviewId },
    });

    return {
      success: true,
      data: { message: 'Review deleted' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Professional Reviews (enhance existing)
  async getProfessionalReviews(professionalId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total, stats] = await Promise.all([
      this.prisma.professionalReview.findMany({
        where: { profileId: professionalId },
        include: {
          reviewer: { select: { id: true, fullName: true, avatarUrl: true } },
          request: {
            select: {
              service: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.professionalReview.count({ where: { profileId: professionalId } }),
      this.prisma.professionalReview.aggregate({
        where: { profileId: professionalId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const distribution = await this.prisma.professionalReview.groupBy({
      by: ['rating'],
      where: { profileId: professionalId },
      _count: { rating: true },
    });

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingDistribution[d.rating as keyof typeof ratingDistribution] = d._count.rating;
    });

    return {
      success: true,
      data: reviews,
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
        stats: {
          averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
          totalReviews: stats._count.rating,
          ratingDistribution,
        },
      },
      error: null,
    };
  }

  async createProfessionalReview(
    reviewerId: string,
    serviceRequestId: string,
    data: { rating: number; comment?: string },
  ) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: { review: true },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.clientId !== reviewerId) {
      throw new ForbiddenException('Only the client can review this service');
    }

    if (request.status !== 'COMPLETED') {
      throw new BadRequestException('Can only review completed services');
    }

    if (request.review) {
      throw new BadRequestException('Review already exists for this service');
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const review = await this.prisma.professionalReview.create({
      data: {
        requestId: serviceRequestId,
        profileId: request.professionalId,
        reviewerId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Update professional profile rating
    const stats = await this.prisma.professionalReview.aggregate({
      where: { profileId: request.professionalId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.professionalProfile.update({
      where: { id: request.professionalId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    return {
      success: true,
      data: review,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
