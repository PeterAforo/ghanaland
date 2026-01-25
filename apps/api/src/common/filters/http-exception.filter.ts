import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Log the actual error for debugging
    console.error('Exception caught:', exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse = {
      success: false,
      data: null,
      meta: {
        requestId: request.headers['x-request-id'] || `req_${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
      error: {
        code: this.getErrorCode(status),
        message,
      },
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'AUTH_REQUIRED';
      case 403:
        return 'PERMISSION_DENIED';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
