/**
 * Excel Parser
 *
 * Parses Excel files containing harness data
 */

import * as XLSX from 'xlsx';
import {
  ExcelDocument,
  ExcelWireRow,
  ExcelConnectorRow,
  ExcelParseResult,
  ColumnMapping,
  SheetDetectionResult,
  AutoDetectionConfig,
} from '../types/excel.types';
import { validateExcelDocument } from '../schemas/excel.schema';

/**
 * Default auto-detection configuration
 */
const DEFAULT_AUTO_DETECT_CONFIG: AutoDetectionConfig = {
  wireSheetKeywords: ['wire', 'cable', 'harness', 'connection', 'routing'],
  connectorSheetKeywords: ['connector', 'plug', 'receptacle', 'housing'],
  pinSheetKeywords: ['pin', 'terminal', 'contact'],
  headerRowMax: 10,
  minRequiredColumns: 3,
  useLLM: false,
};

/**
 * Parse Excel file from buffer
 */
export function parseExcelFile(
  buffer: Buffer,
  options?: {
    columnMapping?: ColumnMapping;
    autoDetect?: boolean;
    autoDetectionConfig?: AutoDetectionConfig;
  }
): ExcelParseResult {
  try {
    // Read workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Auto-detect or use provided mapping
    const config = {
      ...DEFAULT_AUTO_DETECT_CONFIG,
      ...options?.autoDetectionConfig,
    };

    const detectionResults: SheetDetectionResult[] = [];
    const wires: ExcelWireRow[] = [];
    const connectors: ExcelConnectorRow[] = [];

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      // Detect sheet type
      const detection = detectSheetType(sheetName, sheet, config);
      detectionResults.push(detection);

      // Parse based on type
      if (detection.type === 'wires') {
        const wireRows = parseWireSheet(sheet, detection.columnMapping || options?.columnMapping);
        wires.push(...wireRows);
      } else if (detection.type === 'connectors') {
        const connectorRows = parseConnectorSheet(
          sheet,
          detection.columnMapping || options?.columnMapping
        );
        connectors.push(...connectorRows);
      }
    }

    // Build document
    const document: ExcelDocument = {
      wires,
      connectors: connectors.length > 0 ? connectors : undefined,
      metadata: {
        sheetNames: workbook.SheetNames,
        totalRows: wires.length + connectors.length,
        parsedAt: new Date(),
      },
    };

    // Validate document
    const validation = validateExcelDocument(document);
    if (!validation.success) {
      return {
        success: false,
        errors: ['Document validation failed'],
        detectionResults,
      };
    }

    return {
      success: true,
      document,
      detectionResults,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        `Failed to parse Excel file: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}

/**
 * Detect sheet type based on name and content
 */
function detectSheetType(
  sheetName: string,
  sheet: XLSX.WorkSheet,
  config: AutoDetectionConfig
): SheetDetectionResult {
  const nameLower = sheetName.toLowerCase();

  // Check for wire sheet
  if (config.wireSheetKeywords?.some((keyword) => nameLower.includes(keyword.toLowerCase()))) {
    const columnMapping = detectWireColumns(sheet, config);
    return {
      sheetName,
      type: 'wires',
      confidence: 0.9,
      columnMapping,
    };
  }

  // Check for connector sheet
  if (config.connectorSheetKeywords?.some((keyword) => nameLower.includes(keyword.toLowerCase()))) {
    return {
      sheetName,
      type: 'connectors',
      confidence: 0.9,
    };
  }

  // Check for pin sheet
  if (config.pinSheetKeywords?.some((keyword) => nameLower.includes(keyword.toLowerCase()))) {
    return {
      sheetName,
      type: 'pins',
      confidence: 0.9,
    };
  }

  // Default: try to detect from content
  const columnMapping = detectWireColumns(sheet, config);
  if (columnMapping && Object.keys(columnMapping).length >= (config.minRequiredColumns || 3)) {
    return {
      sheetName,
      type: 'wires',
      confidence: 0.6,
      columnMapping,
    };
  }

  return {
    sheetName,
    type: 'unknown',
    confidence: 0,
  };
}

/**
 * Detect wire column mappings from sheet headers
 */
function detectWireColumns(
  sheet: XLSX.WorkSheet,
  config: AutoDetectionConfig
): ColumnMapping | undefined {
  // Get header row (search first N rows)
  const maxRow = config.headerRowMax || 10;
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z1');

  for (let row = range.s.r; row <= Math.min(range.e.r, maxRow); row++) {
    const headers: string[] = [];

    // Read all headers in this row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[cellAddress];
      if (cell && cell.v) {
        headers.push(String(cell.v).toLowerCase());
      } else {
        headers.push('');
      }
    }

    // Try to map headers to fields
    const mapping = mapHeadersToFields(headers);

    // Check if we have enough mapped fields
    if (Object.keys(mapping).length >= (config.minRequiredColumns || 3)) {
      return mapping;
    }
  }

  return undefined;
}

/**
 * Map header strings to field names
 */
function mapHeadersToFields(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  headers.forEach((header, index) => {
    const colName = XLSX.utils.encode_col(index);

    // Wire ID/Name
    if (/wire\s*(id|num|number|#)/i.test(header)) {
      mapping.wireId = colName;
    } else if (/wire\s*(name|label)/i.test(header)) {
      mapping.wireName = colName;
    }
    // Gauge
    else if (/gauge|awg|wire\s*size|cross[\s-]?section/i.test(header)) {
      mapping.wireGauge = colName;
    }
    // Color
    else if (/color|colour/i.test(header)) {
      mapping.wireColor = colName;
    }
    // Length
    else if (/length|len/i.test(header)) {
      mapping.wireLength = colName;
    }
    // From connector
    else if (/from\s*(connector|conn|plug)|source\s*conn/i.test(header)) {
      mapping.fromConnector = colName;
    } else if (/from\s*(pin|terminal)|source\s*pin/i.test(header)) {
      mapping.fromPin = colName;
    } else if (/from\s*(ecu|module|device)/i.test(header)) {
      mapping.fromECU = colName;
    }
    // To connector
    else if (/to\s*(connector|conn|plug)|dest.*conn/i.test(header)) {
      mapping.toConnector = colName;
    } else if (/to\s*(pin|terminal)|dest.*pin/i.test(header)) {
      mapping.toPin = colName;
    } else if (/to\s*(ecu|module|device)/i.test(header)) {
      mapping.toECU = colName;
    }
    // Signal
    else if (/signal|function|circuit/i.test(header)) {
      mapping.signal = colName;
    } else if (/signal\s*type|type/i.test(header)) {
      mapping.signalType = colName;
    }
    // Metadata
    else if (/note|comment|remark/i.test(header)) {
      mapping.notes = colName;
    } else if (/part\s*(num|number|#)|p\/n|mpn/i.test(header)) {
      mapping.partNumber = colName;
    } else if (/manuf|mfr|vendor/i.test(header)) {
      mapping.manufacturer = colName;
    }
  });

  return mapping;
}

/**
 * Parse wire sheet using column mapping
 */
function parseWireSheet(sheet: XLSX.WorkSheet, columnMapping?: ColumnMapping): ExcelWireRow[] {
  if (!columnMapping) {
    return [];
  }

  const wires: ExcelWireRow[] = [];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

  // Start from row after header (assuming header is row 0)
  for (let row = 1; row <= range.e.r; row++) {
    const wireRow = extractWireRow(sheet, row, columnMapping);

    // Skip empty rows
    if (!wireRow.fromConnector && !wireRow.toConnector && !wireRow.wireName) {
      continue;
    }

    wireRow._rowNumber = row + 1; // 1-indexed for user display
    wires.push(wireRow);
  }

  return wires;
}

/**
 * Extract wire row data using column mapping
 */
function extractWireRow(sheet: XLSX.WorkSheet, row: number, mapping: ColumnMapping): ExcelWireRow {
  const wireRow: ExcelWireRow = {
    _rawRow: {},
  };

  // Helper to get cell value
  const getCellValue = (colName?: string): any => {
    if (!colName) return undefined;
    const cellAddress = `${colName}${row + 1}`;
    const cell = sheet[cellAddress];
    if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
      wireRow._rawRow![colName] = cell.v;
      return cell.v;
    }
    return undefined;
  };

  // Extract fields
  wireRow.wireId = getCellValue(mapping.wireId);
  wireRow.wireName = getCellValue(mapping.wireName);
  wireRow.color = getCellValue(mapping.wireColor);

  // Parse gauge
  const gaugeValue = getCellValue(mapping.wireGauge);
  if (gaugeValue !== undefined) {
    const gaugeParsed = parseGauge(String(gaugeValue));
    wireRow.gauge = gaugeParsed.value;
    wireRow.gaugeUnit = gaugeParsed.unit;
  }

  // Parse length
  const lengthValue = getCellValue(mapping.wireLength);
  if (lengthValue !== undefined) {
    const lengthParsed = parseLength(lengthValue);
    wireRow.length = lengthParsed.value;
    wireRow.lengthUnit = lengthParsed.unit;
  }

  // From endpoint
  wireRow.fromConnector = getCellValue(mapping.fromConnector);
  wireRow.fromPin = getCellValue(mapping.fromPin);
  wireRow.fromPinLabel = getCellValue(mapping.fromPinLabel);
  wireRow.fromECU = getCellValue(mapping.fromECU);

  // To endpoint
  wireRow.toConnector = getCellValue(mapping.toConnector);
  wireRow.toPin = getCellValue(mapping.toPin);
  wireRow.toPinLabel = getCellValue(mapping.toPinLabel);
  wireRow.toECU = getCellValue(mapping.toECU);

  // Signal
  wireRow.signal = getCellValue(mapping.signal);
  wireRow.signalType = getCellValue(mapping.signalType);

  // Metadata
  wireRow.notes = getCellValue(mapping.notes);
  wireRow.partNumber = getCellValue(mapping.partNumber);
  wireRow.manufacturer = getCellValue(mapping.manufacturer);

  return wireRow;
}

/**
 * Parse connector sheet
 */
function parseConnectorSheet(
  _sheet: XLSX.WorkSheet,
  _columnMapping?: ColumnMapping
): ExcelConnectorRow[] {
  // TODO: Implement connector sheet parsing
  return [];
}

/**
 * Parse gauge value
 */
function parseGauge(value: string): { value: number; unit: 'awg' | 'mm2' } {
  const str = String(value).trim();

  // Check AWG format
  const awgMatch = str.match(/^(\d+)\s*AWG$/i);
  if (awgMatch) {
    return { value: parseInt(awgMatch[1]), unit: 'awg' };
  }

  // Check mm² format
  const mm2Match = str.match(/^([\d.]+)\s*mm[²2]$/i);
  if (mm2Match) {
    return { value: parseFloat(mm2Match[1]), unit: 'mm2' };
  }

  // Check combined format
  const combinedMatch = str.match(/^(\d+)\s*AWG\s*\(([\d.]+)\s*mm[²2]\)$/i);
  if (combinedMatch) {
    return { value: parseInt(combinedMatch[1]), unit: 'awg' };
  }

  // Default: try to parse as number (assume AWG)
  const numValue = parseFloat(str);
  if (!isNaN(numValue)) {
    return { value: numValue, unit: 'awg' };
  }

  // Fallback
  return { value: 22, unit: 'awg' };
}

/**
 * Parse length value
 */
function parseLength(value: any): { value: number; unit: 'mm' | 'cm' | 'm' } {
  const str = String(value).trim();

  // Check for unit suffixes
  const mmMatch = str.match(/^([\d.]+)\s*mm$/i);
  if (mmMatch) {
    return { value: parseFloat(mmMatch[1]), unit: 'mm' };
  }

  const cmMatch = str.match(/^([\d.]+)\s*cm$/i);
  if (cmMatch) {
    return { value: parseFloat(cmMatch[1]), unit: 'cm' };
  }

  const mMatch = str.match(/^([\d.]+)\s*m$/i);
  if (mMatch) {
    return { value: parseFloat(mMatch[1]), unit: 'm' };
  }

  // Default: parse as number (assume mm)
  const numValue = parseFloat(str);
  if (!isNaN(numValue)) {
    return { value: numValue, unit: 'mm' };
  }

  return { value: 0, unit: 'mm' };
}
