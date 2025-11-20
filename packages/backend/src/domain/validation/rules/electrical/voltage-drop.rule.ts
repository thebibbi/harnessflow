/**
 * Voltage Drop Validation Rule
 *
 * Validates that voltage drop along wires is within acceptable limits
 */

import { BaseValidationRule } from '../../base-rule';
import {
  ValidationContext,
  ValidationIssue,
  ValidationCategory,
  ValidationSeverity,
} from '../../types';

/**
 * Wire resistance per meter (ohms/m) for different AWG gauges
 * Based on copper wire at 20°C
 */
const WIRE_RESISTANCE_PER_METER: Record<number, number> = {
  // AWG: Resistance (Ω/m)
  30: 0.338,
  28: 0.213,
  26: 0.134,
  24: 0.0842,
  22: 0.053,
  20: 0.0333,
  18: 0.021,
  16: 0.0132,
  14: 0.00829,
  12: 0.00521,
  10: 0.00328,
  8: 0.00206,
  6: 0.0013,
  4: 0.000815,
  2: 0.000513,
  0: 0.000323,
};

/**
 * Maximum acceptable voltage drop percentages
 */
const MAX_VOLTAGE_DROP_PERCENT = {
  POWER: 3.0, // 3% for power distribution
  SIGNAL: 5.0, // 5% for signal lines (more tolerant)
  GROUND: 2.0, // 2% for ground returns (stricter)
};

/**
 * Validates voltage drop along wires
 */
export class VoltageDropRule extends BaseValidationRule {
  constructor() {
    super(
      'elec-voltage-drop',
      'Voltage Drop Check',
      'Validates that voltage drop along wires is within acceptable limits',
      ValidationCategory.ELECTRICAL,
      true
    );
  }

  async validate(context: ValidationContext): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Get all wires from the project
    const wires = context.project?.wires || [];

    for (const wire of wires) {
      // Skip wires without required data
      if (!wire.physical || !wire.electrical) {
        continue;
      }

      const gauge = wire.physical.gauge; // AWG
      const length = wire.physical.length; // meters
      const current = wire.electrical.maxCurrent; // Amperes
      const voltage = wire.electrical.voltage; // Volts
      const wireType = wire.electrical.type || 'SIGNAL'; // POWER, SIGNAL, GROUND

      // Skip if data is missing
      if (gauge == null || length == null || current == null || voltage == null) {
        continue;
      }

      // Skip if current or voltage is zero (no point checking)
      if (current === 0 || voltage === 0) {
        continue;
      }

      // Get wire resistance
      const resistancePerMeter = WIRE_RESISTANCE_PER_METER[gauge];

      if (!resistancePerMeter) {
        // Unknown wire gauge - already caught by ampacity rule
        continue;
      }

      // Calculate total resistance (account for round-trip for power wires)
      const totalResistance = resistancePerMeter * length * (wireType === 'POWER' ? 2 : 1);

      // Calculate voltage drop (V = I * R)
      const voltageDrop = current * totalResistance;

      // Calculate percentage drop
      const voltageDropPercent = (voltageDrop / voltage) * 100;

      // Get max acceptable drop based on wire type
      const maxDropPercent =
        MAX_VOLTAGE_DROP_PERCENT[wireType as keyof typeof MAX_VOLTAGE_DROP_PERCENT] ||
        MAX_VOLTAGE_DROP_PERCENT.SIGNAL;

      // Check if voltage drop exceeds limit
      if (voltageDropPercent > maxDropPercent) {
        issues.push(
          this.createIssue(
            'VOLTAGE_DROP_EXCESSIVE',
            `Wire ${wire.name || wire.id} has excessive voltage drop. ` +
              `Drop of ${voltageDrop.toFixed(2)}V (${voltageDropPercent.toFixed(1)}%) ` +
              `exceeds ${maxDropPercent}% limit for ${wireType} circuits.`,
            wire.id,
            'wire',
            ValidationSeverity.ERROR,
            {
              wireId: wire.id,
              wireName: wire.name,
              gauge,
              length,
              current,
              voltage,
              wireType,
              voltageDrop: parseFloat(voltageDrop.toFixed(2)),
              voltageDropPercent: parseFloat(voltageDropPercent.toFixed(1)),
              maxDropPercent,
              resistance: totalResistance,
            },
            [
              {
                description: `Increase wire gauge to ${this.getRecommendedGaugeForDrop(
                  length,
                  current,
                  voltage,
                  maxDropPercent,
                  wireType === 'POWER'
                )} AWG`,
                action: 'CHANGE_WIRE_GAUGE',
                parameters: {
                  wireId: wire.id,
                  newGauge: this.getRecommendedGaugeForDrop(
                    length,
                    current,
                    voltage,
                    maxDropPercent,
                    wireType === 'POWER'
                  ),
                },
              },
              {
                description: 'Reduce wire length (reroute)',
                action: 'REDUCE_WIRE_LENGTH',
                parameters: {
                  wireId: wire.id,
                  maxLength: this.getMaxLength(
                    gauge,
                    current,
                    voltage,
                    maxDropPercent,
                    wireType === 'POWER'
                  ),
                },
              },
            ]
          )
        );
      } else if (voltageDropPercent > maxDropPercent * 0.8) {
        // Warning if drop is above 80% of limit
        issues.push(
          this.createIssue(
            'VOLTAGE_DROP_HIGH',
            `Wire ${wire.name || wire.id} has high voltage drop. ` +
              `Drop of ${voltageDrop.toFixed(2)}V (${voltageDropPercent.toFixed(1)}%) ` +
              `is close to ${maxDropPercent}% limit for ${wireType} circuits.`,
            wire.id,
            'wire',
            ValidationSeverity.WARNING,
            {
              wireId: wire.id,
              wireName: wire.name,
              gauge,
              length,
              current,
              voltage,
              wireType,
              voltageDrop: parseFloat(voltageDrop.toFixed(2)),
              voltageDropPercent: parseFloat(voltageDropPercent.toFixed(1)),
              maxDropPercent,
            },
            [
              {
                description: `Consider increasing wire gauge to ${this.getRecommendedGaugeForDrop(
                  length,
                  current,
                  voltage,
                  maxDropPercent * 0.7, // Target 70% of limit
                  wireType === 'POWER'
                )} AWG for better margin`,
                action: 'CHANGE_WIRE_GAUGE',
                parameters: {
                  wireId: wire.id,
                  newGauge: this.getRecommendedGaugeForDrop(
                    length,
                    current,
                    voltage,
                    maxDropPercent * 0.7,
                    wireType === 'POWER'
                  ),
                },
              },
            ]
          )
        );
      }
    }

    return issues;
  }

  /**
   * Get recommended wire gauge for a given voltage drop requirement
   */
  private getRecommendedGaugeForDrop(
    length: number,
    current: number,
    voltage: number,
    maxDropPercent: number,
    isRoundTrip: boolean
  ): number {
    const maxDrop = (voltage * maxDropPercent) / 100;
    const maxResistance = maxDrop / current;
    const maxResistancePerMeter = maxResistance / (length * (isRoundTrip ? 2 : 1));

    // Find smallest gauge with low enough resistance
    for (const [gauge, resistance] of Object.entries(WIRE_RESISTANCE_PER_METER).sort(
      ([a], [b]) => parseInt(b) - parseInt(a) // Sort from largest to smallest AWG
    )) {
      if (resistance <= maxResistancePerMeter) {
        return parseInt(gauge);
      }
    }

    // If no gauge is sufficient, return the largest
    return 0;
  }

  /**
   * Calculate maximum wire length for given parameters
   */
  private getMaxLength(
    gauge: number,
    current: number,
    voltage: number,
    maxDropPercent: number,
    isRoundTrip: boolean
  ): number {
    const resistancePerMeter = WIRE_RESISTANCE_PER_METER[gauge];
    if (!resistancePerMeter) return 0;

    const maxDrop = (voltage * maxDropPercent) / 100;
    const maxResistance = maxDrop / current;
    const maxLength = maxResistance / (resistancePerMeter * (isRoundTrip ? 2 : 1));

    return Math.floor(maxLength * 10) / 10; // Round down to 1 decimal
  }
}
