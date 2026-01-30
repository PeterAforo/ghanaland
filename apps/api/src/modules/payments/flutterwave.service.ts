import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface FlutterwavePaymentRequest {
  amount: number;
  currency?: string;
  redirectUrl: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  txRef: string;
  title?: string;
  description?: string;
  meta?: Record<string, any>;
}

export interface FlutterwavePaymentResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    link?: string;
    id?: number;
    txRef?: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type: string;
    created_at: string;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
    };
  };
}

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

  private getSecretKey(): string {
    return this.config.get<string>('FLUTTERWAVE_SECRET_KEY') || '';
  }

  private getPublicKey(): string {
    return this.config.get<string>('FLUTTERWAVE_PUBLIC_KEY') || '';
  }

  private isConfigured(): boolean {
    const secretKey = this.getSecretKey();
    // Flutterwave secret keys start with FLWSECK-
    return !!(secretKey && secretKey.startsWith('FLWSECK-'));
  }

  async initiatePayment(request: FlutterwavePaymentRequest): Promise<FlutterwavePaymentResponse> {
    // Development mode - return mock response if Flutterwave not configured
    if (!this.isConfigured()) {
      this.logger.warn('Flutterwave not configured, using development mode');
      return {
        status: 'success',
        data: {
          link: request.redirectUrl, // Redirect directly to success page in dev
          id: Date.now(),
          txRef: request.txRef,
        },
        message: 'Development mode - Flutterwave not configured',
      };
    }

    try {
      const payload = {
        tx_ref: request.txRef,
        amount: request.amount,
        currency: request.currency || 'GHS',
        redirect_url: request.redirectUrl,
        payment_options: 'card,mobilemoneyghana,ussd',
        customer: {
          email: request.customerEmail,
          name: request.customerName || 'Customer',
          phonenumber: request.customerPhone,
        },
        customizations: {
          title: request.title || 'Ghana Lands Payment',
          description: request.description || 'Land purchase payment',
          logo: 'https://ghanalands.com/logo.png',
        },
        meta: request.meta,
      };

      this.logger.log(`Initiating Flutterwave payment: ${JSON.stringify(payload)}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/payments`, payload, {
          headers: {
            Authorization: `Bearer ${this.getSecretKey()}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Flutterwave response: ${JSON.stringify(response.data)}`);

      if (response.data?.status === 'success') {
        return {
          status: 'success',
          data: {
            link: response.data.data?.link,
            id: response.data.data?.id,
            txRef: request.txRef,
          },
        };
      }

      return {
        status: 'error',
        message: response.data?.message || 'Payment initiation failed',
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`Flutterwave error: ${error.message}`, error.stack);
      this.logger.error(`Response data: ${JSON.stringify(error.response?.data)}`);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<FlutterwaveVerifyResponse> {
    if (!this.isConfigured()) {
      this.logger.warn('Flutterwave not configured, returning mock verification');
      return {
        status: 'success',
        data: {
          id: parseInt(transactionId) || Date.now(),
          tx_ref: transactionId,
          flw_ref: `FLW-MOCK-${transactionId}`,
          amount: 0,
          currency: 'GHS',
          charged_amount: 0,
          status: 'successful',
          payment_type: 'card',
          created_at: new Date().toISOString(),
          customer: {
            id: 0,
            name: 'Test Customer',
            phone_number: '',
            email: 'test@example.com',
          },
        },
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/transactions/${transactionId}/verify`, {
          headers: {
            Authorization: `Bearer ${this.getSecretKey()}`,
          },
        }),
      );

      this.logger.log(`Flutterwave verify response: ${JSON.stringify(response.data)}`);

      return {
        status: response.data?.status === 'success' ? 'success' : 'error',
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`Flutterwave verify error: ${error.message}`, error.stack);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async verifyByTxRef(txRef: string): Promise<FlutterwaveVerifyResponse> {
    if (!this.isConfigured()) {
      return this.verifyPayment(txRef);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/transactions/verify_by_reference?tx_ref=${txRef}`, {
          headers: {
            Authorization: `Bearer ${this.getSecretKey()}`,
          },
        }),
      );

      return {
        status: response.data?.status === 'success' ? 'success' : 'error',
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (err) {
      const error = err as AxiosError<any>;
      this.logger.error(`Flutterwave verify by ref error: ${error.message}`);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    const secretHash = this.config.get<string>('FLUTTERWAVE_WEBHOOK_SECRET');
    if (!secretHash) {
      this.logger.warn('Webhook secret not configured');
      return true; // Allow in development
    }
    return signature === secretHash;
  }
}
