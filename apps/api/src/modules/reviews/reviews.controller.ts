import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // Seller Reviews
  @Post('seller')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a seller review after completed transaction' })
  async createSellerReview(
    @Request() req: any,
    @Body() body: { transactionId: string; rating: number; title?: string; comment?: string },
  ) {
    return this.reviewsService.createSellerReview(req.user.id, body.transactionId, {
      rating: body.rating,
      title: body.title,
      comment: body.comment,
    });
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get all reviews for a seller' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getSellerReviews(
    @Param('sellerId') sellerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.getSellerReviews(
      sellerId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('seller/:sellerId/summary')
  @ApiOperation({ summary: 'Get rating summary for a seller' })
  async getSellerRatingSummary(@Param('sellerId') sellerId: string) {
    return this.reviewsService.getSellerRatingSummary(sellerId);
  }

  @Put('seller/:reviewId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a seller review' })
  async updateSellerReview(
    @Request() req: any,
    @Param('reviewId') reviewId: string,
    @Body() body: { rating?: number; title?: string; comment?: string },
  ) {
    return this.reviewsService.updateSellerReview(req.user.id, reviewId, body);
  }

  @Delete('seller/:reviewId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a seller review' })
  async deleteSellerReview(@Request() req: any, @Param('reviewId') reviewId: string) {
    return this.reviewsService.deleteSellerReview(req.user.id, reviewId);
  }

  // Professional Reviews
  @Post('professional')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a professional review after completed service' })
  async createProfessionalReview(
    @Request() req: any,
    @Body() body: { serviceRequestId: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.createProfessionalReview(req.user.id, body.serviceRequestId, {
      rating: body.rating,
      comment: body.comment,
    });
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Get all reviews for a professional' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getProfessionalReviews(
    @Param('professionalId') professionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.getProfessionalReviews(
      professionalId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
