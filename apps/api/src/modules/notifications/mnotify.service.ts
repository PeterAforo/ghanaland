import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  message?: string;
}

@Injectable()
export class MnotifyService {
  private readonly logger = new Logger(MnotifyService.name);
  private readonly baseUrl = 'https://apps.mnotify.net/smsapi';

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

  private getApiKey(): string {
    return this.config.get<string>('MNOTIFY_API_KEY') || '';
  }

  private getSenderId(): string {
    return this.config.get<string>('MNOTIFY_SENDER_ID') || 'GhanaLands';
  }

  async sendSms(phone: string, message: string): Promise<SmsResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const params = new URLSearchParams({
        key: this.getApiKey(),
        to: formattedPhone,
        msg: message,
        sender_id: this.getSenderId(),
      });

      const url = `${this.baseUrl}?${params.toString()}`;
      
      this.logger.log(`Sending SMS to ${formattedPhone}`);

      const response = await firstValueFrom(
        this.httpService.get(url),
      );

      const responseCode = response.data?.code || response.data;
      const isSuccess = responseCode === '1000' || responseCode === 1000;

      if (isSuccess) {
        this.logger.log(`SMS sent successfully to ${formattedPhone}`);
        return {
          success: true,
          messageId: response.data?.message_id,
          message: 'SMS sent successfully',
        };
      }

      this.logger.warn(`SMS failed: ${JSON.stringify(response.data)}`);
      return {
        success: false,
        message: this.getErrorMessage(responseCode),
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`mNotify SMS error: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async sendBulkSms(phones: string[], message: string): Promise<SmsResponse> {
    try {
      const formattedPhones = phones.map((p) => this.formatPhoneNumber(p)).join(',');

      const params = new URLSearchParams({
        key: this.getApiKey(),
        to: formattedPhones,
        msg: message,
        sender_id: this.getSenderId(),
      });

      const url = `${this.baseUrl}?${params.toString()}`;

      this.logger.log(`Sending bulk SMS to ${phones.length} recipients`);

      const response = await firstValueFrom(
        this.httpService.get(url),
      );

      const responseCode = response.data?.code || response.data;
      const isSuccess = responseCode === '1000' || responseCode === 1000;

      return {
        success: isSuccess,
        message: isSuccess ? 'Bulk SMS sent successfully' : this.getErrorMessage(responseCode),
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`mNotify bulk SMS error: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async checkBalance(): Promise<{ balance: number; success: boolean }> {
    try {
      const url = `https://apps.mnotify.net/smsapi/balance?key=${this.getApiKey()}`;

      const response = await firstValueFrom(
        this.httpService.get(url),
      );

      return {
        success: true,
        balance: parseFloat(response.data) || 0,
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`mNotify balance check error: ${error.message}`);
      return {
        success: false,
        balance: 0,
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('233')) {
      cleaned = '233' + cleaned;
    }

    return cleaned;
  }

  private getErrorMessage(code: string | number): string {
    const errorMessages: Record<string, string> = {
      '1000': 'Message sent successfully',
      '1002': 'SMS sending failed',
      '1003': 'Insufficient SMS balance',
      '1004': 'Invalid API key',
      '1005': 'Invalid phone number',
      '1006': 'Invalid sender ID',
      '1007': 'Message too long',
      '1008': 'Empty message',
    };

    return errorMessages[String(code)] || `Unknown error: ${code}`;
  }
}
