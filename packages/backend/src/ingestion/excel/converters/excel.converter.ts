/**
 * Excel to HarnessFlow Converter
 *
 * Converts Excel harness data to HarnessFlow internal format
 */

import { ExcelWireRow, ExcelConnectorRow, ExcelDocument } from '../types/excel.types';
import { parseColorCode } from '../../wireviz/converters/color.converter';
import { awgToMm2 } from '../../wireviz/types/wireviz.types';

/**
 * Converted wire data
 */
export interface ConvertedWire {
  name: string;
  fromConnector: string;
  fromPinNumber: number;
  toConnector: string;
  toPinNumber: number;
  signal?: string;
  physical: {
    gauge: number;
    gauge_unit: 'awg' | 'mm2';
    color?: {
      primary: string;
      primaryHex?: string;
      secondary?: string;
      secondaryHex?: string;
      isStriped: boolean;
      displayName?: string;
    };
    length?: number;
    length_unit?: 'mm' | 'cm' | 'm';
  };
  electrical?: {
    resistance?: number;
    voltage_rating?: number;
    current_rating?: number;
  };
  metadata?: {
    notes?: string;
    partNumber?: string;
    manufacturer?: string;
    signalType?: string;
  };
}

/**
 * Converted connector data
 */
export interface ConvertedConnector {
  name: string;
  type: string;
  manufacturer?: string;
  partNumber?: string;
  pinCount: number;
  gender: 'male' | 'female';
  pins: Array<{
    number: number;
    label?: string;
    signalType?: string;
  }>;
  metadata?: {
    notes?: string;
    location?: string;
  };
}

/**
 * Converted ECU data
 */
export interface ConvertedECU {
  name: string;
  connectors: ConvertedConnector[];
  metadata?: {
    location?: string;
    notes?: string;
  };
}

/**
 * Convert Excel document to HarnessFlow format
 */
export function convertExcelDocument(document: ExcelDocument): {
  wires: ConvertedWire[];
  connectors: Map<string, ConvertedConnector>;
  ecus: Map<string, ConvertedECU>;
} {
  const wires: ConvertedWire[] = [];
  const connectors = new Map<string, ConvertedConnector>();
  const ecus = new Map<string, ConvertedECU>();

  // Convert wires
  for (const wireRow of document.wires) {
    try {
      const wire = convertWire(wireRow);
      wires.push(wire);

      // Extract connector and ECU information
      extractConnectorInfo(wireRow, connectors, ecus);
    } catch (error) {
      console.warn(
        `Skipping wire row ${wireRow._rowNumber}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Convert explicit connectors if provided
  if (document.connectors) {
    for (const connectorRow of document.connectors) {
      const connector = convertConnector(connectorRow);
      if (connector) {
        connectors.set(connector.name, connector);
      }
    }
  }

  return { wires, connectors, ecus };
}

/**
 * Convert wire row to HarnessFlow format
 */
function convertWire(wireRow: ExcelWireRow): ConvertedWire {
  // Validate required fields
  if (!wireRow.fromConnector || !wireRow.toConnector) {
    throw new Error('Missing required connector information');
  }

  // Parse pin numbers
  const fromPin = parsePinNumber(wireRow.fromPin);
  const toPin = parsePinNumber(wireRow.toPin);

  // Generate wire name
  const wireName =
    wireRow.wireName ||
    wireRow.wireId ||
    `${wireRow.fromConnector}_${fromPin}_${wireRow.toConnector}_${toPin}`;

  // Parse gauge
  const gauge = wireRow.gauge !== undefined ? Number(wireRow.gauge) : 22;
  const gaugeUnit = wireRow.gaugeUnit || 'awg';

  // Parse color
  let color: ConvertedWire['physical']['color'];
  if (wireRow.color) {
    const parsed = parseColorCode(wireRow.color, 'IEC');
    if (parsed) {
      color = parsed;
    }
  }

  // Calculate resistance if we have length
  let resistance: number | undefined;
  if (wireRow.length) {
    const lengthInMeters = convertLengthToMeters(wireRow.length, wireRow.lengthUnit || 'mm');
    const gaugeInMm2 = gaugeUnit === 'awg' ? awgToMm2(gauge) : gauge;
    // Copper resistivity: ~0.0175 Ω·mm²/m
    resistance = (0.0175 * lengthInMeters) / gaugeInMm2;
  }

  return {
    name: wireName,
    fromConnector: wireRow.fromConnector,
    fromPinNumber: fromPin,
    toConnector: wireRow.toConnector,
    toPinNumber: toPin,
    signal: wireRow.signal,
    physical: {
      gauge,
      gauge_unit: gaugeUnit,
      color,
      length: wireRow.length,
      length_unit: wireRow.lengthUnit,
    },
    electrical: resistance !== undefined ? { resistance } : undefined,
    metadata: {
      notes: wireRow.notes,
      partNumber: wireRow.partNumber,
      manufacturer: wireRow.manufacturer,
      signalType: wireRow.signalType,
    },
  };
}

/**
 * Convert connector row to HarnessFlow format
 */
function convertConnector(connectorRow: ExcelConnectorRow): ConvertedConnector | null {
  if (!connectorRow.connectorName && !connectorRow.connectorId) {
    return null;
  }

  const name = connectorRow.connectorName || connectorRow.connectorId!;
  const pinCount = connectorRow.pinCount || 0;

  // Generate default pins
  const pins = Array.from({ length: pinCount }, (_, i) => ({
    number: i + 1,
    label: `Pin ${i + 1}`,
  }));

  return {
    name,
    type: connectorRow.type || 'generic',
    manufacturer: connectorRow.manufacturer,
    partNumber: connectorRow.partNumber,
    pinCount,
    gender: connectorRow.gender || 'female',
    pins,
    metadata: {
      notes: connectorRow.notes,
      location: connectorRow.location,
    },
  };
}

/**
 * Extract connector and ECU info from wire row
 */
function extractConnectorInfo(
  wireRow: ExcelWireRow,
  connectors: Map<string, ConvertedConnector>,
  ecus: Map<string, ConvertedECU>
): void {
  // From connector
  if (wireRow.fromConnector && !connectors.has(wireRow.fromConnector)) {
    const connector: ConvertedConnector = {
      name: wireRow.fromConnector,
      type: 'generic',
      pinCount: 0, // Will be calculated later
      gender: 'female',
      pins: [],
    };
    connectors.set(wireRow.fromConnector, connector);

    // Add to ECU if specified
    if (wireRow.fromECU) {
      addConnectorToECU(ecus, wireRow.fromECU, connector);
    }
  }

  // To connector
  if (wireRow.toConnector && !connectors.has(wireRow.toConnector)) {
    const connector: ConvertedConnector = {
      name: wireRow.toConnector,
      type: 'generic',
      pinCount: 0, // Will be calculated later
      gender: 'female',
      pins: [],
    };
    connectors.set(wireRow.toConnector, connector);

    // Add to ECU if specified
    if (wireRow.toECU) {
      addConnectorToECU(ecus, wireRow.toECU, connector);
    }
  }
}

/**
 * Add connector to ECU
 */
function addConnectorToECU(
  ecus: Map<string, ConvertedECU>,
  ecuName: string,
  connector: ConvertedConnector
): void {
  if (!ecus.has(ecuName)) {
    ecus.set(ecuName, {
      name: ecuName,
      connectors: [],
    });
  }

  const ecu = ecus.get(ecuName)!;
  if (!ecu.connectors.find((c) => c.name === connector.name)) {
    ecu.connectors.push(connector);
  }
}

/**
 * Parse pin number from various formats
 */
function parsePinNumber(pin: string | number | undefined): number {
  if (pin === undefined || pin === null || pin === '') {
    return 1; // Default to pin 1
  }

  if (typeof pin === 'number') {
    return pin;
  }

  // Try to parse as number
  const num = parseInt(String(pin));
  if (!isNaN(num)) {
    return num;
  }

  // If it's a label like "A1", extract the number
  const match = String(pin).match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }

  return 1; // Default
}

/**
 * Convert length to meters
 */
function convertLengthToMeters(length: number, unit: 'mm' | 'cm' | 'm'): number {
  switch (unit) {
    case 'mm':
      return length / 1000;
    case 'cm':
      return length / 100;
    case 'm':
      return length;
    default:
      return length / 1000; // Default to mm
  }
}

/**
 * Update connector pin counts based on wires
 */
export function updateConnectorPinCounts(
  wires: ConvertedWire[],
  connectors: Map<string, ConvertedConnector>
): void {
  // Track max pin number for each connector
  const maxPins = new Map<string, number>();

  for (const wire of wires) {
    // From connector
    const fromMax = maxPins.get(wire.fromConnector) || 0;
    maxPins.set(wire.fromConnector, Math.max(fromMax, wire.fromPinNumber));

    // To connector
    const toMax = maxPins.get(wire.toConnector) || 0;
    maxPins.set(wire.toConnector, Math.max(toMax, wire.toPinNumber));
  }

  // Update connector pin counts
  for (const [connectorName, maxPin] of maxPins.entries()) {
    const connector = connectors.get(connectorName);
    if (connector && connector.pinCount < maxPin) {
      connector.pinCount = maxPin;

      // Generate pins if needed
      if (connector.pins.length < maxPin) {
        connector.pins = Array.from({ length: maxPin }, (_, i) => ({
          number: i + 1,
          label: `Pin ${i + 1}`,
        }));
      }
    }
  }
}
