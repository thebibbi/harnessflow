/**
 * Import GraphQL Resolver
 *
 * Handles WireViz and Excel imports
 */

import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { WireVizImportService } from '../../ingestion/wireviz';
import { ExcelImportService } from '../../ingestion/excel';
import { ImportResult } from '../types';
import { WireVizImportInput, ExcelImportInput } from '../types/inputs';

@Resolver()
export class ImportResolver {
  constructor(
    private readonly wirevizService: WireVizImportService,
    private readonly excelService: ExcelImportService
  ) {}

  /**
   * Import harness from WireViz YAML
   */
  @Mutation(() => ImportResult)
  async importWireViz(@Args('input') input: WireVizImportInput): Promise<ImportResult> {
    try {
      // Parse vehicle string into components
      const vehicleParts = (input.vehicle || 'Unknown Manufacturer Unknown Model 2024').split(' ');

      const result = await this.wirevizService.importFromYAML(input.yamlContent, {
        projectName: input.projectName,
        vehicleManufacturer: vehicleParts[0] || 'Unknown',
        vehicleModel: vehicleParts[1] || 'Unknown',
        vehicleYear: parseInt(vehicleParts[2]) || new Date().getFullYear(),
        createdBy: 'user',
        description: input.projectDescription,
      });

      return {
        success: result.success,
        projectId: result.projectId,
        errors: result.errors,
        stats: result.stats,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Import harness from Excel file
   */
  @Mutation(() => ImportResult)
  async importExcel(@Args('input') input: ExcelImportInput): Promise<ImportResult> {
    try {
      // Read file upload
      const { createReadStream } = await input.file;
      const stream = createReadStream();

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Import Excel
      const result = await this.excelService.importFromExcel(buffer, {
        projectName: input.projectName,
        projectDescription: input.projectDescription,
        vehicle: input.vehicle,
        autoDetect: input.autoDetect !== false,
        columnMapping: input.columnMapping,
        metadata: input.metadata,
      });

      return {
        success: result.success,
        projectId: result.projectId,
        errors: result.errors,
        warnings: result.warnings,
        stats: result.stats,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}
