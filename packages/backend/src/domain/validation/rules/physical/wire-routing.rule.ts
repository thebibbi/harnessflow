/**
 * Wire Routing Validation Rule
 *
 * Validates wire routing feasibility (length limits, bend radius)
 */

import { BaseValidationRule } from '../../base-rule';
import {
  ValidationContext,
  ValidationIssue,
  ValidationCategory,
  ValidationSeverity,
} from '../../types';

/**
 * Maximum practical wire length by gauge (meters)
 * Beyond this, consider using intermediate splices or relays
 */
const MAX_PRACTICAL_LENGTH: Record<number, number> = {
  30: 2.0,
  28: 3.0,
  26: 4.0,
  24: 5.0,
  22: 6.0,
  20: 8.0,
  18: 10.0,
  16: 12.0,
  14: 15.0,
  12: 20.0,
  10: 25.0,
  8: 30.0,
  6: 35.0,
  4: 40.0,
  2: 50.0,
  0: 60.0,
};

/**
 * Minimum bend radius (multiple of wire diameter)
 * Typical automotive standard is 4x wire diameter
 */
const MIN_BEND_RADIUS_MULTIPLIER = 4;

/**
 * Wire diameter by AWG gauge (mm)
 */
const WIRE_DIAMETER: Record<number, number> = {
  30: 0.254,
  28: 0.321,
  26: 0.405,
  24: 0.511,
  22: 0.644,
  20: 0.812,
  18: 1.024,
  16: 1.291,
  14: 1.628,
  12: 2.053,
  10: 2.588,
  8: 3.264,
  6: 4.115,
  4: 5.189,
  2: 6.544,
  0: 8.252,
};

/**
 * Validates wire routing feasibility
 */
export class WireRoutingRule extends BaseValidationRule {
  constructor() {
    super(
      'phys-wire-routing',
      'Wire Routing Check',
      'Validates wire routing feasibility (length limits, bend radius)',
      ValidationCategory.PHYSICAL,
      true
    );
  }

  async validate(context: ValidationContext): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Get all wires from the project
    const wires = context.project?.wires || [];

    for (const wire of wires) {
      // Skip wires without physical data
      if (!wire.physical) continue;

      const gauge = wire.physical.gauge;
      const length = wire.physical.length; // meters
      const routing = wire.routing;

      // Check wire length
      if (gauge != null && length != null) {
        const maxLength = MAX_PRACTICAL_LENGTH[gauge];

        if (maxLength && length > maxLength) {
          issues.push(
            this.createIssue(
              'WIRE_LENGTH_EXCESSIVE',
              `Wire ${wire.name || wire.id} exceeds practical length limit. ` +
                `Length of ${length.toFixed(1)}m exceeds ${maxLength.toFixed(1)}m limit for ${gauge} AWG wire. ` +
                `Consider using intermediate splices or relays.`,
              wire.id,
              'wire',
              ValidationSeverity.WARNING,
              {
                wireId: wire.id,
                wireName: wire.name,
                gauge,
                length,
                maxLength,
              },
              [
                {
                  description: 'Add intermediate splice or junction box',
                  action: 'ADD_SPLICE',
                  parameters: {
                    wireId: wire.id,
                  },
                },
                {
                  description: 'Add relay to reduce wire run',
                  action: 'ADD_RELAY',
                  parameters: {
                    wireId: wire.id,
                  },
                },
              ]
            )
          );
        }
      }

      // Check bend radius if routing information is available
      if (routing && routing.bends && gauge != null) {
        const wireDiameter = WIRE_DIAMETER[gauge];

        if (wireDiameter) {
          const minBendRadius = wireDiameter * MIN_BEND_RADIUS_MULTIPLIER;

          for (let i = 0; i < routing.bends.length; i++) {
            const bend = routing.bends[i];
            const bendRadius = bend.radius; // mm

            if (bendRadius != null && bendRadius < minBendRadius) {
              issues.push(
                this.createIssue(
                  'BEND_RADIUS_TOO_SMALL',
                  `Wire ${wire.name || wire.id} has bend ${i + 1} with radius ${bendRadius.toFixed(1)}mm, ` +
                    `which is below minimum ${minBendRadius.toFixed(1)}mm for ${gauge} AWG wire. ` +
                    `This may cause wire damage or premature failure.`,
                  wire.id,
                  'wire',
                  ValidationSeverity.ERROR,
                  {
                    wireId: wire.id,
                    wireName: wire.name,
                    gauge,
                    bendIndex: i,
                    bendRadius,
                    minBendRadius,
                    wireDiameter,
                  },
                  [
                    {
                      description: `Increase bend radius to at least ${minBendRadius.toFixed(1)}mm`,
                      action: 'INCREASE_BEND_RADIUS',
                      parameters: {
                        wireId: wire.id,
                        bendIndex: i,
                        minRadius: minBendRadius,
                      },
                    },
                  ]
                )
              );
            }
          }
        }
      }

      // Check for routing conflicts if viaPoints are specified
      if (routing && routing.viaPoints && routing.viaPoints.length > 20) {
        issues.push(
          this.createIssue(
            'EXCESSIVE_ROUTING_COMPLEXITY',
            `Wire ${wire.name || wire.id} has ${routing.viaPoints.length} routing points. ` +
              `This indicates an overly complex route that may be difficult to manufacture.`,
            wire.id,
            'wire',
            ValidationSeverity.WARNING,
            {
              wireId: wire.id,
              wireName: wire.name,
              viaPointCount: routing.viaPoints.length,
            },
            [
              {
                description: 'Simplify wire route',
                action: 'SIMPLIFY_ROUTE',
                parameters: {
                  wireId: wire.id,
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
