import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AppService {
  private prisma = new PrismaClient();

  async getHealth() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'harnessflow-backend',
      version: '0.1.0',
      database: dbStatus,
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
