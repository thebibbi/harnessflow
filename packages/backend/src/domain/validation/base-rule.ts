/**
 * Base Validation Rule
 *
 * Abstract base class for all validation rules
 */

import { ValidationRule, ValidationContext, ValidationIssue, ValidationCategory } from './types';

/**
 * Abstract base class for validation rules
 */
export abstract class BaseValidationRule implements ValidationRule {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly category: ValidationCategory,
    public readonly enabled: boolean = true
  ) {}

  /**
   * Execute the validation rule
   * Must be implemented by subclasses
   */
  abstract validate(context: ValidationContext): Promise<ValidationIssue[]>;

  /**
   * Helper method to create a validation issue
   */
  protected createIssue(
    code: string,
    message: string,
    entityId: string,
    entityType: ValidationIssue['entityType'],
    severity: ValidationIssue['severity'],
    context?: Record<string, any>,
    suggestedFixes?: ValidationIssue['suggestedFixes']
  ): ValidationIssue {
    return {
      code,
      severity,
      category: this.category,
      message,
      entityPath: `${entityType}.${entityId}`,
      entityId,
      entityType,
      context,
      suggestedFixes,
    };
  }
}
