/**
 * WireViz Import Module
 *
 * Complete WireViz YAML import functionality for HarnessFlow
 */

// Module
export { WireVizModule } from './wireviz.module';

// Service
export { WireVizImportService } from './wireviz-import.service';
export type { WireVizImportOptions, WireVizImportResult } from './wireviz-import.service';

// Parser
export {
  parseWireVizYAML,
  parseWireVizYAMLStrict,
  WireVizParseError,
} from './parsers/wireviz.parser';
export type { ParseResult } from './parsers/wireviz.parser';

// Types
export type {
  WireVizDocument,
  WireVizConnector,
  WireVizCable,
  WireVizConnection,
} from './types/wireviz.types';

// Converters
export { convertConnector, convertConnectors } from './converters/connector.converter';
export { convertWires } from './converters/wire.converter';
export { parseColorCode, parseWireColors } from './converters/color.converter';

export type { ConvertedConnector, ConvertedPin } from './converters/connector.converter';
export type { ConvertedWire } from './converters/wire.converter';
export type { WireColor } from './converters/color.converter';

// Validation
export { validateWireVizDocument, formatValidationErrors } from './schemas/wireviz.schema';
