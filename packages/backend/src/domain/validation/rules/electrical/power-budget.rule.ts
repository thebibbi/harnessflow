/**
 * Power Budget Validation Rule
 *
 * Validates that total power consumption does not exceed available power budget
 */

import { BaseValidationRule } from '../../base-rule';
import {
  ValidationContext,
  ValidationIssue,
  ValidationCategory,
  ValidationSeverity,
} from '../../types';

/**
 * Default power safety margin (80% utilization max)
 */
const POWER_SAFETY_MARGIN = 0.8;

/**
 * Validates power budget for ECUs and power supplies
 */
export class PowerBudgetRule extends BaseValidationRule {
  constructor() {
    super(
      'elec-power-budget',
      'Power Budget Check',
      'Validates that total power consumption does not exceed available power budget',
      ValidationCategory.ELECTRICAL,
      true
    );
  }

  async validate(context: ValidationContext): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Get all ECUs from the project
    const ecus = context.project?.ecus || [];

    for (const ecu of ecus) {
      // Skip ECUs without electrical data
      if (!ecu.electrical) {
        continue;
      }

      // Get power supply capacity
      const powerSupply = ecu.electrical.powerSupply;
      if (!powerSupply || !powerSupply.maxPower) {
        // No power supply defined, skip
        continue;
      }

      const maxPower = powerSupply.maxPower; // Watts
      const availablePower = maxPower * POWER_SAFETY_MARGIN;

      // Calculate total power consumption from all connected wires
      let totalPowerDraw = 0;
      const connectedWires: any[] = [];

      // Get all connectors for this ECU
      const connectors = ecu.connectors || [];

      for (const connector of connectors) {
        const pins = connector.pins || [];

        for (const pin of pins) {
          // Get wires connected to this pin (as source)
          const wiresFrom = pin.wiresFrom || [];

          for (const wire of wiresFrom) {
            if (!wire.electrical) continue;

            const voltage = wire.electrical.voltage || 0;
            const current = wire.electrical.maxCurrent || 0;
            const power = voltage * current;

            totalPowerDraw += power;
            connectedWires.push({
              wireId: wire.id,
              wireName: wire.name,
              power,
              voltage,
              current,
            });
          }
        }
      }

      // Check if power draw exceeds available power
      if (totalPowerDraw > availablePower) {
        const utilization = ((totalPowerDraw / availablePower) * 100).toFixed(1);

        issues.push(
          this.createIssue(
            'POWER_BUDGET_EXCEEDED',
            `ECU ${ecu.name || ecu.id} exceeds power budget. ` +
              `Total draw of ${totalPowerDraw.toFixed(1)}W exceeds available ${availablePower.toFixed(1)}W ` +
              `(${utilization}% utilization).`,
            ecu.id,
            'ecu',
            ValidationSeverity.ERROR,
            {
              ecuId: ecu.id,
              ecuName: ecu.name,
              maxPower,
              availablePower,
              totalPowerDraw: parseFloat(totalPowerDraw.toFixed(1)),
              utilizationPercent: parseFloat(utilization),
              connectedWires: connectedWires.map((w) => ({
                id: w.wireId,
                name: w.wireName,
                power: parseFloat(w.power.toFixed(1)),
              })),
            },
            [
              {
                description: `Reduce total power consumption by ${(totalPowerDraw - availablePower).toFixed(1)}W`,
                action: 'REDUCE_POWER_DRAW',
                parameters: {
                  ecuId: ecu.id,
                  targetPower: availablePower,
                },
              },
              {
                description: 'Upgrade power supply capacity',
                action: 'UPGRADE_POWER_SUPPLY',
                parameters: {
                  ecuId: ecu.id,
                  requiredPower: Math.ceil(totalPowerDraw / POWER_SAFETY_MARGIN),
                },
              },
            ]
          )
        );
      } else if (totalPowerDraw > availablePower * 0.9) {
        // Warning if utilization is above 90%
        const utilization = ((totalPowerDraw / availablePower) * 100).toFixed(1);

        issues.push(
          this.createIssue(
            'POWER_BUDGET_HIGH',
            `ECU ${ecu.name || ecu.id} has high power utilization. ` +
              `Total draw of ${totalPowerDraw.toFixed(1)}W is close to available ${availablePower.toFixed(1)}W ` +
              `(${utilization}% utilization).`,
            ecu.id,
            'ecu',
            ValidationSeverity.WARNING,
            {
              ecuId: ecu.id,
              ecuName: ecu.name,
              maxPower,
              availablePower,
              totalPowerDraw: parseFloat(totalPowerDraw.toFixed(1)),
              utilizationPercent: parseFloat(utilization),
              connectedWires: connectedWires.map((w) => ({
                id: w.wireId,
                name: w.wireName,
                power: parseFloat(w.power.toFixed(1)),
              })),
            },
            [
              {
                description: 'Consider adding power margin for future expansion',
                action: 'UPGRADE_POWER_SUPPLY',
                parameters: {
                  ecuId: ecu.id,
                  requiredPower: Math.ceil((totalPowerDraw * 1.2) / POWER_SAFETY_MARGIN),
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
