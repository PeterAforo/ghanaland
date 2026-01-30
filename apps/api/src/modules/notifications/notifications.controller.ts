import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { SendSmsDto, SendBulkSmsDto, SendEmailDto, SendNotificationDto } from './dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // ============================================================================
  // IN-APP NOTIFICATIONS (User-facing)
  // ============================================================================

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notifications' })
  async getMyNotifications(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('me/unread-count')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(req.user.id, id);
  }

  // ============================================================================
  // ADMIN NOTIFICATION SENDING
  // ============================================================================

  @Post('send')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send notification to a user' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendNotification(
      dto.userId,
      dto.template,
      dto.type,
      dto.variables,
    );
  }

  @Post('sms')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send SMS directly' })
  async sendSms(@Body() dto: SendSmsDto) {
    return this.notificationsService.sendSms(dto.phone, dto.message);
  }

  @Post('sms/bulk')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send bulk SMS' })
  async sendBulkSms(@Body() dto: SendBulkSmsDto) {
    return this.notificationsService.sendBulkSms(dto.phones, dto.message);
  }

  @Post('email')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email directly' })
  async sendEmail(@Body() dto: SendEmailDto) {
    return this.notificationsService.sendEmail(dto.email, dto.subject, dto.body);
  }

  @Get('sms/balance')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check SMS balance' })
  async getSmsBalance() {
    return this.notificationsService.getSmsBalance();
  }
}
