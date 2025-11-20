/**
 * Connector Gender Compatibility Validation Rule
 *
 * Validates that connected connectors have compatible genders (male/female)
 */

import { BaseValidationRule } from '../../base-rule';
import {
  ValidationContext,
  ValidationIssue,
  ValidationCategory,
  ValidationSeverity,
} from '../../types';

/**
 * Valid gender pairings
 */
const VALID_GENDER_PAIRS: Record<string, string[]> = {
  MALE: ['FEMALE'],
  FEMALE: ['MALE'],
  HERMAPHRODITIC: ['HERMAPHRODITIC'], // Can connect to itself
  GENDERLESS: ['GENDERLESS', 'MALE', 'FEMALE'], // Universal compatibility
};

/**
 * Validates connector gender compatibility
 */
export class ConnectorGenderRule extends BaseValidationRule {
  constructor() {
    super(
      'phys-connector-gender',
      'Connector Gender Check',
      'Validates that connected connectors have compatible genders (male/female)',
      ValidationCategory.PHYSICAL,
      true
    );
  }

  async validate(context: ValidationContext): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Get all wires from the project
    const wires = context.project?.wires || [];

    for (const wire of wires) {
      // Skip wires without both endpoints
      if (!wire.fromPin || !wire.toPin) {
        continue;
      }

      const fromPin = wire.fromPin;
      const toPin = wire.toPin;

      // Get parent connectors
      const fromConnector = fromPin.connector;
      const toConnector = toPin.connector;

      if (!fromConnector || !toConnector) {
        continue;
      }

      const fromGender = (fromConnector.gender || '').toUpperCase();
      const toGender = (toConnector.gender || '').toUpperCase();

      // Skip if gender not specified
      if (!fromGender || !toGender) {
        continue;
      }

      // Check if genders are compatible
      const validPairs = VALID_GENDER_PAIRS[fromGender];

      if (!validPairs) {
        // Unknown gender type
        issues.push(
          this.createIssue(
            'CONNECTOR_UNKNOWN_GENDER',
            `Connector ${fromConnector.name || fromConnector.id} has unknown gender: ${fromGender}`,
            fromConnector.id,
            'connector',
            ValidationSeverity.WARNING,
            {
              connectorId: fromConnector.id,
              connectorName: fromConnector.name,
              gender: fromGender,
            }
          )
        );
        continue;
      }

      if (!validPairs.includes(toGender)) {
        // Incompatible genders
        issues.push(
          this.createIssue(
            'CONNECTOR_GENDER_MISMATCH',
            `Wire ${wire.name || wire.id} connects incompatible connector genders. ` +
              `Source connector ${fromConnector.name || fromConnector.id} (${fromGender}) ` +
              `cannot mate with destination connector ${toConnector.name || toConnector.id} (${toGender}).`,
            wire.id,
            'wire',
            ValidationSeverity.ERROR,
            {
              wireId: wire.id,
              wireName: wire.name,
              fromConnectorId: fromConnector.id,
              fromConnectorName: fromConnector.name,
              fromGender,
              toConnectorId: toConnector.id,
              toConnectorName: toConnector.name,
              toGender,
            },
            [
              {
                description: `Change ${fromConnector.name || 'source'} connector to ${
                  toGender === 'MALE' ? 'FEMALE' : 'MALE'
                }`,
                action: 'CHANGE_CONNECTOR_GENDER',
                parameters: {
                  connectorId: fromConnector.id,
                  newGender: toGender === 'MALE' ? 'FEMALE' : 'MALE',
                },
              },
              {
                description: `Change ${toConnector.name || 'destination'} connector to ${
                  fromGender === 'MALE' ? 'FEMALE' : 'MALE'
                }`,
                action: 'CHANGE_CONNECTOR_GENDER',
                parameters: {
                  connectorId: toConnector.id,
                  newGender: fromGender === 'MALE' ? 'FEMALE' : 'MALE',
                },
              },
            ]
          )
        );
      }
    }

    return issues;
  }
}
