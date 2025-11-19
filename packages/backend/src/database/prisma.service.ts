import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService - Singleton database connection manager
 *
 * Implements NestJS lifecycle hooks for proper connection management:
 * - OnModuleInit: Connects to database when module initializes
 * - OnModuleDestroy: Gracefully disconnects when application shuts down
 *
 * Usage:
 * ```typescript
 * constructor(private prisma: PrismaService) {}
 *
 * async findAll() {
 *   return this.prisma.project.findMany();
 * }
 * ```
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  /**
   * Connect to database when module initializes
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  /**
   * Gracefully disconnect from database on shutdown
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }

  /**
   * Clean database (for testing purposes only)
   * @throws Error if called in production
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in correct order to respect foreign key constraints
    await this.$transaction([
      this.changeRequest.deleteMany(),
      this.networkMember.deleteMany(),
      this.network.deleteMany(),
      this.component.deleteMany(),
      this.feature.deleteMany(),
      this.splice.deleteMany(),
      this.wire.deleteMany(),
      this.pin.deleteMany(),
      this.connector.deleteMany(),
      this.eCU.deleteMany(),
      this.project.deleteMany(),
    ]);
  }
}
