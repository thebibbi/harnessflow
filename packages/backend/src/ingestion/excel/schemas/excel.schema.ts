/**
 * Excel Data Validation Schemas
 *
 * Zod schemas for validating Excel harness data
 */

import { z } from 'zod';

/**
 * Column mapping schema
 */
export const ColumnMappingSchema = z.object({
  // Wire fields
  wireId: z.string().optional(),
  wireName: z.string().optional(),
  wireGauge: z.string().optional(),
  wireColor: z.string().optional(),
  wireLength: z.string().optional(),

  // From connector/pin
  fromConnector: z.string().optional(),
  fromPin: z.string().optional(),
  fromPinLabel: z.string().optional(),
  fromECU: z.string().optional(),

  // To connector/pin
  toConnector: z.string().optional(),
  toPin: z.string().optional(),
  toPinLabel: z.string().optional(),
  toECU: z.string().optional(),

  // Signal/function
  signal: z.string().optional(),
  signalType: z.string().optional(),

  // Metadata
  notes: z.string().optional(),
  partNumber: z.string().optional(),
  manufacturer: z.string().optional(),
});

/**
 * Wire row schema
 */
export const ExcelWireRowSchema = z.object({
  wireId: z.string().optional(),
  wireName: z.string().optional(),

  // Physical properties
  gauge: z.union([z.string(), z.number()]).optional(),
  gaugeUnit: z.enum(['awg', 'mm2']).optional(),
  color: z.string().optional(),
  length: z.number().positive().optional(),
  lengthUnit: z.enum(['mm', 'cm', 'm']).optional(),

  // From endpoint
  fromConnector: z.string().optional(),
  fromPin: z.union([z.string(), z.number()]).optional(),
  fromPinLabel: z.string().optional(),
  fromECU: z.string().optional(),

  // To endpoint
  toConnector: z.string().optional(),
  toPin: z.union([z.string(), z.number()]).optional(),
  toPinLabel: z.string().optional(),
  toECU: z.string().optional(),

  // Signal information
  signal: z.string().optional(),
  signalType: z.string().optional(),

  // Metadata
  notes: z.string().optional(),
  partNumber: z.string().optional(),
  manufacturer: z.string().optional(),

  // Raw data
  _rawRow: z.record(z.any()).optional(),
  _rowNumber: z.number().optional(),
});

/**
 * Connector row schema
 */
export const ExcelConnectorRowSchema = z.object({
  connectorId: z.string().optional(),
  connectorName: z.string().optional(),

  type: z.string().optional(),
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  pinCount: z.number().int().positive().optional(),
  gender: z.enum(['male', 'female']).optional(),

  ecu: z.string().optional(),
  location: z.string().optional(),

  notes: z.string().optional(),

  _rawRow: z.record(z.any()).optional(),
  _rowNumber: z.number().optional(),
});

/**
 * Pin row schema
 */
export const ExcelPinRowSchema = z.object({
  connectorId: z.string().optional(),
  pinNumber: z.union([z.string(), z.number()]).optional(),
  pinLabel: z.string().optional(),

  signalType: z.string().optional(),
  color: z.string().optional(),

  notes: z.string().optional(),

  _rawRow: z.record(z.any()).optional(),
  _rowNumber: z.number().optional(),
});

/**
 * Excel document schema
 */
export const ExcelDocumentSchema = z.object({
  wires: z.array(ExcelWireRowSchema),
  connectors: z.array(ExcelConnectorRowSchema).optional(),
  pins: z.array(ExcelPinRowSchema).optional(),
  metadata: z
    .object({
      fileName: z.string().optional(),
      sheetNames: z.array(z.string()).optional(),
      totalRows: z.number().optional(),
      parsedAt: z.date().optional(),
    })
    .optional(),
});

/**
 * Auto-detection config schema
 */
export const AutoDetectionConfigSchema = z.object({
  wireSheetKeywords: z.array(z.string()).optional(),
  connectorSheetKeywords: z.array(z.string()).optional(),
  pinSheetKeywords: z.array(z.string()).optional(),
  headerRowMax: z.number().int().positive().optional(),
  minRequiredColumns: z.number().int().positive().optional(),
  useLLM: z.boolean().optional(),
  llmEndpoint: z.string().url().optional(),
});

/**
 * Import options schema
 */
export const ExcelImportOptionsSchema = z.object({
  projectName: z.string().min(1),
  projectDescription: z.string().optional(),
  vehicle: z.string().optional(),

  columnMapping: ColumnMappingSchema.optional(),
  autoDetect: z.boolean().optional(),
  autoDetectionConfig: AutoDetectionConfigSchema.optional(),

  skipInvalidRows: z.boolean().optional(),
  createMissingConnectors: z.boolean().optional(),
  createMissingECUs: z.boolean().optional(),

  metadata: z.record(z.any()).optional(),
});

/**
 * Validation utilities
 */

/**
 * Validate wire row
 */
export function validateWireRow(data: unknown): z.SafeParseReturnType<any, any> {
  return ExcelWireRowSchema.safeParse(data);
}

/**
 * Validate connector row
 */
export function validateConnectorRow(data: unknown): z.SafeParseReturnType<any, any> {
  return ExcelConnectorRowSchema.safeParse(data);
}

/**
 * Validate Excel document
 */
export function validateExcelDocument(data: unknown): z.SafeParseReturnType<any, any> {
  return ExcelDocumentSchema.safeParse(data);
}

/**
 * Validate import options
 */
export function validateImportOptions(data: unknown): z.SafeParseReturnType<any, any> {
  return ExcelImportOptionsSchema.safeParse(data);
}

/**
 * Format validation errors
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}
