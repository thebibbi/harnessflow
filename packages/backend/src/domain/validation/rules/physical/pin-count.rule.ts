/**
 * Pin Count Validation Rule
 *
 * Validates that connectors have the correct number of pins and all pins are defined
 */

import { BaseValidationRule } from '../../base-rule';
import {
  ValidationContext,
  ValidationIssue,
  ValidationCategory,
  ValidationSeverity,
} from '../../types';

/**
 * Validates connector pin count consistency
 */
export class PinCountRule extends BaseValidationRule {
  constructor() {
    super(
      'phys-pin-count',
      'Pin Count Check',
      'Validates that connectors have the correct number of pins and all pins are defined',
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
        const declaredPinCount = connector.pinCount;
        const pins = connector.pins || [];
        const actualPinCount = pins.length;

        // Check if declared pin count matches actual pin count
        if (declaredPinCount !== actualPinCount) {
          issues.push(
            this.createIssue(
              'PIN_COUNT_MISMATCH',
              `Connector ${connector.name || connector.id} declares ${declaredPinCount} pins ` +
                `but has ${actualPinCount} pins defined.`,
              connector.id,
              'connector',
              actualPinCount < declaredPinCount
                ? ValidationSeverity.ERROR
                : ValidationSeverity.WARNING,
              {
                connectorId: connector.id,
                connectorName: connector.name,
                declaredPinCount,
                actualPinCount,
                missingPins: declaredPinCount - actualPinCount,
              },
              actualPinCount < declaredPinCount
                ? [
                    {
                      description: `Add ${declaredPinCount - actualPinCount} missing pin(s)`,
                      action: 'ADD_MISSING_PINS',
                      parameters: {
                        connectorId: connector.id,
                        count: declaredPinCount - actualPinCount,
                      },
                    },
                    {
                      description: `Update declared pin count to ${actualPinCount}`,
                      action: 'UPDATE_PIN_COUNT',
                      parameters: {
                        connectorId: connector.id,
                        pinCount: actualPinCount,
                      },
                    },
                  ]
                : [
                    {
                      description: `Update declared pin count to ${actualPinCount}`,
                      action: 'UPDATE_PIN_COUNT',
                      parameters: {
                        connectorId: connector.id,
                        pinCount: actualPinCount,
                      },
                    },
                  ]
            )
          );
        }

        // Check for duplicate pin numbers
        const pinNumbers = new Set<string>();
        const duplicates = new Set<string>();

        for (const pin of pins) {
          if (pinNumbers.has(pin.pinNumber)) {
            duplicates.add(pin.pinNumber);
          }
          pinNumbers.add(pin.pinNumber);
        }

        if (duplicates.size > 0) {
          issues.push(
            this.createIssue(
              'DUPLICATE_PIN_NUMBERS',
              `Connector ${connector.name || connector.id} has duplicate pin numbers: ${Array.from(
                duplicates
              ).join(', ')}`,
              connector.id,
              'connector',
              ValidationSeverity.ERROR,
              {
                connectorId: connector.id,
                connectorName: connector.name,
                duplicatePins: Array.from(duplicates),
              },
              [
                {
                  description: 'Renumber duplicate pins',
                  action: 'RENUMBER_PINS',
                  parameters: {
                    connectorId: connector.id,
                    duplicates: Array.from(duplicates),
                  },
                },
              ]
            )
          );
        }

        // Check for pins with no connections (informational)
        const unconnectedPins = pins.filter((pin: any) => {
          const wiresFrom = pin.wiresFrom || [];
          const wiresTo = pin.wiresTo || [];
          return wiresFrom.length === 0 && wiresTo.length === 0;
        });

        if (unconnectedPins.length > 0 && context.options?.includeInfo) {
          issues.push(
            this.createIssue(
              'UNCONNECTED_PINS',
              `Connector ${connector.name || connector.id} has ${
                unconnectedPins.length
              } unconnected pin(s): ${unconnectedPins.map((p: any) => p.pinNumber).join(', ')}`,
              connector.id,
              'connector',
              ValidationSeverity.INFO,
              {
                connectorId: connector.id,
                connectorName: connector.name,
                unconnectedPinCount: unconnectedPins.length,
                unconnectedPins: unconnectedPins.map((p: any) => ({
                  pinNumber: p.pinNumber,
                  label: p.label,
                })),
              }
            )
          );
        }
      }
    }

    return issues;
  }
}
