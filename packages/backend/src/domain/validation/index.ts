/**
 * Validation Domain
 *
 * Exports validation types, services, and rules
 */

// Types
export * from './types';

// Base rule
export * from './base-rule';

// Service
export { ValidationService } from './validation.service';

// Module
export { ValidationModule } from './validation.module';

// Rules (for testing or advanced usage)
export * from './rules/electrical';
export * from './rules/physical';
