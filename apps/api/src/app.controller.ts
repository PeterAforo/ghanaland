import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return {
      success: true,
      data: {
        name: 'Ghana Lands API',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      meta: {
        docs: '/api/docs',
        apiPrefix: '/api/v1',
      },
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
