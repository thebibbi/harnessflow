/**
 * Color Code Converter
 *
 * Converts wire color codes (IEC, DIN) to hex color values
 */

import { IEC_COLOR_MAP, DIN_COLOR_MAP } from '../types/wireviz.types';

/**
 * Color representation
 */
export interface WireColor {
  primary: string; // Primary color code (e.g., "RD", "BU")
  primaryHex: string; // Primary color hex (e.g., "#FF0000")
  secondary?: string; // Secondary color for striped wires (e.g., "BK")
  secondaryHex?: string; // Secondary color hex
  isStriped: boolean; // Whether wire has a stripe
  displayName: string; // Human-readable name (e.g., "Red", "Red-Black")
}

/**
 * Parse color code to color object
 *
 * Supports:
 * - Single colors: "RD", "BU", "GN"
 * - Striped/Combined colors: "RDBU", "WHBK", "GNYE"
 * - DIN colors: "WS", "BR", "RT"
 *
 * @param colorCode - Color code string
 * @param standard - Color standard ('IEC' or 'DIN')
 * @returns Parsed color information
 */
export function parseColorCode(colorCode: string, standard: 'IEC' | 'DIN' = 'IEC'): WireColor {
  const code = colorCode.toUpperCase().trim();
  const colorMap = standard === 'IEC' ? IEC_COLOR_MAP : DIN_COLOR_MAP;

  // Check if color exists directly in map (including combined colors like GNYE)
  if (colorMap[code]) {
    const isStriped = code.length > 2;
    return {
      primary: code,
      primaryHex: colorMap[code],
      isStriped,
      displayName: getColorDisplayName(code, standard),
    };
  }

  // Try to split into primary + secondary for striped wires
  // Common pattern: 4-letter codes are usually primary(2) + secondary(2)
  if (code.length === 4) {
    const primary = code.substring(0, 2);
    const secondary = code.substring(2, 4);

    if (colorMap[primary] && colorMap[secondary]) {
      return {
        primary,
        primaryHex: colorMap[primary],
        secondary,
        secondaryHex: colorMap[secondary],
        isStriped: true,
        displayName: `${getColorDisplayName(primary, standard)}-${getColorDisplayName(secondary, standard)}`,
      };
    }
  }

  // If we can't parse it, return as-is with a default color
  return {
    primary: code,
    primaryHex: '#808080', // Default to grey if unknown
    isStriped: false,
    displayName: code,
  };
}

/**
 * Get human-readable color name
 */
function getColorDisplayName(code: string, _standard: 'IEC' | 'DIN'): string {
  const names: Record<string, string> = {
    // IEC
    BK: 'Black',
    BN: 'Brown',
    RD: 'Red',
    OG: 'Orange',
    OR: 'Orange',
    YE: 'Yellow',
    GN: 'Green',
    BU: 'Blue',
    VT: 'Violet',
    VI: 'Violet',
    GY: 'Grey',
    GR: 'Grey',
    WH: 'White',
    PK: 'Pink',
    TQ: 'Turquoise',
    TU: 'Turquoise',
    GNYE: 'Green-Yellow',

    // DIN
    WS: 'White',
    BR: 'Brown',
    GE: 'Yellow',
    RS: 'Pink',
    BL: 'Blue',
    RT: 'Red',
    SW: 'Black',
    GNGB: 'Green-Yellow',
  };

  return names[code] || code;
}

/**
 * Convert wire colors array to color objects
 *
 * @param colors - Array of color codes
 * @param standard - Color standard
 * @returns Array of parsed colors
 */
export function parseWireColors(colors: string[], standard: 'IEC' | 'DIN' = 'IEC'): WireColor[] {
  return colors.map((color) => parseColorCode(color, standard));
}

/**
 * Generate visual representation of wire color
 *
 * Returns SVG-compatible gradient or solid color
 *
 * @param color - Parsed color
 * @returns CSS/SVG color value
 */
export function getWireColorStyle(color: WireColor): string {
  if (color.isStriped && color.secondaryHex) {
    // For striped wires, create a gradient representation
    // This can be used in CSS or SVG
    return `linear-gradient(90deg, ${color.primaryHex} 0%, ${color.primaryHex} 70%, ${color.secondaryHex} 70%, ${color.secondaryHex} 100%)`;
  }

  return color.primaryHex;
}

/**
 * Validate color code
 *
 * @param colorCode - Color code to validate
 * @param standard - Color standard
 * @returns True if valid
 */
export function isValidColorCode(colorCode: string, standard: 'IEC' | 'DIN' = 'IEC'): boolean {
  const code = colorCode.toUpperCase().trim();
  const colorMap = standard === 'IEC' ? IEC_COLOR_MAP : DIN_COLOR_MAP;

  // Check direct match
  if (colorMap[code]) {
    return true;
  }

  // Check if it can be split into two valid colors
  if (code.length === 4) {
    const primary = code.substring(0, 2);
    const secondary = code.substring(2, 4);
    return !!(colorMap[primary] && colorMap[secondary]);
  }

  return false;
}

/**
 * Get all available color codes for a standard
 *
 * @param standard - Color standard
 * @returns Array of color codes
 */
export function getAvailableColorCodes(standard: 'IEC' | 'DIN' = 'IEC'): string[] {
  const colorMap = standard === 'IEC' ? IEC_COLOR_MAP : DIN_COLOR_MAP;
  return Object.keys(colorMap);
}
