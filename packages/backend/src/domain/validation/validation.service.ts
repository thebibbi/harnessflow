/**
 * Validation Service (Orchestrator)
 *
 * Coordinates execution of all validation rules and aggregates results
 */

import { Injectable, Logger } from '@nestjs/common';
import { ProjectRepository } from '../../database/repositories/project.repository';
import {
  ValidationContext,
  ValidationResult,
  ValidationRule,
  ValidationSeverity,
  ValidationCategory,
} from './types';

// Import all rules
import {
  WireAmpacityRule,
  VoltageCompatibilityRule,
  VoltageDropRule,
  PowerBudgetRule,
} from './rules/electrical';

import {
  ConnectorGenderRule,
  PinCountRule,
  EnvironmentalRatingRule,
  WireRoutingRule,
} from './rules/physical';

/**
 * Validation Service
 *
 * Central orchestrator for all validation rules
 */
@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private readonly rules: ValidationRule[] = [];

  constructor(private readonly projectRepo: ProjectRepository) {
    this.registerRules();
  }

  /**
   * Register all validation rules
   */
  private registerRules(): void {
    // Electrical rules
    this.rules.push(new WireAmpacityRule());
    this.rules.push(new VoltageCompatibilityRule());
    this.rules.push(new VoltageDropRule());
    this.rules.push(new PowerBudgetRule());

    // Physical rules
    this.rules.push(new ConnectorGenderRule());
    this.rules.push(new PinCountRule());
    this.rules.push(new EnvironmentalRatingRule());
    this.rules.push(new WireRoutingRule());

    this.logger.log(`✅ Registered ${this.rules.length} validation rules`);
  }

  /**
   * Validate a project
   *
   * @param projectId Project ID to validate
   * @param options Validation options
   * @returns Validation result with all issues
   */
  async validateProject(
    projectId: string,
    options?: ValidationContext['options']
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    this.logger.log(`🔍 Starting validation for project ${projectId}`);

    // Fetch project with all relationships
    // Note: Using 'any' to bypass strict Prisma types for nested includes
    const project = await (this.projectRepo as any).findById(projectId, {
      include: {
        ecus: {
          include: {
            connectors: {
              include: {
                pins: {
                  include: {
                    wiresFrom: true,
                    wiresTo: true,
                  },
                },
              },
            },
          },
        },
        wires: {
          include: {
            fromPin: {
              include: {
                connector: true,
              },
            },
            toPin: {
              include: {
                connector: true,
              },
            },
          },
        },
        features: true,
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Build validation context
    const context: ValidationContext = {
      projectId,
      project,
      options: {
        includeWarnings: true,
        includeInfo: false,
        failFast: false,
        ...options,
      },
    };

    // Filter rules based on options
    const activeRules = this.getActiveRules(context);

    this.logger.log(`📋 Running ${activeRules.length} validation rules`);

    // Execute all rules
    const allIssues = [];
    let stopExecution = false;

    for (const rule of activeRules) {
      if (stopExecution) break;

      try {
        this.logger.debug(`  ↳ Running ${rule.name} (${rule.id})`);

        const issues = await rule.validate(context);

        // Filter issues based on options
        const filteredIssues = issues.filter((issue) => {
          if (issue.severity === ValidationSeverity.ERROR) return true;
          if (issue.severity === ValidationSeverity.WARNING && context.options?.includeWarnings) {
            return true;
          }
          if (issue.severity === ValidationSeverity.INFO && context.options?.includeInfo) {
            return true;
          }
          return false;
        });

        allIssues.push(...filteredIssues);

        if (
          context.options?.failFast &&
          filteredIssues.some((i) => i.severity === ValidationSeverity.ERROR)
        ) {
          stopExecution = true;
          this.logger.warn(`⚠️  Stopping validation (fail-fast) due to errors in ${rule.name}`);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`❌ Error running rule ${rule.id}: ${errorMessage}`, errorStack);
        // Continue with other rules even if one fails
      }
    }

    // Count issues by severity
    const errorCount = allIssues.filter((i) => i.severity === ValidationSeverity.ERROR).length;
    const warningCount = allIssues.filter((i) => i.severity === ValidationSeverity.WARNING).length;
    const infoCount = allIssues.filter((i) => i.severity === ValidationSeverity.INFO).length;

    const durationMs = Date.now() - startTime;
    const valid = errorCount === 0;

    const result: ValidationResult = {
      valid,
      issues: allIssues,
      errorCount,
      warningCount,
      infoCount,
      timestamp: new Date(),
      durationMs,
    };

    this.logger.log(
      `✅ Validation complete in ${durationMs}ms: ` +
        `${errorCount} errors, ${warningCount} warnings, ${infoCount} info`
    );

    return result;
  }

  /**
   * Get active rules based on context options
   */
  private getActiveRules(context: ValidationContext): ValidationRule[] {
    let rules = this.rules.filter((r) => r.enabled);

    // Filter by rule IDs if specified
    if (context.options?.ruleFilter && context.options.ruleFilter.length > 0) {
      const filterSet = new Set(context.options.ruleFilter);
      rules = rules.filter((r) => filterSet.has(r.id));
    }

    return rules;
  }

  /**
   * Validate by category
   *
   * @param projectId Project ID to validate
   * @param category Category to validate
   * @param options Validation options
   * @returns Validation result with issues from specified category
   */
  async validateByCategory(
    projectId: string,
    category: ValidationCategory,
    options?: ValidationContext['options']
  ): Promise<ValidationResult> {
    const ruleIds = this.rules.filter((r) => r.category === category).map((r) => r.id);

    return this.validateProject(projectId, {
      ...options,
      ruleFilter: ruleIds,
    });
  }

  /**
   * Get all registered rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: ValidationCategory): ValidationRule[] {
    return this.rules.filter((r) => r.category === category);
  }

  /**
   * Get rule by ID
   */
  getRule(id: string): ValidationRule | undefined {
    return this.rules.find((r) => r.id === id);
  }
}
