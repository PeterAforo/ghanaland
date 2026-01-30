import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MnotifyService } from './mnotify.service';
import { EmailService } from './email.service';
import { NotificationType, NotificationTemplate } from './dto';
import { NotificationCategory } from '@prisma/client';

interface NotificationVariables {
  [key: string]: string;
}

interface CreateInAppNotificationDto {
  userId: string;
  type: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private mnotify: MnotifyService,
    private email: EmailService,
  ) {}

  async sendNotification(
    userId: string,
    template: NotificationTemplate,
    type: NotificationType,
    variables: NotificationVariables = {},
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const results: { sms?: any; email?: any; inApp?: any } = {};

    // Always create in-app notification
    try {
      const title = this.getNotificationTitle(template);
      const message = this.getSmsTemplate(template, variables);
      const category = this.getNotificationCategory(template);
      
      results.inApp = await this.prisma.notification.create({
        data: {
          userId,
          type: category,
          title,
          message,
          data: variables,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create in-app notification: ${error}`);
    }

    if (type === NotificationType.SMS || type === NotificationType.BOTH) {
      if (user.phone) {
        const message = this.getSmsTemplate(template, variables);
        results.sms = await this.mnotify.sendSms(user.phone, message);
      }
    }

    if (type === NotificationType.EMAIL || type === NotificationType.BOTH) {
      if (user.email) {
        const { subject, body } = this.getEmailTemplate(template, variables);
        results.email = await this.email.sendEmail({
          to: user.email,
          subject,
          htmlBody: body,
        });
      }
    }

    return {
      success: true,
      data: results,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  private getNotificationCategory(template: NotificationTemplate): NotificationCategory {
    const categoryMap: Record<NotificationTemplate, NotificationCategory> = {
      [NotificationTemplate.WELCOME]: NotificationCategory.SYSTEM,
      [NotificationTemplate.PAYMENT_RECEIVED]: NotificationCategory.PAYMENT,
      [NotificationTemplate.PAYMENT_FAILED]: NotificationCategory.PAYMENT,
      [NotificationTemplate.VERIFICATION_SUBMITTED]: NotificationCategory.VERIFICATION,
      [NotificationTemplate.VERIFICATION_APPROVED]: NotificationCategory.VERIFICATION,
      [NotificationTemplate.VERIFICATION_REJECTED]: NotificationCategory.VERIFICATION,
      [NotificationTemplate.LISTING_PUBLISHED]: NotificationCategory.LISTING,
      [NotificationTemplate.LISTING_INQUIRY]: NotificationCategory.INQUIRY,
      [NotificationTemplate.TRANSACTION_CREATED]: NotificationCategory.TRANSACTION,
      [NotificationTemplate.ESCROW_FUNDED]: NotificationCategory.ESCROW,
      [NotificationTemplate.ESCROW_RELEASED]: NotificationCategory.ESCROW,
      [NotificationTemplate.OTP]: NotificationCategory.SYSTEM,
      [NotificationTemplate.PASSWORD_RESET]: NotificationCategory.SYSTEM,
    };
    return categoryMap[template] || NotificationCategory.SYSTEM;
  }

  async sendSms(phone: string, message: string) {
    const result = await this.mnotify.sendSms(phone, message);
    return {
      success: result.success,
      data: result,
      meta: { requestId: `req_${Date.now()}` },
      error: result.success ? null : { message: result.message },
    };
  }

  async sendBulkSms(phones: string[], message: string) {
    const result = await this.mnotify.sendBulkSms(phones, message);
    return {
      success: result.success,
      data: result,
      meta: { requestId: `req_${Date.now()}` },
      error: result.success ? null : { message: result.message },
    };
  }

  async sendEmail(to: string, subject: string, body: string) {
    const result = await this.email.sendEmail({
      to,
      subject,
      htmlBody: body,
    });
    return {
      success: result.success,
      data: result,
      meta: { requestId: `req_${Date.now()}` },
      error: result.success ? null : { message: result.message },
    };
  }

  async getSmsBalance() {
    const result = await this.mnotify.checkBalance();
    return {
      success: result.success,
      data: { balance: result.balance },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // ============================================================================
  // IN-APP NOTIFICATIONS
  // ============================================================================

  async createInAppNotification(dto: CreateInAppNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data || {},
      },
    });

    return {
      success: true,
      data: notification,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      success: true,
      data: notifications,
      meta: {
        requestId: `req_${Date.now()}`,
        pagination: { page, pageSize: limit, total },
        unreadCount,
      },
      error: null,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      success: true,
      data: { unreadCount: count },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return {
      success: true,
      data: updated,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return {
      success: true,
      data: { message: 'All notifications marked as read' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      success: true,
      data: { message: 'Notification deleted' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  // Helper method to create notification and optionally send SMS/email
  async notify(
    userId: string,
    template: NotificationTemplate,
    category: NotificationCategory,
    variables: NotificationVariables = {},
    sendExternal: NotificationType = NotificationType.BOTH,
  ) {
    // Create in-app notification
    const title = this.getNotificationTitle(template);
    const message = this.getSmsTemplate(template, variables);
    
    await this.createInAppNotification({
      userId,
      type: category,
      title,
      message,
      data: variables,
    });

    // Send external notifications (SMS/email)
    if (sendExternal !== NotificationType.EMAIL) {
      // Only send external if not just email (to avoid double sending)
      await this.sendNotification(userId, template, sendExternal, variables);
    }
  }

  private getNotificationTitle(template: NotificationTemplate): string {
    const titles: Record<NotificationTemplate, string> = {
      [NotificationTemplate.WELCOME]: 'Welcome to Ghana Lands!',
      [NotificationTemplate.PAYMENT_RECEIVED]: 'Payment Received',
      [NotificationTemplate.PAYMENT_FAILED]: 'Payment Failed',
      [NotificationTemplate.VERIFICATION_SUBMITTED]: 'Verification Submitted',
      [NotificationTemplate.VERIFICATION_APPROVED]: 'Listing Verified!',
      [NotificationTemplate.VERIFICATION_REJECTED]: 'Verification Not Approved',
      [NotificationTemplate.LISTING_PUBLISHED]: 'Listing Published',
      [NotificationTemplate.LISTING_INQUIRY]: 'New Inquiry',
      [NotificationTemplate.TRANSACTION_CREATED]: 'New Transaction',
      [NotificationTemplate.ESCROW_FUNDED]: 'Escrow Funded',
      [NotificationTemplate.ESCROW_RELEASED]: 'Escrow Released',
      [NotificationTemplate.OTP]: 'Verification Code',
      [NotificationTemplate.PASSWORD_RESET]: 'Password Reset',
    };
    return titles[template] || 'Notification';
  }

  private getSmsTemplate(template: NotificationTemplate, variables: NotificationVariables): string {
    const templates: Record<NotificationTemplate, string> = {
      [NotificationTemplate.WELCOME]: `Welcome to Ghana Lands, ${variables.name || 'User'}! Your account has been created successfully.`,
      [NotificationTemplate.PAYMENT_RECEIVED]: `Payment of GHS ${variables.amount || '0'} received for ${variables.listing || 'your transaction'}. Ref: ${variables.reference || 'N/A'}`,
      [NotificationTemplate.PAYMENT_FAILED]: `Payment of GHS ${variables.amount || '0'} failed. Please try again or contact support.`,
      [NotificationTemplate.VERIFICATION_SUBMITTED]: `Your verification request for "${variables.listing || 'your listing'}" has been submitted and is under review.`,
      [NotificationTemplate.VERIFICATION_APPROVED]: `Great news! Your listing "${variables.listing || ''}" has been verified and approved.`,
      [NotificationTemplate.VERIFICATION_REJECTED]: `Your verification request for "${variables.listing || ''}" was not approved. Reason: ${variables.reason || 'See details in app'}`,
      [NotificationTemplate.LISTING_PUBLISHED]: `Your listing "${variables.listing || ''}" is now live on Ghana Lands!`,
      [NotificationTemplate.LISTING_INQUIRY]: `New inquiry for "${variables.listing || ''}": "${variables.message || ''}" - from ${variables.senderName || 'a buyer'}`,
      [NotificationTemplate.TRANSACTION_CREATED]: `A new transaction has been created for "${variables.listing || ''}". Amount: GHS ${variables.amount || '0'}`,
      [NotificationTemplate.ESCROW_FUNDED]: `Escrow funded! GHS ${variables.amount || '0'} is now held securely for "${variables.listing || ''}"`,
      [NotificationTemplate.ESCROW_RELEASED]: `Escrow released! GHS ${variables.amount || '0'} has been transferred for "${variables.listing || ''}"`,
      [NotificationTemplate.OTP]: `Your Ghana Lands verification code is: ${variables.code || '000000'}. Valid for 10 minutes.`,
      [NotificationTemplate.PASSWORD_RESET]: `Your password reset code is: ${variables.code || '000000'}. Valid for 15 minutes.`,
    };

    return templates[template] || 'Ghana Lands notification';
  }

  private getEmailTemplate(
    template: NotificationTemplate,
    variables: NotificationVariables,
  ): { subject: string; body: string } {
    const templates: Record<NotificationTemplate, { subject: string; body: string }> = {
      [NotificationTemplate.WELCOME]: {
        subject: 'Welcome to Ghana Lands!',
        body: `
          <h1>Welcome to Ghana Lands, ${variables.name || 'User'}!</h1>
          <p>Your account has been created successfully.</p>
          <p>Start exploring land listings or create your own to sell.</p>
          <p>Best regards,<br>The Ghana Lands Team</p>
        `,
      },
      [NotificationTemplate.PAYMENT_RECEIVED]: {
        subject: 'Payment Received - Ghana Lands',
        body: `
          <h1>Payment Confirmed</h1>
          <p>We have received your payment of <strong>GHS ${variables.amount || '0'}</strong>.</p>
          <p><strong>Listing:</strong> ${variables.listing || 'N/A'}</p>
          <p><strong>Reference:</strong> ${variables.reference || 'N/A'}</p>
          <p>Thank you for using Ghana Lands!</p>
        `,
      },
      [NotificationTemplate.PAYMENT_FAILED]: {
        subject: 'Payment Failed - Ghana Lands',
        body: `
          <h1>Payment Failed</h1>
          <p>Your payment of <strong>GHS ${variables.amount || '0'}</strong> could not be processed.</p>
          <p>Please try again or contact our support team for assistance.</p>
        `,
      },
      [NotificationTemplate.VERIFICATION_SUBMITTED]: {
        subject: 'Verification Request Submitted - Ghana Lands',
        body: `
          <h1>Verification Request Received</h1>
          <p>Your verification request for "<strong>${variables.listing || 'your listing'}</strong>" has been submitted.</p>
          <p>Our team will review it and get back to you within 3-5 business days.</p>
        `,
      },
      [NotificationTemplate.VERIFICATION_APPROVED]: {
        subject: 'Listing Verified! - Ghana Lands',
        body: `
          <h1>Congratulations!</h1>
          <p>Your listing "<strong>${variables.listing || ''}</strong>" has been verified and approved.</p>
          <p>Your listing now displays a verified badge, increasing buyer trust.</p>
        `,
      },
      [NotificationTemplate.VERIFICATION_REJECTED]: {
        subject: 'Verification Not Approved - Ghana Lands',
        body: `
          <h1>Verification Update</h1>
          <p>Unfortunately, your verification request for "<strong>${variables.listing || ''}</strong>" was not approved.</p>
          <p><strong>Reason:</strong> ${variables.reason || 'Please check the app for details'}</p>
          <p>You can resubmit with the required corrections.</p>
        `,
      },
      [NotificationTemplate.LISTING_PUBLISHED]: {
        subject: 'Your Listing is Live! - Ghana Lands',
        body: `
          <h1>Your Listing is Now Live!</h1>
          <p>"<strong>${variables.listing || ''}</strong>" is now visible to potential buyers on Ghana Lands.</p>
          <p>Share your listing to reach more buyers!</p>
        `,
      },
      [NotificationTemplate.LISTING_INQUIRY]: {
        subject: 'New Inquiry for Your Listing - Ghana Lands',
        body: `
          <h1>You Have a New Inquiry!</h1>
          <p>Someone is interested in your listing "<strong>${variables.listing || ''}</strong>".</p>
          <p><strong>From:</strong> ${variables.senderName || 'A potential buyer'}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #2563eb; margin: 10px 0;">
            ${variables.message || ''}
          </blockquote>
          <p>Log in to your dashboard to respond to this inquiry.</p>
        `,
      },
      [NotificationTemplate.TRANSACTION_CREATED]: {
        subject: 'New Transaction Created - Ghana Lands',
        body: `
          <h1>New Transaction</h1>
          <p>A new transaction has been created for "<strong>${variables.listing || ''}</strong>".</p>
          <p><strong>Amount:</strong> GHS ${variables.amount || '0'}</p>
          <p>Log in to your dashboard to view details.</p>
        `,
      },
      [NotificationTemplate.ESCROW_FUNDED]: {
        subject: 'Escrow Funded - Ghana Lands',
        body: `
          <h1>Escrow Funded Successfully</h1>
          <p><strong>GHS ${variables.amount || '0'}</strong> is now held securely in escrow for "<strong>${variables.listing || ''}</strong>".</p>
          <p>The funds will be released upon successful completion of the transaction.</p>
        `,
      },
      [NotificationTemplate.ESCROW_RELEASED]: {
        subject: 'Escrow Released - Ghana Lands',
        body: `
          <h1>Escrow Released</h1>
          <p><strong>GHS ${variables.amount || '0'}</strong> has been released for "<strong>${variables.listing || ''}</strong>".</p>
          <p>Thank you for completing your transaction on Ghana Lands!</p>
        `,
      },
      [NotificationTemplate.OTP]: {
        subject: 'Your Verification Code - Ghana Lands',
        body: `
          <h1>Verification Code</h1>
          <p>Your verification code is: <strong style="font-size: 24px;">${variables.code || '000000'}</strong></p>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `,
      },
      [NotificationTemplate.PASSWORD_RESET]: {
        subject: 'Password Reset - Ghana Lands',
        body: `
          <h1>Password Reset Request</h1>
          <p>Your password reset code is: <strong style="font-size: 24px;">${variables.code || '000000'}</strong></p>
          <p>This code is valid for 15 minutes.</p>
          <p>If you didn't request this, please secure your account immediately.</p>
        `,
      },
    };

    return templates[template] || { subject: 'Ghana Lands Notification', body: '<p>You have a new notification.</p>' };
  }
}
