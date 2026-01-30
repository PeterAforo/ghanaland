import { IsString, IsEnum, IsOptional, IsArray, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  SMS = 'sms',
  EMAIL = 'email',
  BOTH = 'both',
}

export enum NotificationTemplate {
  WELCOME = 'welcome',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  VERIFICATION_SUBMITTED = 'verification_submitted',
  VERIFICATION_APPROVED = 'verification_approved',
  VERIFICATION_REJECTED = 'verification_rejected',
  LISTING_PUBLISHED = 'listing_published',
  LISTING_INQUIRY = 'listing_inquiry',
  TRANSACTION_CREATED = 'transaction_created',
  ESCROW_FUNDED = 'escrow_funded',
  ESCROW_RELEASED = 'escrow_released',
  OTP = 'otp',
  PASSWORD_RESET = 'password_reset',
}

export class SendSmsDto {
  @ApiProperty({ description: 'Recipient phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'SMS message content' })
  @IsString()
  message: string;
}

export class SendBulkSmsDto {
  @ApiProperty({ description: 'Array of recipient phone numbers' })
  @IsArray()
  @IsString({ each: true })
  phones: string[];

  @ApiProperty({ description: 'SMS message content' })
  @IsString()
  message: string;
}

export class SendEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Email body (HTML)' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Plain text version' })
  @IsOptional()
  @IsString()
  textBody?: string;
}

export class SendNotificationDto {
  @ApiProperty({ description: 'User ID to notify' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: NotificationTemplate, description: 'Notification template' })
  @IsEnum(NotificationTemplate)
  template: NotificationTemplate;

  @ApiProperty({ enum: NotificationType, description: 'Notification type' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({ description: 'Template variables' })
  @IsOptional()
  variables?: Record<string, string>;
}
