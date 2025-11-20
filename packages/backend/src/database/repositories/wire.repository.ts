import { Injectable } from '@nestjs/common';
import { Wire, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { BaseRepository, QueryOptions } from '../base.repository';

/**
 * WireRepository
 *
 * Handles database operations for Wire entities.
 * Supports complex endpoint queries and path analysis.
 *
 * Features:
 * - Find wires by endpoints (from/to pins)
 * - Query wires by gauge, color, length
 * - Path analysis between components
 * - Bundle and routing queries
 */
@Injectable()
export class WireRepository implements BaseRepository<Wire> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find wire by ID
   */
  async findById(id: string, includeRelations = true): Promise<Wire | null> {
    return this.prisma.wire.findUnique({
      where: { id },
      include: includeRelations ? this.getDefaultIncludes() : undefined,
    });
  }

  /**
   * Find multiple wires
   */
  async findMany(query?: QueryOptions<Wire>): Promise<Wire[]> {
    const options: any = {
      where: query?.where,
      orderBy: query?.orderBy || { createdAt: 'desc' },
      skip: query?.skip,
      take: query?.take,
    };

    if (query?.select) {
      options.select = query.select;
    } else {
      options.include = query?.include || this.getDefaultIncludes();
    }

    return this.prisma.wire.findMany(options);
  }

  /**
   * Find one wire matching criteria
   */
  async findOne(query: QueryOptions<Wire>): Promise<Wire | null> {
    const options: any = {
      where: query.where,
    };

    if (query.select) {
      options.select = query.select;
    } else {
      options.include = query.include || this.getDefaultIncludes();
    }

    return this.prisma.wire.findFirst(options);
  }

  /**
   * Create a new wire
   */
  async create(data: Prisma.WireCreateInput): Promise<Wire> {
    return this.prisma.wire.create({
      data,
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Update a wire
   */
  async update(id: string, data: Prisma.WireUpdateInput): Promise<Wire> {
    return this.prisma.wire.update({
      where: { id },
      data: {
        ...data,
        modifiedAt: new Date(),
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Delete a wire
   */
  async delete(id: string): Promise<Wire> {
    return this.prisma.wire.delete({
      where: { id },
    });
  }

  /**
   * Count wires
   */
  async count(query?: QueryOptions<Wire>): Promise<number> {
    return this.prisma.wire.count({
      where: query?.where,
    });
  }

  /**
   * Check if wire exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.wire.count({ where: { id } });
    return count > 0;
  }

  /**
   * Find wires by project
   */
  async findByProject(projectId: string): Promise<Wire[]> {
    return this.prisma.wire.findMany({
      where: { projectId },
      include: this.getDefaultIncludes(),
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find wires connected to a specific pin
   */
  async findByPin(pinId: string): Promise<Wire[]> {
    return this.prisma.wire.findMany({
      where: {
        OR: [{ fromPinId: pinId }, { toPinId: pinId }],
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Find wires from a specific pin
   */
  async findFromPin(pinId: string): Promise<Wire[]> {
    return this.prisma.wire.findMany({
      where: { fromPinId: pinId },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Find wires to a specific pin
   */
  async findToPin(pinId: string): Promise<Wire[]> {
    return this.prisma.wire.findMany({
      where: { toPinId: pinId },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Find wire connecting two pins
   */
  async findBetweenPins(fromPinId: string, toPinId: string): Promise<Wire | null> {
    return this.prisma.wire.findFirst({
      where: {
        OR: [
          { fromPinId, toPinId },
          { fromPinId: toPinId, toPinId: fromPinId }, // Check both directions
        ],
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Find all wires in a bundle
   */
  async findByBundle(bundleId: string): Promise<Wire[]> {
    return this.prisma.wire.findMany({
      where: {
        routing: {
          path: ['bundle_id'],
          equals: bundleId,
        },
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Find wires by gauge (from physical properties)
   */
  async findByGauge(projectId: string, gaugeMin: number, gaugeMax?: number): Promise<Wire[]> {
    const wires = await this.prisma.wire.findMany({
      where: { projectId },
      include: this.getDefaultIncludes(),
    });

    return wires.filter((wire) => {
      const physical = wire.physical as any;
      if (!physical || !physical.gauge) return false;

      const gauge = physical.gauge;
      if (gaugeMax) {
        return gauge >= gaugeMin && gauge <= gaugeMax;
      }
      return gauge === gaugeMin;
    });
  }

  /**
   * Find wires by color
   */
  async findByColor(projectId: string, color: string): Promise<Wire[]> {
    const wires = await this.prisma.wire.findMany({
      where: { projectId },
      include: this.getDefaultIncludes(),
    });

    return wires.filter((wire) => {
      const physical = wire.physical as any;
      if (!physical || !physical.color) return false;

      const wireColor = physical.color.primary || physical.color;
      return wireColor.toLowerCase().includes(color.toLowerCase());
    });
  }

  /**
   * Get wire path (from pin → wire → to pin with connector info)
   */
  async getWirePath(wireId: string): Promise<WirePath | null> {
    const wire = await this.prisma.wire.findUnique({
      where: { id: wireId },
      include: {
        fromPin: {
          include: {
            connector: {
              include: {
                ecu: true,
              },
            },
          },
        },
        toPin: {
          include: {
            connector: {
              include: {
                ecu: true,
              },
            },
          },
        },
      },
    });

    if (!wire) return null;

    return {
      wireId: wire.id,
      wireName: wire.name,
      from: wire.fromPin
        ? {
            pinId: wire.fromPin.id,
            pinNumber: wire.fromPin.pinNumber,
            pinLabel: wire.fromPin.label,
            connectorId: wire.fromPin.connector.id,
            connectorName: wire.fromPin.connector.name,
            ecuId: wire.fromPin.connector.ecu?.id || null,
            ecuName: wire.fromPin.connector.ecu?.name || null,
          }
        : null,
      to: wire.toPin
        ? {
            pinId: wire.toPin.id,
            pinNumber: wire.toPin.pinNumber,
            pinLabel: wire.toPin.label,
            connectorId: wire.toPin.connector.id,
            connectorName: wire.toPin.connector.name,
            ecuId: wire.toPin.connector.ecu?.id || null,
            ecuName: wire.toPin.connector.ecu?.name || null,
          }
        : null,
      physical: wire.physical as any,
      routing: wire.routing as any,
    };
  }

  /**
   * Find all wires between two ECUs
   */
  async findBetweenECUs(ecu1Id: string, ecu2Id: string): Promise<Wire[]> {
    // Get all connectors for both ECUs
    const [ecu1Connectors, ecu2Connectors] = await Promise.all([
      this.prisma.connector.findMany({
        where: { ecuId: ecu1Id },
        include: { pins: true },
      }),
      this.prisma.connector.findMany({
        where: { ecuId: ecu2Id },
        include: { pins: true },
      }),
    ]);

    const ecu1PinIds = ecu1Connectors.flatMap((c) => c.pins.map((p) => p.id));
    const ecu2PinIds = ecu2Connectors.flatMap((c) => c.pins.map((p) => p.id));

    return this.prisma.wire.findMany({
      where: {
        OR: [
          {
            fromPinId: { in: ecu1PinIds },
            toPinId: { in: ecu2PinIds },
          },
          {
            fromPinId: { in: ecu2PinIds },
            toPinId: { in: ecu1PinIds },
          },
        ],
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Default relations to include
   */
  private getDefaultIncludes() {
    return {
      fromPin: {
        include: {
          connector: {
            include: {
              ecu: true,
            },
          },
        },
      },
      toPin: {
        include: {
          connector: {
            include: {
              ecu: true,
            },
          },
        },
      },
    };
  }
}

/**
 * Wire path information with full context
 */
export interface WirePath {
  wireId: string;
  wireName: string | null;
  from: EndpointInfo | null;
  to: EndpointInfo | null;
  physical: any;
  routing: any;
}

export interface EndpointInfo {
  pinId: string;
  pinNumber: string;
  pinLabel: string | null;
  connectorId: string;
  connectorName: string;
  ecuId: string | null;
  ecuName: string | null;
}
