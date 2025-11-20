/**
 * WireViz Type Definitions
 *
 * Based on WireViz YAML format specification
 * See: https://github.com/wireviz/WireViz
 *
 * WireViz uses YAML to describe:
 * - Connectors (connectors section)
 * - Cables (cables section)
 * - Connections (connections section)
 */

/**
 * WireViz Connector Definition
 *
 * Represents a connector (housing) with pins/cavities
 */
export interface WireVizConnector {
  type?: string; // Connector type/part number
  subtype?: string; // Connector subtype
  pincount?: number; // Number of pins (auto-detected if pinlabels provided)
  pinlabels?: string[] | Record<number, string>; // Pin labels (array or object)
  pincolors?: string[]; // Colors for pins (optional)
  notes?: string; // Additional notes
  manufacturer?: string; // Manufacturer name
  mpn?: string; // Manufacturer part number
  pn?: string; // Part number
  style?: 'simple' | 'full'; // Rendering style
  color?: string; // Connector body color
  bgcolor?: string; // Background color
  show_name?: boolean; // Show connector name
  show_pincount?: boolean; // Show pin count
  image?: {
    src: string; // Image source
    scale?: number; // Image scale
    width?: number; // Image width
    height?: number; // Image height
  };
}

/**
 * WireViz Cable Definition
 *
 * Represents a cable/wire with one or more conductors
 */
export interface WireVizCable {
  type?: string; // Cable type/part number
  wirecount?: number; // Number of wires in cable
  colors?: string[]; // Wire colors (IEC or DIN color codes)
  color_code?: 'IEC' | 'DIN'; // Color code standard
  gauge?: number | string; // Wire gauge (AWG or mm²)
  gauge_unit?: 'awg' | 'mm2'; // Gauge unit
  length?: number; // Cable length
  shield?: boolean | string; // Shield/shielding info
  notes?: string; // Additional notes
  manufacturer?: string; // Manufacturer name
  mpn?: string; // Manufacturer part number
  pn?: string; // Part number
  show_name?: boolean; // Show cable name
  show_wirecount?: boolean; // Show wire count
}

/**
 * WireViz Connection
 *
 * Defines how connectors are connected via cables
 * Format: [connector1, pin(s), cable, wire(s), pin(s), connector2]
 */
export type WireVizConnection =
  | [
      string,
      string | number | (string | number)[],
      string,
      string | number | (string | number)[],
      string,
    ]
  | [string, string | number | (string | number)[], string]; // For connectors connected without intermediate cable

/**
 * Complete WireViz Document
 */
export interface WireVizDocument {
  connectors: Record<string, WireVizConnector>;
  cables: Record<string, WireVizCable>;
  connections: WireVizConnection[];
  metadata?: {
    title?: string;
    description?: string;
    notes?: string;
    version?: string;
  };
}

/**
 * Wire Color Mapping (IEC 60757)
 *
 * Standard color abbreviations used in WireViz
 */
export const IEC_COLOR_MAP: Record<string, string> = {
  // Basic colors
  BK: '#000000', // Black
  BN: '#8B4513', // Brown
  RD: '#FF0000', // Red
  OG: '#FFA500', // Orange (was OR)
  OR: '#FFA500', // Orange
  YE: '#FFFF00', // Yellow
  GN: '#008000', // Green
  BU: '#0000FF', // Blue
  VT: '#800080', // Violet (was VI)
  VI: '#800080', // Violet
  GY: '#808080', // Grey (was GR)
  GR: '#808080', // Grey
  WH: '#FFFFFF', // White
  PK: '#FFC0CB', // Pink
  TQ: '#40E0D0', // Turquoise (was TU)
  TU: '#40E0D0', // Turquoise

  // Combined colors (stripe notation)
  GNYE: '#ADFF2F', // Green-Yellow (ground)
  WHBU: '#87CEEB', // White-Blue
  BUWH: '#87CEEB', // Blue-White
  RDBU: '#DA70D6', // Red-Blue
  BNWH: '#D2691E', // Brown-White
};

/**
 * DIN 47100 Color Mapping
 *
 * German color standard
 */
export const DIN_COLOR_MAP: Record<string, string> = {
  WS: '#FFFFFF', // Weiß (White)
  BR: '#8B4513', // Braun (Brown)
  GN: '#008000', // Grün (Green)
  GE: '#FFFF00', // Gelb (Yellow)
  GR: '#808080', // Grau (Grey)
  RS: '#FFC0CB', // Rosa (Pink)
  BL: '#0000FF', // Blau (Blue)
  RT: '#FF0000', // Rot (Red)
  SW: '#000000', // Schwarz (Black)
  VI: '#800080', // Violett (Violet)
  GNGB: '#ADFF2F', // Grün-Gelb (Green-Yellow)
};

/**
 * AWG to mm² conversion table
 */
export const AWG_TO_MM2: Record<number, number> = {
  30: 0.05,
  28: 0.08,
  26: 0.14,
  24: 0.25,
  22: 0.34,
  20: 0.5,
  18: 0.75,
  16: 1.5,
  14: 2.5,
  12: 4.0,
  10: 6.0,
  8: 10.0,
  6: 16.0,
  4: 25.0,
  2: 35.0,
  0: 50.0,
};

/**
 * Parse pin specification
 *
 * Handles various pin formats:
 * - Single pin: "1" or 1
 * - Range: "1-4" (expands to [1,2,3,4])
 * - List: [1, 2, 3] or ["A", "B", "C"]
 */
export function parsePinSpec(spec: string | number | (string | number)[]): (string | number)[] {
  if (Array.isArray(spec)) {
    return spec;
  }

  if (typeof spec === 'number') {
    return [spec];
  }

  // Check for range notation (e.g., "1-4")
  if (typeof spec === 'string' && spec.includes('-')) {
    const [start, end] = spec.split('-').map(Number);
    if (!isNaN(start) && !isNaN(end)) {
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  }

  return [spec];
}

/**
 * Convert AWG to mm²
 */
export function awgToMm2(awg: number): number {
  return AWG_TO_MM2[awg] || 0;
}

/**
 * Parse gauge specification
 *
 * Handles:
 * - AWG: "22 AWG" or 22
 * - mm²: "0.5 mm2" or "0.5mm²"
 */
export function parseGauge(gauge: string | number): { value: number; unit: 'awg' | 'mm2' } {
  if (typeof gauge === 'number') {
    // Assume AWG if just a number
    return { value: gauge, unit: 'awg' };
  }

  const gaugeStr = gauge.toLowerCase();

  // Check for mm² notation
  if (gaugeStr.includes('mm') || gaugeStr.includes('²')) {
    const value = parseFloat(gaugeStr.replace(/[^0-9.]/g, ''));
    return { value, unit: 'mm2' };
  }

  // Check for AWG notation
  if (gaugeStr.includes('awg')) {
    const value = parseInt(gaugeStr.replace(/[^0-9]/g, ''), 10);
    return { value, unit: 'awg' };
  }

  // Default to AWG
  const value = parseFloat(gauge);
  return { value, unit: 'awg' };
}
