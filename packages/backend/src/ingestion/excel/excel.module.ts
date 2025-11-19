/**
 * Excel Import Module
 *
 * NestJS module for Excel harness import functionality
 */

import { Module } from '@nestjs/common';
import { ExcelImportService } from './excel-import.service';
import { DatabaseModule } from '../../database';

@Module({
  imports: [DatabaseModule],
  providers: [ExcelImportService],
  exports: [ExcelImportService],
})
export class ExcelModule {}
