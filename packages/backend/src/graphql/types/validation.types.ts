/**
 * GraphQL Types for Validation
 */

import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { ValidationSeverity, ValidationCategory } from '../../domain/validation/types';

// Register enums with GraphQL
registerEnumType(ValidationSeverity, {
  name: 'ValidationSeverity',
  description: 'Severity level of a validation issue',
});

registerEnumType(ValidationCategory, {
  name: 'ValidationCategory',
  description: 'Category of validation rule',
});

/**
 * Suggested fix for a validation issue
 */
@ObjectType()
export class SuggestedFixType {
  @Field()
  description!: string;

  @Field()
  action!: string;

  @Field(() => GraphQLJSON, { nullable: true })
  parameters?: Record<string, any>;
}

/**
 * A single validation issue
 */
@ObjectType()
export class ValidationIssueType {
  @Field()
  code!: string;

  @Field(() => ValidationSeverity)
  severity!: ValidationSeverity;

  @Field(() => ValidationCategory)
  category!: ValidationCategory;

  @Field()
  message!: string;

  @Field()
  entityPath!: string;

  @Field()
  entityId!: string;

  @Field()
  entityType!: string;

  @Field(() => GraphQLJSON, { nullable: true })
  context?: Record<string, any>;

  @Field(() => [SuggestedFixType], { nullable: true })
  suggestedFixes?: SuggestedFixType[];
}

/**
 * Result of validation
 */
@ObjectType()
export class ValidationResultType {
  @Field()
  valid!: boolean;

  @Field(() => [ValidationIssueType])
  issues!: ValidationIssueType[];

  @Field(() => Int)
  errorCount!: number;

  @Field(() => Int)
  warningCount!: number;

  @Field(() => Int)
  infoCount!: number;

  @Field()
  timestamp!: Date;

  @Field(() => Int)
  durationMs!: number;
}

/**
 * Validation rule info
 */
@ObjectType()
export class ValidationRuleType {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field(() => ValidationCategory)
  category!: ValidationCategory;

  @Field()
  enabled!: boolean;
}
