/**
 * WireViz Import Service
 *
 * Main service for importing WireViz YAML files into HarnessFlow
 */

import { Injectable } from '@nestjs/common';
import { parseWireVizYAML, WireVizParseError } from './parsers/wireviz.parser';
import { convertConnectors } from './converters/connector.converter';
import { convertWires } from './converters/wire.converter';
import { ProjectRepository, ECURepository } from '../../database';
import type { WireVizDocument } from './types/wireviz.types';

/**
 * Import options
 */
export interface WireVizImportOptions {
  projectName?: string;
  vehicleManufacturer?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  createdBy: string;
  description?: string;
}

/**
 * Import result
 */
export interface WireVizImportResult {
  success: boolean;
  projectId?: string;
  errors?: string[];
  stats?: {
    connectorsImported: number;
    pinsImported: number;
    wiresImported: number;
  };
}

/**
 * WireViz Import Service
 *
 * Handles the complete import pipeline:
 * 1. Parse YAML
 * 2. Validate document
 * 3. Convert to HarnessFlow format
 * 4. Save to database
 *
 * @example
 * ```typescript
 * const result = await wirevizImportService.importFromYAML(yamlContent, {
 *   projectName: 'My Harness',
 *   vehicleManufacturer: 'Tesla',
 *   createdBy: 'user123',
 * });
 * ```
 */
@Injectable()
export class WireVizImportService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly ecuRepo: ECURepository
  ) {}

  /**
   * Import WireViz YAML string into database
   *
   * @param yamlContent - WireViz YAML content
   * @param options - Import options
   * @returns Import result with project ID or errors
   */
  async importFromYAML(
    yamlContent: string,
    options: WireVizImportOptions
  ): Promise<WireVizImportResult> {
    try {
      // Step 1: Parse and validate YAML
      const parseResult = parseWireVizYAML(yamlContent);
      if (!parseResult.success || !parseResult.document) {
        return {
          success: false,
          errors: parseResult.errors || ['Failed to parse YAML'],
        };
      }

      const document = parseResult.document;

      // Step 2: Convert to HarnessFlow format
      const connectors = convertConnectors(document.connectors);
      const wires = convertWires(document.cables, document.connections, connectors);

      // Step 3: Save to database
      const projectId = await this.saveToDatabase(document, connectors, wires, options);

      // Step 4: Calculate stats
      const pinsImported = Array.from(connectors.values()).reduce(
        (sum, conn) => sum + conn.pins.length,
        0
      );

      return {
        success: true,
        projectId,
        stats: {
          connectorsImported: connectors.size,
          pinsImported,
          wiresImported: wires.length,
        },
      };
    } catch (error) {
      if (error instanceof WireVizParseError) {
        return {
          success: false,
          errors: error.errors,
        };
      }

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Save converted data to database
   */
  private async saveToDatabase(
    document: WireVizDocument,
    connectors: Map<string, any>,
    wires: any[],
    options: WireVizImportOptions
  ): Promise<string> {
    // Create project
    const project = await this.projectRepo.create({
      name: options.projectName || document.metadata?.title || 'WireViz Import',
      description: options.description || document.metadata?.description || 'Imported from WireViz',
      vehicleManufacturer: options.vehicleManufacturer || 'Unknown',
      vehicleModel: options.vehicleModel || 'Unknown',
      vehicleYear: options.vehicleYear || new Date().getFullYear(),
      vehicleRegion: [],
      status: 'draft',
      createdBy: options.createdBy,
      modifiedBy: options.createdBy,
      metadata: {
        source: 'wireviz',
        version: document.metadata?.version,
        notes: document.metadata?.notes,
      },
    });

    // Create a single ECU to hold all connectors
    // (WireViz doesn't have ECU concept, so we create a virtual one)
    const ecu = await this.ecuRepo.createWithConnectors(
      {
        project: { connect: { id: project.id } },
        name: 'Main Harness',
        partNumber: 'HARNESS-001',
        manufacturer: 'WireViz Import',
        supplierCode: 'WV-IMPORT',
        createdBy: options.createdBy,
        modifiedBy: options.createdBy,
        metadata: {
          source: 'wireviz',
        },
      },
      Array.from(connectors.values()).map((conn) => ({
        name: conn.name,
        manufacturer: conn.manufacturer,
        partNumber: conn.partNumber,
        type: conn.type,
        gender: conn.gender,
        pinCount: conn.pinCount,
        pins: conn.pins.map((pin: any) => ({
          pinNumber: pin.pinNumber,
          label: pin.label,
          capabilities: pin.capabilities,
        })),
      }))
    );

    // Create wires
    // Note: We'll need to map connector names to actual pin IDs
    const connectorPinMap = this.buildConnectorPinMap(ecu);

    for (const wire of wires) {
      const fromPinId = connectorPinMap.get(`${wire.fromConnector}:${wire.fromPinNumber}`);
      const toPinId = connectorPinMap.get(`${wire.toConnector}:${wire.toPinNumber}`);

      if (!fromPinId || !toPinId) {
        console.warn(
          `Could not find pins for wire ${wire.name}: ${wire.fromConnector}:${wire.fromPinNumber} -> ${wire.toConnector}:${wire.toPinNumber}`
        );
        continue;
      }

      await this.projectRepo.create({
        project: { connect: { id: project.id } },
        name: wire.name,
        fromPin: { connect: { id: fromPinId } },
        toPin: { connect: { id: toPinId } },
        physical: wire.physical,
        electrical: wire.electrical,
        metadata: wire.metadata,
        createdBy: options.createdBy,
        modifiedBy: options.createdBy,
      } as any);
    }

    return project.id;
  }

  /**
   * Build a map of connector:pin -> pin ID
   */
  private buildConnectorPinMap(ecu: any): Map<string, string> {
    const map = new Map<string, string>();

    if (!ecu.connectors) return map;

    for (const connector of ecu.connectors) {
      if (!connector.pins) continue;

      for (const pin of connector.pins) {
        const key = `${connector.name}:${pin.pinNumber}`;
        map.set(key, pin.id);
      }
    }

    return map;
  }

  /**
   * Validate WireViz YAML without importing
   *
   * @param yamlContent - YAML content to validate
   * @returns Validation result
   */
  async validateYAML(yamlContent: string): Promise<{ valid: boolean; errors?: string[] }> {
    const result = parseWireVizYAML(yamlContent);
    return {
      valid: result.success,
      errors: result.errors,
    };
  }
}
