import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

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
  private readonly postmarkUrl = 'https://api.postmarkapp.com/email';

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

  private getApiKey(): string {
    return this.config.get<string>('POSTMARK_API_KEY') || '';
  }

  private getFromEmail(): string {
    return this.config.get<string>('EMAIL_FROM') || 'noreply@ghanalands.com';
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      this.logger.warn('Postmark API key not configured, skipping email');
      return {
        success: false,
        message: 'Email service not configured',
      };
    }

    try {
      const payload = {
        From: options.from || this.getFromEmail(),
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.htmlBody,
        TextBody: options.textBody || this.stripHtml(options.htmlBody),
        ReplyTo: options.replyTo,
        MessageStream: 'outbound',
      };

      this.logger.log(`Sending email to ${options.to}: ${options.subject}`);

      const response = await firstValueFrom(
        this.httpService.post(this.postmarkUrl, payload, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': apiKey,
          },
        }),
      );

      this.logger.log(`Email sent successfully to ${options.to}`);

      return {
        success: true,
        messageId: response.data?.MessageID,
        message: 'Email sent successfully',
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`Postmark email error: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.response?.data?.Message || error.message,
      };
    }
  }

  async sendTemplateEmail(
    to: string,
    templateAlias: string,
    templateModel: Record<string, any>,
  ): Promise<EmailResponse> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      this.logger.warn('Postmark API key not configured, skipping email');
      return {
        success: false,
        message: 'Email service not configured',
      };
    }

    try {
      const payload = {
        From: this.getFromEmail(),
        To: to,
        TemplateAlias: templateAlias,
        TemplateModel: templateModel,
        MessageStream: 'outbound',
      };

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.postmarkapp.com/email/withTemplate',
          payload,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-Postmark-Server-Token': apiKey,
            },
          },
        ),
      );

      return {
        success: true,
        messageId: response.data?.MessageID,
        message: 'Template email sent successfully',
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`Postmark template email error: ${error.message}`);
      return {
        success: false,
        message: error.response?.data?.Message || error.message,
      };
    }
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
