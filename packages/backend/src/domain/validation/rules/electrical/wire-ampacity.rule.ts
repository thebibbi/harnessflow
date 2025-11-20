/**
 * Wire Ampacity Validation Rule
 *
 * Validates that wire gauge can safely carry the specified current
 */

import { BaseValidationRule } from '../../base-rule';
import {
  ValidationContext,
  ValidationIssue,
  ValidationCategory,
  ValidationSeverity,
} from '../../types';

/**
 * Standard wire gauge ampacity ratings (AWG)
 * Based on chassis wiring (typically 60°C ambient, 90°C conductor temp)
 */
const WIRE_AMPACITY_TABLE: Record<number, number> = {
  // AWG: Max Current (Amps)
  30: 0.5,
  28: 0.8,
  26: 1.3,
  24: 2.1,
  22: 3.0,
  20: 5.0,
  18: 8.0,
  16: 13.0,
  14: 20.0,
  12: 25.0,
  10: 40.0,
  8: 60.0,
  6: 80.0,
  4: 110.0,
  2: 150.0,
  0: 200.0,
};

/**
 * Safety derating factor (typically 80% of max capacity)
 */
const DERATING_FACTOR = 0.8;

/**
 * Validates wire ampacity (current carrying capacity)
 */
export class WireAmpacityRule extends BaseValidationRule {
  constructor() {
    super(
      'elec-wire-ampacity',
      'Wire Ampacity Check',
      'Validates that wire gauge can safely carry the specified current',
      ValidationCategory.ELECTRICAL,
      true
    );
  }

  async validate(context: ValidationContext): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Get all wires from the project
    const wires = context.project?.wires || [];

    for (const wire of wires) {
      // Skip wires without physical/electrical data
      if (!wire.physical || !wire.electrical) {
        continue;
      }

      const gauge = wire.physical.gauge; // AWG
      const current = wire.electrical.maxCurrent; // Amperes

      // Skip if data is missing
      if (gauge == null || current == null) {
        continue;
      }

      // Get max ampacity for this gauge
      const maxAmpacity = WIRE_AMPACITY_TABLE[gauge];

      if (!maxAmpacity) {
        // Unknown wire gauge
        issues.push(
          this.createIssue(
            'WIRE_UNKNOWN_GAUGE',
            `Wire ${wire.name || wire.id} has unknown or unsupported gauge: ${gauge} AWG`,
            wire.id,
            'wire',
            ValidationSeverity.WARNING,
            { gauge, current }
          )
        );
        continue;
      }

      // Apply derating factor
      const derated = maxAmpacity * DERATING_FACTOR;

      // Check if current exceeds capacity
      if (current > derated) {
        const utilization = ((current / derated) * 100).toFixed(1);

        issues.push(
          this.createIssue(
            'WIRE_OVERCURRENT',
            `Wire ${wire.name || wire.id} exceeds safe current capacity. ` +
              `Carrying ${current}A but gauge ${gauge} AWG is rated for ${derated.toFixed(1)}A (${utilization}% utilization)`,
            wire.id,
            'wire',
            ValidationSeverity.ERROR,
            {
              wireId: wire.id,
              wireName: wire.name,
              gauge,
              maxAmpacity,
              deratedAmpacity: derated,
              currentLoad: current,
              utilizationPercent: parseFloat(utilization),
            },
            [
              {
                description: `Increase wire gauge to ${this.getRecommendedGauge(current)} AWG`,
                action: 'CHANGE_WIRE_GAUGE',
                parameters: {
                  wireId: wire.id,
                  newGauge: this.getRecommendedGauge(current),
                },
              },
              {
                description: 'Reduce current load',
                action: 'REDUCE_CURRENT',
                parameters: {
                  wireId: wire.id,
                  maxCurrent: derated,
                },
              },
            ]
          )
        );
      } else if (current > derated * 0.9) {
        // Warning if utilization is over 90%
        const utilization = ((current / derated) * 100).toFixed(1);

        issues.push(
          this.createIssue(
            'WIRE_HIGH_UTILIZATION',
            `Wire ${wire.name || wire.id} has high current utilization. ` +
              `Carrying ${current}A with gauge ${gauge} AWG rated for ${derated.toFixed(1)}A (${utilization}% utilization)`,
            wire.id,
            'wire',
            ValidationSeverity.WARNING,
            {
              wireId: wire.id,
              wireName: wire.name,
              gauge,
              deratedAmpacity: derated,
              currentLoad: current,
              utilizationPercent: parseFloat(utilization),
            },
            [
              {
                description: `Consider increasing wire gauge to ${this.getRecommendedGauge(current * 1.2)} AWG for better margin`,
                action: 'CHANGE_WIRE_GAUGE',
                parameters: {
                  wireId: wire.id,
                  newGauge: this.getRecommendedGauge(current * 1.2),
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
   * Get recommended wire gauge for a given current
   */
  private getRecommendedGauge(current: number): number {
    // Add safety margin
    const requiredCapacity = current / DERATING_FACTOR;

    // Find smallest gauge that can handle the current
    for (const [gauge, ampacity] of Object.entries(WIRE_AMPACITY_TABLE).sort(
      ([a], [b]) => parseInt(b) - parseInt(a) // Sort from largest to smallest AWG
    )) {
      if (ampacity >= requiredCapacity) {
        return parseInt(gauge);
      }
    }

    // If no gauge is sufficient, return the largest
    return 0;
  }
}
