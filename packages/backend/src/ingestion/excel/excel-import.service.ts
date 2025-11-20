/**
 * Excel Import Service
 *
 * Imports harness data from Excel files into the database
 */

import { Injectable } from '@nestjs/common';
import { ProjectRepository } from '../../database/repositories/project.repository';
import { ECURepository } from '../../database/repositories/ecu.repository';
import { WireRepository } from '../../database/repositories/wire.repository';
import { parseExcelFile } from './parsers/excel.parser';
import { convertExcelDocument, updateConnectorPinCounts } from './converters/excel.converter';
import { ExcelImportOptions, ExcelImportResult } from './types/excel.types';

@Injectable()
export class ExcelImportService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly ecuRepo: ECURepository,
    private readonly wireRepo: WireRepository
  ) {}

  /**
   * Import harness data from Excel buffer
   */
  async importFromExcel(buffer: Buffer, options: ExcelImportOptions): Promise<ExcelImportResult> {
    try {
      // Step 1: Parse Excel file
      const parseResult = parseExcelFile(buffer, {
        columnMapping: options.columnMapping,
        autoDetect: options.autoDetect !== false, // Default to true
        autoDetectionConfig: options.autoDetectionConfig,
      });

      if (!parseResult.success || !parseResult.document) {
        return {
          success: false,
          errors: parseResult.errors || ['Failed to parse Excel file'],
          warnings: parseResult.warnings,
        };
      }

      // Step 2: Convert to HarnessFlow format
      const { wires, connectors, ecus } = convertExcelDocument(parseResult.document);

      // Update connector pin counts based on wires
      updateConnectorPinCounts(wires, connectors);

      // Step 3: Save to database
      const projectId = await this.saveToDatabase(
        parseResult.document,
        wires,
        connectors,
        ecus,
        options
      );

      // Step 4: Return result
      return {
        success: true,
        projectId,
        stats: {
          wiresCreated: wires.length,
          connectorsCreated: connectors.size,
          ecusCreated: ecus.size,
          pinsCreated: Array.from(connectors.values()).reduce((sum, c) => sum + c.pinCount, 0),
          rowsSkipped: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Import failed: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * Save converted data to database
   */
  private async saveToDatabase(
    document: any,
    wires: any[],
    connectors: Map<string, any>,
    ecus: Map<string, any>,
    options: ExcelImportOptions
  ): Promise<string> {
    // Parse vehicle info from options
    const vehicleParts = (options.vehicle || 'Unknown Manufacturer Unknown Model 2024').split(' ');
    const vehicleManufacturer = vehicleParts[0] || 'Unknown';
    const vehicleModel = vehicleParts[1] || 'Unknown';
    const vehicleYear = parseInt(vehicleParts[2]) || new Date().getFullYear();

    // Create project
    const project = await this.projectRepo.create({
      name: options.projectName,
      description: options.projectDescription || 'Imported from Excel',
      vehicleManufacturer,
      vehicleModel,
      vehicleYear,
      vehicleRegion: ['Global'],
      createdBy: 'system',
      modifiedBy: 'system',
      metadata: {
        ...options.metadata,
        importedFrom: 'excel',
        importedAt: new Date().toISOString(),
        sheetNames: document.metadata?.sheetNames,
      },
    });

    // Build connector-pin map for wire endpoint resolution
    const connectorPinMap = new Map<string, string>();

    // Create ECUs with connectors and pins
    for (const [ecuName, ecuData] of ecus.entries()) {
      const ecu = await this.ecuRepo.createWithConnectors(
        {
          project: { connect: { id: project.id } },
          name: ecuName,
          partNumber: `${ecuName}-PN`,
          manufacturer: 'Unknown',
          createdBy: 'system',
          modifiedBy: 'system',
          metadata: {
            ...ecuData.metadata,
            type: 'generic',
          },
        },
        ecuData.connectors.map((conn: any) => ({
          name: conn.name,
          type: conn.type,
          manufacturer: conn.manufacturer || 'Unknown',
          partNumber: conn.partNumber || `${conn.name}-PN`,
          gender: conn.gender,
          pinCount: conn.pinCount,
          pins: conn.pins.map((pin: any) => ({
            pinNumber: String(pin.number),
            label: pin.label || `Pin ${pin.number}`,
            capabilities: pin.signalType ? { types: [pin.signalType] } : {},
          })),
        }))
      );

      // Map connector:pin to pin ID (ecu includes connectors and pins)
      const ecuWithRelations = ecu as any;
      if (ecuWithRelations.connectors) {
        for (const connector of ecuWithRelations.connectors) {
          if (connector.pins) {
            for (const pin of connector.pins) {
              const key = `${connector.name}:${pin.pinNumber}`;
              connectorPinMap.set(key, pin.id);
            }
          }
        }
      }
    }

    // Create standalone connectors (not associated with ECUs)
    for (const [connectorName, connectorData] of connectors.entries()) {
      // Skip if already created as part of ECU
      if (
        Array.from(ecus.values()).some((ecu) =>
          ecu.connectors.find((c: any) => c.name === connectorName)
        )
      ) {
        continue;
      }

      // Create as standalone ECU with one connector
      const ecu = await this.ecuRepo.createWithConnectors(
        {
          project: { connect: { id: project.id } },
          name: `${connectorName}_ECU`,
          partNumber: `${connectorName}-ECU-PN`,
          manufacturer: 'Unknown',
          createdBy: 'system',
          modifiedBy: 'system',
          metadata: {
            standalone: true,
            type: 'connector',
          },
        },
        [
          {
            name: connectorName,
            type: connectorData.type,
            manufacturer: connectorData.manufacturer || 'Unknown',
            partNumber: connectorData.partNumber || `${connectorName}-PN`,
            gender: connectorData.gender,
            pinCount: connectorData.pinCount,
            pins: connectorData.pins.map((pin: any) => ({
              pinNumber: String(pin.number),
              label: pin.label || `Pin ${pin.number}`,
              capabilities: pin.signalType ? { types: [pin.signalType] } : {},
            })),
          },
        ]
      );

      // Map connector:pin to pin ID (ecu includes connectors and pins)
      const ecuWithRelations = ecu as any;
      if (ecuWithRelations.connectors) {
        for (const connector of ecuWithRelations.connectors) {
          if (connector.pins) {
            for (const pin of connector.pins) {
              const key = `${connector.name}:${pin.pinNumber}`;
              connectorPinMap.set(key, pin.id);
            }
          }
        }
      }
    }

    // Create wires
    for (const wire of wires) {
      const fromKey = `${wire.fromConnector}:${wire.fromPinNumber}`;
      const toKey = `${wire.toConnector}:${wire.toPinNumber}`;

      const fromPinId = connectorPinMap.get(fromKey);
      const toPinId = connectorPinMap.get(toKey);

      if (!fromPinId || !toPinId) {
        console.warn(`Skipping wire ${wire.name}: Missing pin mapping (${fromKey} -> ${toKey})`);
        continue;
      }

      await this.wireRepo.create({
        project: { connect: { id: project.id } },
        fromPin: { connect: { id: fromPinId } },
        toPin: { connect: { id: toPinId } },
        name: wire.name,
        createdBy: 'system',
        modifiedBy: 'system',
        physical: wire.physical,
        electrical: wire.electrical,
        metadata: {
          ...wire.metadata,
          signal: wire.signal,
          partNumber: wire.metadata?.partNumber || `${wire.name}-PN`,
          manufacturer: wire.metadata?.manufacturer || 'Unknown',
        },
      });
    }

    return project.id;
  }
}
