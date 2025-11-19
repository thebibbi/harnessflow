/**
 * Validation types and rule definitions
 */

/**
 * Validation severity level
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation rule type
 */
export type ValidationRuleType =
  | 'electrical'
  | 'physical'
  | 'connectivity'
  | 'regulatory'
  | 'business';

/**
 * Validation result for a single check
 */
export interface ValidationResult {
  id: string;
  ruleId: string;
  ruleType: ValidationRuleType;
  severity: ValidationSeverity;
  message: string;
  affectedEntities: string[];
  details?: Record<string, unknown>;
  suggestedFix?: string;
}

/**
 * Overall validation report
 */
export interface ValidationReport {
  timestamp: Date;
  projectId: string;
  totalChecks: number;
  results: ValidationResult[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  passed: boolean;
}

/**
 * Validation constraint definition
 */
export interface ValidationConstraint {
  id: string;
  name: string;
  description: string;
  type: ValidationRuleType;
  severity: ValidationSeverity;
  enabled: boolean;
  configuration?: Record<string, unknown>;
}

/**
 * Electrical validation parameters
 */
export interface ElectricalValidationParams {
  maxVoltage?: number;
  maxCurrent?: number;
  maxPowerDissipation?: number;
  allowedVoltageDrop?: number;
  maxWireLength?: number;
}

/**
 * Connectivity validation parameters
 */
export interface ConnectivityValidationParams {
  requireGroundPath?: boolean;
  requirePowerPath?: boolean;
  maxChainLength?: number;
  allowLoops?: boolean;
}
