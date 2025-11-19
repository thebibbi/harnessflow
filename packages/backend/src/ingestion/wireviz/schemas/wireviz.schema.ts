/**
 * WireViz Zod Validation Schemas
 *
 * Validates WireViz YAML documents to ensure they conform to the specification
 */

import { z } from 'zod';

/**
 * Image schema
 */
const ImageSchema = z.object({
  src: z.string(),
  scale: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

/**
 * Connector schema
 */
export const ConnectorSchema = z.object({
  type: z.string().optional(),
  subtype: z.string().optional(),
  pincount: z.number().int().positive().optional(),
  pinlabels: z.union([z.array(z.string()), z.record(z.number(), z.string())]).optional(),
  pincolors: z.array(z.string()).optional(),
  notes: z.string().optional(),
  manufacturer: z.string().optional(),
  mpn: z.string().optional(),
  pn: z.string().optional(),
  style: z.enum(['simple', 'full']).optional(),
  color: z.string().optional(),
  bgcolor: z.string().optional(),
  show_name: z.boolean().optional(),
  show_pincount: z.boolean().optional(),
  image: ImageSchema.optional(),
});

/**
 * Cable schema
 */
export const CableSchema = z.object({
  type: z.string().optional(),
  wirecount: z.number().int().positive().optional(),
  colors: z.array(z.string()).optional(),
  color_code: z.enum(['IEC', 'DIN']).optional(),
  gauge: z.union([z.number(), z.string()]).optional(),
  gauge_unit: z.enum(['awg', 'mm2']).optional(),
  length: z.number().positive().optional(),
  shield: z.union([z.boolean(), z.string()]).optional(),
  notes: z.string().optional(),
  manufacturer: z.string().optional(),
  mpn: z.string().optional(),
  pn: z.string().optional(),
  show_name: z.boolean().optional(),
  show_wirecount: z.boolean().optional(),
});

/**
 * Pin specification schema
 * Can be: number, string, or array of numbers/strings
 */
const PinSpecSchema = z.union([z.number(), z.string(), z.array(z.union([z.number(), z.string()]))]);

/**
 * Connection schema
 *
 * Validates connection tuples:
 * - [connector1, pins, cable, wires, pins, connector2] (full)
 * - [connector1, pins, cable, wires, connector2] (simplified - pins2 = wires)
 * - [connector1, pins, connector2] (direct connection)
 */
export const ConnectionSchema = z.union([
  // Full connection with cable (6 elements)
  z.tuple([
    z.string(), // connector1
    PinSpecSchema, // pins on connector1
    z.string(), // cable
    PinSpecSchema, // wires in cable
    PinSpecSchema, // pins on connector2
    z.string(), // connector2
  ]),
  // Simplified connection with cable (5 elements - pins2 = wires)
  z.tuple([
    z.string(), // connector1
    PinSpecSchema, // pins on connector1
    z.string(), // cable
    PinSpecSchema, // wires in cable (also used as pins2)
    z.string(), // connector2
  ]),
  // Direct connection (no cable)
  z.tuple([
    z.string(), // connector1
    PinSpecSchema, // pins
    z.string(), // connector2
  ]),
]);

/**
 * Metadata schema
 */
const MetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  version: z.string().optional(),
});

/**
 * Complete WireViz document schema
 */
export const WireVizDocumentSchema = z.object({
  connectors: z.record(z.string(), ConnectorSchema),
  cables: z.record(z.string(), CableSchema).optional().default({}),
  connections: z.array(ConnectionSchema),
  metadata: MetadataSchema.optional(),
});

/**
 * Validation result type
 */
export interface ValidationResult {
  success: boolean;
  data?: z.infer<typeof WireVizDocumentSchema>;
  errors?: z.ZodError;
}

/**
 * Validate WireViz document
 *
 * @param data - Parsed YAML data
 * @returns Validation result with typed data or errors
 */
export function validateWireVizDocument(data: unknown): ValidationResult {
  const result = WireVizDocumentSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error,
  };
}

/**
 * Format validation errors for user-friendly display
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}
