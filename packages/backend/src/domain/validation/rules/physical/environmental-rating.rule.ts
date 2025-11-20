/**
 * Environmental Rating Validation Rule
 *
 * Validates that connectors have appropriate IP ratings for their environment
 */

import { BaseValidationRule } from '../../base-rule';
import {
  ValidationContext,
  ValidationIssue,
  ValidationCategory,
  ValidationSeverity,
} from '../../types';

/**
 * Minimum IP rating requirements by environment
 */
const ENVIRONMENT_IP_REQUIREMENTS: Record<string, { rating: string; description: string }> = {
  INTERIOR: { rating: 'IP40', description: 'Basic protection from solid objects' },
  ENGINE_BAY: { rating: 'IP67', description: 'Dust-tight and protected from immersion' },
  UNDERBODY: { rating: 'IP68', description: 'Dust-tight and protected from continuous immersion' },
  EXTERIOR: { rating: 'IP66', description: 'Dust-tight and protected from powerful water jets' },
  SEALED: { rating: 'IP69K', description: 'High-pressure, high-temperature wash protection' },
};

/**
 * Parse IP rating (e.g., "IP67" -> { solid: 6, liquid: 7 })
 */
function parseIPRating(rating: string): { solid: number; liquid: number } | null {
  const match = rating.match(/IP(\d)(\d)/i);
  if (!match) return null;

  return {
    solid: parseInt(match[1]),
    liquid: parseInt(match[2]),
  };
}

/**
 * Compare two IP ratings
 * Returns true if actual >= required
 */
function meetsIPRating(actual: string, required: string): boolean {
  const actualParsed = parseIPRating(actual);
  const requiredParsed = parseIPRating(required);

  if (!actualParsed || !requiredParsed) return false;

  return actualParsed.solid >= requiredParsed.solid && actualParsed.liquid >= requiredParsed.liquid;
}

/**
 * Validates environmental rating (IP rating) of connectors
 */
export class EnvironmentalRatingRule extends BaseValidationRule {
  constructor() {
    super(
      'phys-environmental-rating',
      'Environmental Rating Check',
      'Validates that connectors have appropriate IP ratings for their environment',
      ValidationCategory.PHYSICAL,
      true
    );
  }

  async validate(context: ValidationContext): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Get all ECUs from the project
    const ecus = context.project?.ecus || [];

    for (const ecu of ecus) {
      const connectors = ecu.connectors || [];

      for (const connector of connectors) {
        // Get connector physical properties
        const physical = connector.physical;
        if (!physical) continue;

        const environment = (physical.environment || '').toUpperCase();
        const ipRating = (physical.ipRating || '').toUpperCase();

        // Skip if no environment specified
        if (!environment) continue;

        // Get required IP rating for this environment
        const requirement = ENVIRONMENT_IP_REQUIREMENTS[environment];

        if (!requirement) {
          // Unknown environment
          issues.push(
            this.createIssue(
              'UNKNOWN_ENVIRONMENT',
              `Connector ${connector.name || connector.id} has unknown environment type: ${environment}`,
              connector.id,
              'connector',
              ValidationSeverity.WARNING,
              {
                connectorId: connector.id,
                connectorName: connector.name,
                environment,
              }
            )
          );
          continue;
        }

        // Check if IP rating is specified
        if (!ipRating) {
          issues.push(
            this.createIssue(
              'MISSING_IP_RATING',
              `Connector ${connector.name || connector.id} in ${environment} environment ` +
                `requires IP rating (minimum ${requirement.rating})`,
              connector.id,
              'connector',
              ValidationSeverity.ERROR,
              {
                connectorId: connector.id,
                connectorName: connector.name,
                environment,
                requiredRating: requirement.rating,
              },
              [
                {
                  description: `Specify IP rating (minimum ${requirement.rating})`,
                  action: 'SET_IP_RATING',
                  parameters: {
                    connectorId: connector.id,
                    ipRating: requirement.rating,
                  },
                },
              ]
            )
          );
          continue;
        }

        // Check if IP rating meets requirement
        if (!meetsIPRating(ipRating, requirement.rating)) {
          issues.push(
            this.createIssue(
              'INSUFFICIENT_IP_RATING',
              `Connector ${connector.name || connector.id} has insufficient IP rating. ` +
                `Environment ${environment} requires ${requirement.rating} (${requirement.description}) ` +
                `but connector is rated ${ipRating}`,
              connector.id,
              'connector',
              ValidationSeverity.ERROR,
              {
                connectorId: connector.id,
                connectorName: connector.name,
                environment,
                currentRating: ipRating,
                requiredRating: requirement.rating,
                requirement: requirement.description,
              },
              [
                {
                  description: `Upgrade to connector with ${requirement.rating} or higher rating`,
                  action: 'UPGRADE_IP_RATING',
                  parameters: {
                    connectorId: connector.id,
                    requiredRating: requirement.rating,
                  },
                },
                {
                  description: 'Move connector to more protected environment',
                  action: 'CHANGE_ENVIRONMENT',
                  parameters: {
                    connectorId: connector.id,
                    currentEnvironment: environment,
                  },
                },
              ]
            )
          );
        }
      }
    }

    return issues;
  }
}
