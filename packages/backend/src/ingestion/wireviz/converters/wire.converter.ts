/**
 * Wire/Cable Converter
 *
 * Converts WireViz cables and connections to HarnessFlow wires
 */

import type { WireVizCable, WireVizConnection } from '../types/wireviz.types';
import { parsePinSpec, parseGauge, awgToMm2 } from '../types/wireviz.types';
import { parseColorCode, parseWireColors } from './color.converter';
import { Prisma } from '@prisma/client';
import type { ConvertedConnector } from './connector.converter';

/**
 * Converted wire data (ready for database insertion)
 */
export interface ConvertedWire {
  name: string;
  fromConnector: string;
  fromPinNumber: string;
  toConnector: string;
  toPinNumber: string;
  physical: Prisma.JsonValue;
  electrical: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
}

/**
 * Connection parsing result
 */
interface ParsedConnection {
  connector1: string;
  pins1: (string | number)[];
  cable?: string;
  wires?: (string | number)[];
  pins2?: (string | number)[];
  connector2: string;
}

/**
 * Convert WireViz cables and connections to wires
 *
 * @param cables - WireViz cable definitions
 * @param connections - WireViz connection tuples
 * @param connectors - Converted connectors for pin validation
 * @returns Array of converted wires
 */
export function convertWires(
  cables: Record<string, WireVizCable>,
  connections: WireVizConnection[],
  connectors: Map<string, ConvertedConnector>
): ConvertedWire[] {
  const wires: ConvertedWire[] = [];

  for (const connection of connections) {
    const parsed = parseConnection(connection);

    if (!parsed.cable) {
      // Direct connection without cable (rare)
      const directWires = createDirectWires(parsed, connectors);
      wires.push(...directWires);
      continue;
    }

    const cable = cables[parsed.cable];
    if (!cable) {
      console.warn(`Cable "${parsed.cable}" referenced but not defined`);
      continue;
    }

    const cableWires = createCableWires(parsed, cable, connectors);
    wires.push(...cableWires);
  }

  return wires;
}

/**
 * Parse connection tuple into structured format
 */
function parseConnection(connection: WireVizConnection): ParsedConnection {
  if (connection.length === 3) {
    // Format: [connector1, pins, connector2] (direct)
    return {
      connector1: connection[0],
      pins1: parsePinSpec(connection[1]),
      connector2: connection[2],
    };
  }

  if (connection.length === 5) {
    // Format: [connector1, pins, cable, wires, connector2]
    // This is a simplified format where pins2 = wires
    return {
      connector1: connection[0],
      pins1: parsePinSpec(connection[1]),
      cable: connection[2],
      wires: parsePinSpec(connection[3]),
      connector2: connection[4],
    };
  }

  // Full format: [connector1, pins1, cable, wires, pins2, connector2]
  return {
    connector1: connection[0],
    pins1: parsePinSpec(connection[1]),
    cable: connection[2],
    wires: parsePinSpec(connection[3]),
    pins2: parsePinSpec(connection[4]),
    connector2: connection[5] as string,
  };
}

/**
 * Create wires for direct connections (no cable)
 */
function createDirectWires(
  parsed: ParsedConnection,
  _connectors: Map<string, ConvertedConnector>
): ConvertedWire[] {
  const wires: ConvertedWire[] = [];
  const pins1 = parsed.pins1;
  const pins2 = parsed.pins2 || parsed.pins1; // If no pins2, assume same as pins1

  for (let i = 0; i < Math.min(pins1.length, pins2.length); i++) {
    wires.push({
      name: `${parsed.connector1}_${pins1[i]}-${parsed.connector2}_${pins2[i]}`,
      fromConnector: parsed.connector1,
      fromPinNumber: String(pins1[i]),
      toConnector: parsed.connector2,
      toPinNumber: String(pins2[i]),
      physical: {
        gauge: 0.5, // Default gauge for direct connections
        gauge_unit: 'mm2',
        color: { primary: 'BK', primaryHex: '#000000' },
      },
      electrical: {},
      metadata: {
        direct_connection: true,
      },
    });
  }

  return wires;
}

/**
 * Create wires for cable connections
 */
function createCableWires(
  parsed: ParsedConnection,
  cable: WireVizCable,
  _connectors: Map<string, ConvertedConnector>
): ConvertedWire[] {
  const wires: ConvertedWire[] = [];

  // Determine wire count
  const wireCount = cable.wirecount || cable.colors?.length || 1;

  // Get wire colors
  const colorStandard = cable.color_code || 'IEC';
  const wireColors = cable.colors
    ? parseWireColors(cable.colors, colorStandard)
    : Array(wireCount).fill(parseColorCode('BK', colorStandard));

  // Parse gauge
  const gauge = cable.gauge ? parseGauge(cable.gauge) : { value: 22, unit: 'awg' as const };
  const gaugeInMm2 = gauge.unit === 'awg' ? awgToMm2(gauge.value) : gauge.value;

  // Get wire indices (which wires in the cable are used)
  const wireIndices = parsed.wires
    ? parsed.wires.map((w) => (typeof w === 'number' ? w - 1 : parseInt(String(w)) - 1))
    : Array.from({ length: wireCount }, (_, i) => i);

  const pins1 = parsed.pins1;
  const pins2 = parsed.pins2 || wireIndices.map((_, i) => pins1[i] || i + 1);

  // Create a wire for each connection
  for (let i = 0; i < Math.min(pins1.length, pins2.length, wireIndices.length); i++) {
    const wireIndex = wireIndices[i];
    const color = wireColors[wireIndex] || wireColors[0];

    const physical: any = {
      gauge: gaugeInMm2,
      gauge_unit: 'mm2',
      color: {
        primary: color.primary,
        primaryHex: color.primaryHex,
        ...(color.secondary && {
          secondary: color.secondary,
          secondaryHex: color.secondaryHex,
        }),
        isStriped: color.isStriped,
      },
    };

    if (cable.length) {
      physical.length = cable.length;
    }

    if (cable.shield) {
      physical.shielded = cable.shield;
    }

    const metadata: any = {
      cable_name: parsed.cable,
      wire_index: wireIndex + 1,
    };

    if (cable.notes) {
      metadata.notes = cable.notes;
    }

    if (cable.manufacturer) {
      metadata.manufacturer = cable.manufacturer;
    }

    if (cable.mpn || cable.pn) {
      metadata.part_number = cable.mpn || cable.pn;
    }

    wires.push({
      name: `${parsed.cable}_${wireIndex + 1}`,
      fromConnector: parsed.connector1,
      fromPinNumber: String(pins1[i]),
      toConnector: parsed.connector2,
      toPinNumber: String(pins2[i]),
      physical,
      electrical: {
        // Calculate resistance based on gauge and length
        ...(cable.length && {
          resistance: calculateResistance(gaugeInMm2, cable.length),
        }),
      },
      metadata,
    });
  }

  return wires;
}

/**
 * Calculate wire resistance (Ω)
 *
 * Uses copper resistivity: 0.0175 Ω·mm²/m
 *
 * @param gaugeMm2 - Wire gauge in mm²
 * @param lengthM - Length in meters
 * @returns Resistance in ohms
 */
function calculateResistance(gaugeMm2: number, lengthM: number): number {
  const copperResistivity = 0.0175; // Ω·mm²/m
  return (copperResistivity * lengthM) / gaugeMm2;
}
