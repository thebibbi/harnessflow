/**
 * Validation Types and Interfaces
 *
 * Defines the core types for the constraint validation engine
 */

/**
 * Validation result severity levels
 */
export enum ValidationSeverity {
  ERROR = 'ERROR', // Blocking issue that must be fixed
  WARNING = 'WARNING', // Non-blocking issue that should be addressed
  INFO = 'INFO', // Informational message
}

/**
 * Category of validation rule
 */
export enum ValidationCategory {
  ELECTRICAL = 'ELECTRICAL',
  PHYSICAL = 'PHYSICAL',
  PROTOCOL = 'PROTOCOL',
  SAFETY = 'SAFETY',
}

/**
 * A single validation issue
 */
export interface ValidationIssue {
  /** Unique identifier for this issue type */
  code: string;

  /** Severity level */
  severity: ValidationSeverity;

  /** Category of validation */
  category: ValidationCategory;

  /** Human-readable message */
  message: string;

  /** Path to the entity that failed validation (e.g., "wire.123", "ecu.456") */
  entityPath: string;

  /** Entity ID */
  entityId: string;

  /** Entity type */
  entityType: 'wire' | 'ecu' | 'connector' | 'pin' | 'project';

  /** Additional context data */
  context?: Record<string, any>;

  /** Suggested fixes (optional) */
  suggestedFixes?: Array<{
    description: string;
    action: string;
    parameters?: Record<string, any>;
  }>;
}

/**
 * Result of running validation
 */
export interface ValidationResult {
  /** Whether validation passed (no errors) */
  valid: boolean;

  /** List of all issues found */
  issues: ValidationIssue[];

  /** Count of errors */
  errorCount: number;

  /** Count of warnings */
  warningCount: number;

  /** Count of info messages */
  infoCount: number;

  /** Timestamp when validation was run */
  timestamp: Date;

  /** Duration of validation in milliseconds */
  durationMs: number;
}

/**
 * Context passed to validation rules
 */
export interface ValidationContext {
  /** Project ID being validated */
  projectId: string;

  /** Full project data with all relationships */
  project?: any; // Will be typed properly when we integrate with repository

  /** Additional options */
  options?: {
    /** Include warnings in results */
    includeWarnings?: boolean;

    /** Include info messages in results */
    includeInfo?: boolean;

    /** Stop validation on first error */
    failFast?: boolean;

    /** Specific rules to run (if not specified, all rules run) */
    ruleFilter?: string[];
  };
}

/**
 * Base interface for all validation rules
 */
export interface ValidationRule {
  /** Unique identifier for this rule */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** Description of what this rule checks */
  readonly description: string;

  /** Category of validation */
  readonly category: ValidationCategory;

  /** Whether this rule is enabled by default */
  readonly enabled: boolean;

  /**
   * Execute the validation rule
   * @param context Validation context with project data
   * @returns Array of validation issues (empty if no issues)
   */
  validate(context: ValidationContext): Promise<ValidationIssue[]>;
}
