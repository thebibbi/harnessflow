/**
 * Application-wide constants
 */

/**
 * Supported file formats for import/export
 */
export const SUPPORTED_FORMATS = {
  KBL: 'kbl',
  VEC: 'vec',
  WIREVIZ: 'wireviz',
  EXCEL: 'excel',
  PDF: 'pdf',
} as const;

/**
 * Network protocols
 */
export const NETWORK_PROTOCOLS = {
  CAN: 'CAN',
  LIN: 'LIN',
  FLEXRAY: 'FlexRay',
  ETHERNET: 'Ethernet',
  MOST: 'MOST',
} as const;

/**
 * Validation severity levels
 */
export const VALIDATION_SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

/**
 * Project status values
 */
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  RELEASED: 'released',
} as const;

/**
 * Pin function types
 */
export const PIN_FUNCTIONS = {
  POWER: 'power',
  GROUND: 'ground',
  SIGNAL: 'signal',
  CAN_HIGH: 'can_high',
  CAN_LOW: 'can_low',
  LIN: 'lin',
  UNUSED: 'unused',
} as const;

/**
 * Wire gauge standards
 */
export const WIRE_GAUGE_STANDARDS = {
  AWG: 'AWG',
  SQ_MM: 'SQ_MM',
} as const;

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * API version
 */
export const API_VERSION = 'v1';
