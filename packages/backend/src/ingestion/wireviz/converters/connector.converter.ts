/**
 * Connector Converter
 *
 * Converts WireViz connector definitions to HarnessFlow format
 */

import type { WireVizConnector } from '../types/wireviz.types';
import { Prisma } from '@prisma/client';

/**
 * Converted connector data (ready for database insertion)
 */
export interface ConvertedConnector {
  name: string;
  type: string;
  manufacturer: string;
  partNumber: string;
  gender: string;
  pinCount: number;
  physical: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
  pins: ConvertedPin[];
}

/**
 * Converted pin data
 */
export interface ConvertedPin {
  pinNumber: string;
  label: string | null;
  capabilities: Prisma.JsonValue;
  physical: Prisma.JsonValue;
}

/**
 * Convert WireViz connector to HarnessFlow format
 *
 * @param name - Connector name/ID from WireViz
 * @param connector - WireViz connector definition
 * @returns Converted connector data
 */
export function convertConnector(name: string, connector: WireVizConnector): ConvertedConnector {
  // Extract pin count
  const pinCount = connector.pincount || getPinCountFromLabels(connector.pinlabels);

  // Convert pin labels to array format
  const pinLabels = normalizePinLabels(connector.pinlabels, pinCount);

  // Generate pins
  const pins = generatePins(pinLabels, connector.pincolors);

  // Build physical properties
  const physical: any = {};
  if (connector.color) {
    physical.color = connector.color;
  }
  if (connector.image) {
    physical.image = connector.image;
  }

  // Build metadata
  const metadata: any = {};
  if (connector.notes) {
    metadata.notes = connector.notes;
  }
  if (connector.style) {
    metadata.style = connector.style;
  }
  if (connector.show_name !== undefined) {
    metadata.show_name = connector.show_name;
  }
  if (connector.show_pincount !== undefined) {
    metadata.show_pincount = connector.show_pincount;
  }

  return {
    name,
    type: connector.type || connector.subtype || 'generic',
    manufacturer: connector.manufacturer || 'Unknown',
    partNumber: connector.mpn || connector.pn || connector.type || name,
    gender: 'female', // WireViz doesn't specify gender, default to female
    pinCount,
    physical,
    metadata,
    pins,
  };
}

/**
 * Get pin count from pin labels
 */
function getPinCountFromLabels(pinlabels?: string[] | Record<number, string>): number {
  if (!pinlabels) {
    return 0;
  }

  if (Array.isArray(pinlabels)) {
    return pinlabels.length;
  }

  // For object notation, find the highest pin number
  const pinNumbers = Object.keys(pinlabels).map(Number);
  return Math.max(...pinNumbers, 0);
}

/**
 * Normalize pin labels to array format
 *
 * WireViz supports:
 * - Array: ["GND", "VCC", "SIG"]
 * - Object: {1: "GND", 2: "VCC", 3: "SIG"}
 *
 * @returns Array of pin labels (index 0 = pin 1)
 */
function normalizePinLabels(
  pinlabels: string[] | Record<number, string> | undefined,
  pinCount: number
): (string | null)[] {
  if (!pinlabels) {
    // No labels provided, generate numeric labels
    return Array.from({ length: pinCount }, (_, i) => String(i + 1));
  }

  if (Array.isArray(pinlabels)) {
    return pinlabels.map((label) => label || null);
  }

  // Object notation - convert to array
  const labels: (string | null)[] = [];
  for (let i = 1; i <= pinCount; i++) {
    labels.push(pinlabels[i] || null);
  }
  return labels;
}

/**
 * Generate pin definitions
 */
function generatePins(labels: (string | null)[], colors?: string[]): ConvertedPin[] {
  return labels.map((label, index) => {
    const pinNumber = String(index + 1);

    const capabilities: any = {
      io_type: 'generic',
      signal_types: ['analog', 'digital'],
    };

    const physical: any = {};
    if (colors && colors[index]) {
      physical.color = colors[index];
    }

    return {
      pinNumber,
      label,
      capabilities,
      physical,
    };
  });
}

/**
 * Convert multiple connectors
 */
export function convertConnectors(
  connectors: Record<string, WireVizConnector>
): Map<string, ConvertedConnector> {
  const converted = new Map<string, ConvertedConnector>();

  for (const [name, connector] of Object.entries(connectors)) {
    converted.set(name, convertConnector(name, connector));
  }

  return converted;
}
