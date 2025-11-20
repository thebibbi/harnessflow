/**
 * Validation Module
 *
 * Provides validation services to the application
 */

import { Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
