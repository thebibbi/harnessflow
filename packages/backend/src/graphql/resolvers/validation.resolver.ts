/**
 * Validation GraphQL Resolver
 */

import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { ValidationService } from '../../domain/validation';
import { ValidationResultType, ValidationRuleType } from '../types/validation.types';
import { ValidationCategory } from '../../domain/validation/types';

@Resolver()
export class ValidationResolver {
  constructor(private readonly validationService: ValidationService) {}

  /**
   * Validate a project
   */
  @Query(() => ValidationResultType)
  async validateProject(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('includeWarnings', { type: () => Boolean, nullable: true, defaultValue: true })
    includeWarnings?: boolean,
    @Args('includeInfo', { type: () => Boolean, nullable: true, defaultValue: false })
    includeInfo?: boolean
  ): Promise<ValidationResultType> {
    return this.validationService.validateProject(projectId, {
      includeWarnings,
      includeInfo,
    }) as Promise<ValidationResultType>;
  }

  /**
   * Validate a project by category
   */
  @Query(() => ValidationResultType)
  async validateProjectByCategory(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('category', { type: () => String }) category: ValidationCategory,
    @Args('includeWarnings', { type: () => Boolean, nullable: true, defaultValue: true })
    includeWarnings?: boolean,
    @Args('includeInfo', { type: () => Boolean, nullable: true, defaultValue: false })
    includeInfo?: boolean
  ): Promise<ValidationResultType> {
    return this.validationService.validateByCategory(projectId, category, {
      includeWarnings,
      includeInfo,
    }) as Promise<ValidationResultType>;
  }

  /**
   * Get all validation rules
   */
  @Query(() => [ValidationRuleType])
  async validationRules(): Promise<ValidationRuleType[]> {
    return this.validationService.getRules() as ValidationRuleType[];
  }

  /**
   * Get validation rules by category
   */
  @Query(() => [ValidationRuleType])
  async validationRulesByCategory(
    @Args('category', { type: () => String }) category: ValidationCategory
  ): Promise<ValidationRuleType[]> {
    return this.validationService.getRulesByCategory(category) as ValidationRuleType[];
  }
}
