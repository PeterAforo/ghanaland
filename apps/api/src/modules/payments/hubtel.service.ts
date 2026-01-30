import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import * as crypto from 'crypto';

export interface HubtelPaymentRequest {
  totalAmount: number;
  description: string;
  callbackUrl: string;
  returnUrl: string;
  cancellationUrl: string;
  merchantAccountNumber: string;
  clientReference: string;
  customerMsisdn?: string;
  customerName?: string;
  customerEmail?: string;
  primaryCallbackUrl?: string;
}

export interface HubtelMoMoRequest {
  CustomerMsisdn: string;
  CustomerName?: string;
  CustomerEmail?: string;
  Channel: string;
  Amount: number;
  PrimaryCallbackUrl: string;
  SecondaryCallbackUrl?: string;
  ClientReference: string;
  Description: string;
}

export interface HubtelPaymentResponse {
  status: string;
  data?: {
    checkoutUrl?: string;
    checkoutId?: string;
    clientReference?: string;
    message?: string;
  };
  message?: string;
}

@Injectable()
export class HubtelService {
  private readonly logger = new Logger(HubtelService.name);
  private readonly baseUrl = 'https://payproxyapi.hubtel.com/items/initiate';
  private readonly momoReceiveUrl = 'https://rmsc.hubtel.com/v1/merchantaccount/merchants';

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

  private getAuthHeader(): string {
    const clientId = this.config.get<string>('HUBTEL_CLIENT_ID');
    const clientSecret = this.config.get<string>('HUBTEL_CLIENT_SECRET');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private getMerchantAccount(): string {
    return this.config.get<string>('HUBTEL_MERCHANT_ACCOUNT') || '';
  }

  private isConfigured(): boolean {
    const clientId = this.config.get<string>('HUBTEL_CLIENT_ID');
    const clientSecret = this.config.get<string>('HUBTEL_CLIENT_SECRET');
    return !!(clientId && clientSecret && clientId !== 'your_hubtel_client_id');
  }

  async initiateCheckout(request: HubtelPaymentRequest): Promise<HubtelPaymentResponse> {
    // Development mode - return mock response if Hubtel not configured
    if (!this.isConfigured()) {
      this.logger.warn('Hubtel not configured, using development mode');
      return {
        status: 'success',
        data: {
          checkoutUrl: request.returnUrl, // Redirect directly to success page in dev
          checkoutId: `dev_${Date.now()}`,
          clientReference: request.clientReference,
          message: 'Development mode - Hubtel not configured',
        },
      };
    }

    try {
      const payload = {
        totalAmount: request.totalAmount,
        description: request.description,
        callbackUrl: request.callbackUrl,
        returnUrl: request.returnUrl,
        cancellationUrl: request.cancellationUrl,
        merchantAccountNumber: request.merchantAccountNumber || this.getMerchantAccount(),
        clientReference: request.clientReference,
      };

      this.logger.log(`Initiating Hubtel checkout: ${JSON.stringify(payload)}`);

      const response = await firstValueFrom(
        this.httpService.post(this.baseUrl, payload, {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Hubtel checkout response: ${JSON.stringify(response.data)}`);

      return {
        status: 'success',
        data: {
          checkoutUrl: response.data?.data?.checkoutUrl,
          checkoutId: response.data?.data?.checkoutId,
          clientReference: request.clientReference,
        },
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`Hubtel checkout error: ${error.message}`, error.stack);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async receiveMoMoPayment(request: HubtelMoMoRequest): Promise<HubtelPaymentResponse> {
    try {
      const merchantAccount = this.getMerchantAccount();
      const url = `${this.momoReceiveUrl}/${merchantAccount}/receive/mobilemoney`;

      this.logger.log(`Initiating MoMo receive: ${JSON.stringify(request)}`);

      const response = await firstValueFrom(
        this.httpService.post(url, request, {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Hubtel MoMo response: ${JSON.stringify(response.data)}`);

      return {
        status: response.data?.ResponseCode === '0000' ? 'success' : 'pending',
        data: {
          checkoutId: response.data?.Data?.TransactionId,
          clientReference: request.ClientReference,
          message: response.data?.Message,
        },
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`Hubtel MoMo error: ${error.message}`, error.stack);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async checkPaymentStatus(clientReference: string): Promise<any> {
    try {
      const merchantAccount = this.getMerchantAccount();
      const url = `https://rmsc.hubtel.com/v1/merchantaccount/merchants/${merchantAccount}/transactions/status?clientReference=${clientReference}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: this.getAuthHeader(),
          },
        }),
      );

      return response.data;
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`Hubtel status check error: ${error.message}`, error.stack);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const clientSecret = this.config.get<string>('HUBTEL_CLIENT_SECRET') || '';
    const computedSignature = crypto
      .createHmac('sha256', clientSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );
  }

  getChannelFromMethod(method: string): string {
    const channels: Record<string, string> = {
      'momo-mtn': 'mtn-gh',
      'momo-vodafone': 'vodafone-gh',
      'momo-airteltigo': 'tigo-gh',
    };
    return channels[method] || 'mtn-gh';
  }
}
