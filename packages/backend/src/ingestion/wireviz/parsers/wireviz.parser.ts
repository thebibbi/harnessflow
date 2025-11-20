/**
 * WireViz YAML Parser
 *
 * Loads and parses WireViz YAML files into validated TypeScript objects
 */

import * as yaml from 'js-yaml';
import { validateWireVizDocument, formatValidationErrors } from '../schemas/wireviz.schema';
import type { WireVizDocument } from '../types/wireviz.types';

/**
 * Parse result
 */
export interface ParseResult {
  success: boolean;
  document?: WireVizDocument;
  errors?: string[];
}

/**
 * Parse error with context
 */
export class WireVizParseError extends Error {
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(message);
    this.name = 'WireVizParseError';
  }
}

/**
 * Parse WireViz YAML string
 *
 * @param yamlContent - YAML string content
 * @returns Parse result with document or errors
 *
 * @example
 * ```typescript
 * const result = parseWireVizYAML(yamlString);
 * if (result.success) {
 *   console.log('Parsed:', result.document);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export function parseWireVizYAML(yamlContent: string): ParseResult {
  try {
    // Step 1: Parse YAML
    const rawData = yaml.load(yamlContent);

    if (!rawData || typeof rawData !== 'object') {
      return {
        success: false,
        errors: ['Invalid YAML: Document must be an object'],
      };
    }

    // Step 2: Validate against schema
    const validation = validateWireVizDocument(rawData);

    if (!validation.success) {
      return {
        success: false,
        errors: formatValidationErrors(validation.errors!),
      };
    }

    // Step 3: Return validated document
    return {
      success: true,
      document: validation.data as WireVizDocument,
    };
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      return {
        success: false,
        errors: [`YAML syntax error: ${error.message}`],
      };
    }

    return {
      success: false,
      errors: [`Unexpected error: ${error instanceof Error ? error.message : String(error)}`],
    };
  }
}

/**
 * Parse WireViz YAML string (throws on error)
 *
 * @param yamlContent - YAML string content
 * @returns Validated WireViz document
 * @throws {WireVizParseError} If parsing or validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const document = parseWireVizYAMLStrict(yamlString);
 *   console.log('Parsed:', document);
 * } catch (error) {
 *   if (error instanceof WireVizParseError) {
 *     console.error('Parse errors:', error.errors);
 *   }
 * }
 * ```
 */
export function parseWireVizYAMLStrict(yamlContent: string): WireVizDocument {
  const result = parseWireVizYAML(yamlContent);

  if (!result.success) {
    throw new WireVizParseError('Failed to parse WireViz YAML', result.errors || []);
  }

  return result.document!;
}

/**
 * Validate WireViz YAML without parsing
 *
 * Useful for quick validation checks
 *
 * @param yamlContent - YAML string content
 * @returns True if valid, false otherwise
 */
export function isValidWireVizYAML(yamlContent: string): boolean {
  return parseWireVizYAML(yamlContent).success;
}

/**
 * Get parse errors from WireViz YAML
 *
 * @param yamlContent - YAML string content
 * @returns Array of error messages, or empty array if valid
 */
export function getWireVizErrors(yamlContent: string): string[] {
  const result = parseWireVizYAML(yamlContent);
  return result.errors || [];
}
