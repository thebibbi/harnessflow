import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'harnessflow-backend',
      version: '0.1.0',
    };
  }

  getWelcome() {
    return {
      message: 'Welcome to HarnessFlow API',
      version: '0.1.0',
      docs: '/graphql',
      health: '/api/health',
    };
  }
}
