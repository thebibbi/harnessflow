import { Injectable } from '@nestjs/common';
import { ECU, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { BaseRepository, QueryOptions } from '../base.repository';

/**
 * ECURepository
 *
 * Handles database operations for ECU (Electronic Control Unit) entities.
 * Supports nested operations with connectors and pins.
 *
 * Features:
 * - Full CRUD with nested connector/pin creation
 * - Query spare pins on ECUs
 * - Find ECUs by project
 * - Power capacity queries
 * - Complex nested updates
 */
@Injectable()
export class ECURepository implements BaseRepository<ECU> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find ECU by ID
   */
  async findById(id: string, includeRelations = true): Promise<ECU | null> {
    return this.prisma.eCU.findUnique({
      where: { id },
      include: includeRelations ? this.getDefaultIncludes() : undefined,
    });
  }

  /**
   * Find multiple ECUs
   */
  async findMany(query?: QueryOptions<ECU>): Promise<ECU[]> {
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

    return this.prisma.eCU.findMany(options);
  }

  /**
   * Find one ECU matching criteria
   */
  async findOne(query: QueryOptions<ECU>): Promise<ECU | null> {
    const options: any = {
      where: query.where,
    };

    if (query.select) {
      options.select = query.select;
    } else {
      options.include = query.include || this.getDefaultIncludes();
    }

    return this.prisma.eCU.findFirst(options);
  }

  /**
   * Create a new ECU (with optional nested connectors/pins)
   */
  async create(data: Prisma.ECUCreateInput): Promise<ECU> {
    return this.prisma.eCU.create({
      data,
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Update an ECU
   */
  async update(id: string, data: Prisma.ECUUpdateInput): Promise<ECU> {
    return this.prisma.eCU.update({
      where: { id },
      data: {
        ...data,
        modifiedAt: new Date(),
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Delete an ECU
   * Note: Cascades to connectors and pins
   */
  async delete(id: string): Promise<ECU> {
    return this.prisma.eCU.delete({
      where: { id },
    });
  }

  /**
   * Count ECUs
   */
  async count(query?: QueryOptions<ECU>): Promise<number> {
    return this.prisma.eCU.count({
      where: query?.where,
    });
  }

  /**
   * Check if ECU exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.eCU.count({ where: { id } });
    return count > 0;
  }

  /**
   * Find ECUs by project ID
   */
  async findByProject(projectId: string): Promise<ECU[]> {
    return this.prisma.eCU.findMany({
      where: { projectId },
      include: this.getDefaultIncludes(),
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find ECU by part number within a project
   */
  async findByPartNumber(projectId: string, partNumber: string): Promise<ECU | null> {
    return this.prisma.eCU.findFirst({
      where: {
        projectId,
        partNumber,
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Find ECUs by manufacturer
   */
  async findByManufacturer(manufacturer: string): Promise<ECU[]> {
    return this.prisma.eCU.findMany({
      where: { manufacturer },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Get ECU with all spare (unassigned) pins
   */
  async findSparePins(ecuId: string): Promise<SparePin[]> {
    const ecu = await this.prisma.eCU.findUnique({
      where: { id: ecuId },
      include: {
        connectors: {
          include: {
            pins: true,
          },
        },
      },
    });

    if (!ecu) {
      return [];
    }

    const sparePins: SparePin[] = [];

    for (const connector of ecu.connectors) {
      for (const pin of connector.pins) {
        // Check if pin has no assignment (assignment.assigned is false or null)
        const assignment = pin.assignment as any;
        const isSpare = !assignment || !assignment.assigned;

        if (isSpare) {
          sparePins.push({
            pinId: pin.id,
            pinNumber: pin.pinNumber,
            connectorId: connector.id,
            connectorName: connector.name,
            label: pin.label,
            capabilities: pin.capabilities as any,
          });
        }
      }
    }

    return sparePins;
  }

  /**
   * Get total pin count for an ECU
   */
  async getTotalPinCount(ecuId: string): Promise<number> {
    const connectors = await this.prisma.connector.findMany({
      where: { ecuId },
      include: {
        _count: {
          select: { pins: true },
        },
      },
    });

    return connectors.reduce((total, conn) => total + conn._count.pins, 0);
  }

  /**
   * Create ECU with connectors and pins in one transaction
   */
  async createWithConnectors(
    ecuData: Prisma.ECUCreateInput,
    connectorsData: Array<{
      name: string;
      manufacturer: string;
      partNumber: string;
      type: string;
      gender: string;
      pinCount: number;
      pins?: Array<{
        pinNumber: string;
        label?: string;
        capabilities?: any;
      }>;
    }>
  ): Promise<ECU> {
    return this.prisma.eCU.create({
      data: {
        ...ecuData,
        connectors: {
          create: connectorsData.map((conn) => ({
            name: conn.name,
            manufacturer: conn.manufacturer,
            partNumber: conn.partNumber,
            type: conn.type,
            gender: conn.gender,
            pinCount: conn.pinCount,
            createdBy: ecuData.createdBy,
            modifiedBy: ecuData.modifiedBy,
            pins: conn.pins
              ? {
                  create: conn.pins.map((pin) => ({
                    pinNumber: pin.pinNumber,
                    label: pin.label,
                    capabilities: pin.capabilities,
                    createdBy: ecuData.createdBy,
                    modifiedBy: ecuData.modifiedBy,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Default relations to include
   */
  private getDefaultIncludes() {
    return {
      connectors: {
        include: {
          pins: true,
        },
      },
      networkConnections: {
        include: {
          network: true,
        },
      },
    };
  }
}

/**
 * Spare pin information
 */
export interface SparePin {
  pinId: string;
  pinNumber: string;
  connectorId: string;
  connectorName: string;
  label: string | null;
  capabilities: any;
}
