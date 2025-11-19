/**
 * Excel Harness Data Types
 *
 * Defines the structure for legacy Excel harness data formats
 * Supports common automotive wiring harness Excel layouts
 */

/**
 * Column mapping configuration
 * Maps Excel column names to standardized field names
 */
export interface ColumnMapping {
  // Wire fields
  wireId?: string;
  wireName?: string;
  wireGauge?: string;
  wireColor?: string;
  wireLength?: string;

  // From connector/pin
  fromConnector?: string;
  fromPin?: string;
  fromPinLabel?: string;
  fromECU?: string;

  // To connector/pin
  toConnector?: string;
  toPin?: string;
  toPinLabel?: string;
  toECU?: string;

  // Signal/function
  signal?: string;
  signalType?: string;

  // Metadata
  notes?: string;
  partNumber?: string;
  manufacturer?: string;
}

/**
 * Wire row from Excel
 */
export interface ExcelWireRow {
  // Identity
  wireId?: string;
  wireName?: string;

  // Physical properties
  gauge?: string | number;
  gaugeUnit?: 'awg' | 'mm2';
  color?: string;
  length?: number;
  lengthUnit?: 'mm' | 'cm' | 'm';

  // From endpoint
  fromConnector?: string;
  fromPin?: string | number;
  fromPinLabel?: string;
  fromECU?: string;

  // To endpoint
  toConnector?: string;
  toPin?: string | number;
  toPinLabel?: string;
  toECU?: string;

  // Signal information
  signal?: string;
  signalType?: string;

  // Metadata
  notes?: string;
  partNumber?: string;
  manufacturer?: string;

  // Raw row data (for debugging)
  _rawRow?: Record<string, any>;
  _rowNumber?: number;
}

/**
 * Connector row from Excel
 */
export interface ExcelConnectorRow {
  // Identity
  connectorId?: string;
  connectorName?: string;

  // Properties
  type?: string;
  manufacturer?: string;
  partNumber?: string;
  pinCount?: number;
  gender?: 'male' | 'female';

  // Location
  ecu?: string;
  location?: string;

  // Metadata
  notes?: string;

  // Raw row data
  _rawRow?: Record<string, any>;
  _rowNumber?: number;
}

/**
 * Pin definition from Excel
 */
export interface ExcelPinRow {
  // Identity
  connectorId?: string;
  pinNumber?: string | number;
  pinLabel?: string;

  // Properties
  signalType?: string;
  color?: string;

  // Metadata
  notes?: string;

  // Raw row data
  _rawRow?: Record<string, any>;
  _rowNumber?: number;
}

/**
 * Excel document structure
 */
export interface ExcelDocument {
  // Wire list (most common sheet)
  wires: ExcelWireRow[];

  // Optional connector definitions
  connectors?: ExcelConnectorRow[];

  // Optional pin definitions
  pins?: ExcelPinRow[];

  // Metadata
  metadata?: {
    fileName?: string;
    sheetNames?: string[];
    totalRows?: number;
    parsedAt?: Date;
  };
}

/**
 * Sheet detection result
 */
export interface SheetDetectionResult {
  sheetName: string;
  type: 'wires' | 'connectors' | 'pins' | 'unknown';
  confidence: number;
  headerRow?: number;
  columnMapping?: ColumnMapping;
}

/**
 * Auto-detection configuration
 */
export interface AutoDetectionConfig {
  // Keywords for wire sheets
  wireSheetKeywords?: string[];

  // Keywords for connector sheets
  connectorSheetKeywords?: string[];

  // Keywords for pin sheets
  pinSheetKeywords?: string[];

  // Column header detection
  headerRowMax?: number; // Max row to search for headers
  minRequiredColumns?: number; // Minimum columns to consider valid

  // LLM-assisted mapping (optional)
  useLLM?: boolean;
  llmEndpoint?: string;
}

/**
 * Parse result
 */
export interface ExcelParseResult {
  success: boolean;
  document?: ExcelDocument;
  errors?: string[];
  warnings?: string[];
  detectionResults?: SheetDetectionResult[];
}

/**
 * Import options
 */
export interface ExcelImportOptions {
  projectName: string;
  projectDescription?: string;
  vehicle?: string;

  // Mapping options
  columnMapping?: ColumnMapping;
  autoDetect?: boolean;
  autoDetectionConfig?: AutoDetectionConfig;

  // Processing options
  skipInvalidRows?: boolean;
  createMissingConnectors?: boolean;
  createMissingECUs?: boolean;

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Import result
 */
export interface ExcelImportResult {
  success: boolean;
  projectId?: string;
  errors?: string[];
  warnings?: string[];
  stats?: {
    wiresCreated: number;
    connectorsCreated: number;
    ecusCreated: number;
    pinsCreated: number;
    rowsSkipped: number;
  };
}

/**
 * Common wire gauge formats in Excel
 */
export const GAUGE_PATTERNS = {
  AWG: /^(\d+)\s*AWG$/i,
  MM2: /^([\d.]+)\s*mm[²2]$/i,
  COMBINED: /^(\d+)\s*AWG\s*\(([\d.]+)\s*mm[²2]\)$/i,
};

/**
 * Common color code patterns
 */
export const COLOR_PATTERNS = {
  SINGLE: /^([A-Z]{2,4})$/i,
  STRIPED: /^([A-Z]{2})[\/\-]([A-Z]{2})$/i,
  FULL_NAME: /^(black|red|blue|green|yellow|white|brown|orange|violet|grey|gray|pink)$/i,
};

/**
 * Signal type categories
 */
export const SIGNAL_TYPES = [
  'power',
  'ground',
  'can',
  'lin',
  'digital',
  'analog',
  'pwm',
  'sensor',
  'actuator',
] as const;

export type SignalType = (typeof SIGNAL_TYPES)[number];
