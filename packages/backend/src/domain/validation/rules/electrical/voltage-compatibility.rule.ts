/**
 * Voltage Compatibility Validation Rule
 *
 * Validates that connected components have compatible voltage levels
 */

import { BaseValidationRule } from '../../base-rule';
import {
  ValidationContext,
  ValidationIssue,
  ValidationCategory,
  ValidationSeverity,
} from '../../types';

/**
 * Voltage tolerance (±10% is typical for automotive)
 */
const VOLTAGE_TOLERANCE = 0.1;

/**
 * Validates voltage compatibility between connected components
 */
export class VoltageCompatibilityRule extends BaseValidationRule {
  constructor() {
    super(
      'elec-voltage-compat',
      'Voltage Compatibility Check',
      'Validates that connected components have compatible voltage levels',
      ValidationCategory.ELECTRICAL,
      true
    );
  }

  async validate(context: ValidationContext): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Get all wires from the project
    const wires = context.project?.wires || [];

    for (const wire of wires) {
      // Skip wires without electrical data or connections
      if (!wire.electrical || !wire.fromPin || !wire.toPin) {
        continue;
      }

      const wireVoltage = wire.electrical.voltage;

      // Skip if wire voltage not specified
      if (wireVoltage == null) {
        continue;
      }

      // Get source and destination pins with their parent connectors/ECUs
      const fromPin = wire.fromPin;
      const toPin = wire.toPin;

      // Check source voltage compatibility
      const sourceVoltage = this.getPinVoltage(fromPin);
      if (sourceVoltage != null && !this.isVoltageCompatible(sourceVoltage, wireVoltage)) {
        issues.push(
          this.createIssue(
            'VOLTAGE_MISMATCH_SOURCE',
            `Wire ${wire.name || wire.id} voltage (${wireVoltage}V) is incompatible with source pin voltage (${sourceVoltage}V). ` +
              `Difference exceeds ${VOLTAGE_TOLERANCE * 100}% tolerance.`,
            wire.id,
            'wire',
            ValidationSeverity.ERROR,
            {
              wireId: wire.id,
              wireName: wire.name,
              wireVoltage,
              sourceVoltage,
              sourcePinId: fromPin.id,
              sourcePinLabel: fromPin.label,
              tolerance: VOLTAGE_TOLERANCE,
            },
            [
              {
                description: `Update wire voltage to ${sourceVoltage}V`,
                action: 'UPDATE_WIRE_VOLTAGE',
                parameters: {
                  wireId: wire.id,
                  voltage: sourceVoltage,
                },
              },
            ]
          )
        );
      }

      // Check destination voltage compatibility
      const destVoltage = this.getPinVoltage(toPin);
      if (destVoltage != null && !this.isVoltageCompatible(destVoltage, wireVoltage)) {
        issues.push(
          this.createIssue(
            'VOLTAGE_MISMATCH_DEST',
            `Wire ${wire.name || wire.id} voltage (${wireVoltage}V) is incompatible with destination pin voltage (${destVoltage}V). ` +
              `Difference exceeds ${VOLTAGE_TOLERANCE * 100}% tolerance.`,
            wire.id,
            'wire',
            ValidationSeverity.ERROR,
            {
              wireId: wire.id,
              wireName: wire.name,
              wireVoltage,
              destVoltage,
              destPinId: toPin.id,
              destPinLabel: toPin.label,
              tolerance: VOLTAGE_TOLERANCE,
            },
            [
              {
                description: `Update wire voltage to ${destVoltage}V`,
                action: 'UPDATE_WIRE_VOLTAGE',
                parameters: {
                  wireId: wire.id,
                  voltage: destVoltage,
                },
              },
            ]
          )
        );
      }

      // Check source and destination compatibility
      if (sourceVoltage != null && destVoltage != null) {
        if (!this.isVoltageCompatible(sourceVoltage, destVoltage)) {
          issues.push(
            this.createIssue(
              'VOLTAGE_MISMATCH_PINS',
              `Source pin voltage (${sourceVoltage}V) is incompatible with destination pin voltage (${destVoltage}V) ` +
                `on wire ${wire.name || wire.id}. Difference exceeds ${VOLTAGE_TOLERANCE * 100}% tolerance.`,
              wire.id,
              'wire',
              ValidationSeverity.ERROR,
              {
                wireId: wire.id,
                wireName: wire.name,
                sourceVoltage,
                destVoltage,
                sourcePinId: fromPin.id,
                destPinId: toPin.id,
                tolerance: VOLTAGE_TOLERANCE,
              },
              [
                {
                  description: 'Add voltage regulator or level shifter',
                  action: 'ADD_VOLTAGE_REGULATOR',
                  parameters: {
                    wireId: wire.id,
                    inputVoltage: sourceVoltage,
                    outputVoltage: destVoltage,
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

  /**
   * Get voltage from pin capabilities
   */
  private getPinVoltage(pin: any): number | null {
    if (!pin.capabilities) {
      return null;
    }

    // Check for voltage in capabilities
    const voltage = pin.capabilities.voltage || pin.capabilities.nominalVoltage;

    return typeof voltage === 'number' ? voltage : null;
  }

  /**
   * Check if two voltages are compatible within tolerance
   */
  private isVoltageCompatible(v1: number, v2: number): boolean {
    const diff = Math.abs(v1 - v2);
    const avg = (v1 + v2) / 2;
    const percentDiff = diff / avg;

    return percentDiff <= VOLTAGE_TOLERANCE;
  }
}
