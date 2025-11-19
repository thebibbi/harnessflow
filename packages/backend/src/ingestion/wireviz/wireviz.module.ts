import { Module } from '@nestjs/common';
import { WireVizImportService } from './wireviz-import.service';
import { DatabaseModule } from '../../database';

/**
 * WireViz Module
 *
 * Provides WireViz YAML import functionality
 *
 * Import this module in your feature modules to use WireViz import:
 * ```typescript
 * @Module({
 *   imports: [WireVizModule],
 * })
 * export class IngestionModule {}
 * ```
 */
@Module({
  imports: [DatabaseModule],
  providers: [WireVizImportService],
  exports: [WireVizImportService],
})
export class WireVizModule {}
