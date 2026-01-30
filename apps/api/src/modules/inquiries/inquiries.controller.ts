import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';

@ApiTags('Inquiries')
@Controller('inquiries')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class InquiriesController {
  constructor(private inquiriesService: InquiriesService) {}

  @Post()
  @ApiOperation({ summary: 'Send an inquiry to a listing seller' })
  async createInquiry(
    @Request() req: any,
    @Body() dto: { listingId: string; message: string },
  ) {
    return this.inquiriesService.createInquiry(req.user.id, dto);
  }

  @Get('received')
  @ApiOperation({ summary: 'Get inquiries received (as seller)' })
  async getReceivedInquiries(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inquiriesService.getReceivedInquiries(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get inquiries sent (as buyer)' })
  async getSentInquiries(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inquiriesService.getSentInquiries(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread inquiries' })
  async getUnreadCount(@Request() req: any) {
    return this.inquiriesService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark inquiry as read' })
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.inquiriesService.markAsRead(req.user.id, id);
  }
}
