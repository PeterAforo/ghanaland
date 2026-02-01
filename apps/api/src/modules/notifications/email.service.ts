import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST') || 'mail.privateemail.com',
      port: this.config.get<number>('SMTP_PORT') || 465,
      secure: true, // SSL/TLS
      auth: {
        user: this.config.get<string>('SMTP_USER') || '',
        pass: this.config.get<string>('SMTP_PASS') || '',
      },
    });
  }

  private getFromEmail(): string {
    return this.config.get<string>('SMTP_USER') || 'admin@buyghanalands.com';
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    const smtpUser = this.config.get<string>('SMTP_USER');
    
    if (!smtpUser) {
      this.logger.warn('SMTP not configured, skipping email');
      return {
        success: false,
        message: 'Email service not configured',
      };
    }

    try {
      this.logger.log(`Sending email to ${options.to}: ${options.subject}`);

      const info = await this.transporter.sendMail({
        from: `"Ghana Lands" <${options.from || this.getFromEmail()}>`,
        to: options.to,
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody || this.stripHtml(options.htmlBody),
        replyTo: options.replyTo,
      });

      this.logger.log(`Email sent successfully to ${options.to}, messageId: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully',
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`SMTP email error: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async sendTemplateEmail(
    to: string,
    templateAlias: string,
    templateModel: Record<string, any>,
  ): Promise<EmailResponse> {
    // For SMTP, we don't have template support, so just send a basic email
    const subject = templateModel.subject || 'Ghana Lands Notification';
    const body = templateModel.body || JSON.stringify(templateModel);
    
    return this.sendEmail({
      to,
      subject,
      htmlBody: body,
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
