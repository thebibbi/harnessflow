import { Injectable } from '@nestjs/common';
import { Feature, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { BaseRepository, QueryOptions } from '../base.repository';

/**
 * FeatureRepository
 *
 * Handles database operations for Feature entities.
 * Features represent vehicle functions (heated steering, rear fog lamp, etc.)
 *
 * Features:
 * - Find by category (powertrain, chassis, body, comfort, safety, etc.)
 * - Query by requirements (power, pins, network)
 * - Find features available in specific variants
 * - Dependency analysis (requires, conflicts with)
 */
@Injectable()
export class FeatureRepository implements BaseRepository<Feature> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find feature by ID
   */
  async findById(id: string): Promise<Feature | null> {
    return this.prisma.feature.findUnique({
      where: { id },
    });
  }

  /**
   * Find multiple features
   */
  async findMany(query?: QueryOptions<Feature>): Promise<Feature[]> {
    const options: any = {
      where: query?.where,
      orderBy: query?.orderBy || { name: 'asc' },
      skip: query?.skip,
      take: query?.take,
    };

    if (query?.select) {
      options.select = query.select;
    } else if (query?.include) {
      options.include = query.include;
    }

    return this.prisma.feature.findMany(options);
  }

  /**
   * Find one feature matching criteria
   */
  async findOne(query: QueryOptions<Feature>): Promise<Feature | null> {
    const options: any = {
      where: query.where,
    };

    if (query.select) {
      options.select = query.select;
    } else if (query.include) {
      options.include = query.include;
    }

    return this.prisma.feature.findFirst(options);
  }

  /**
   * Create a new feature
   */
  async create(data: Prisma.FeatureCreateInput): Promise<Feature> {
    return this.prisma.feature.create({
      data,
    });
  }

  /**
   * Update a feature
   */
  async update(id: string, data: Prisma.FeatureUpdateInput): Promise<Feature> {
    return this.prisma.feature.update({
      where: { id },
      data: {
        ...data,
        modifiedAt: new Date(),
      },
    });
  }

  /**
   * Delete a feature
   */
  async delete(id: string): Promise<Feature> {
    return this.prisma.feature.delete({
      where: { id },
    });
  }

  /**
   * Count features
   */
  async count(query?: QueryOptions<Feature>): Promise<number> {
    return this.prisma.feature.count({
      where: query?.where,
    });
  }

  /**
   * Check if feature exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.feature.count({ where: { id } });
    return count > 0;
  }

  /**
   * Find features by project
   */
  async findByProject(projectId: string): Promise<Feature[]> {
    return this.prisma.feature.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find features by category
   */
  async findByCategory(projectId: string, category: string): Promise<Feature[]> {
    return this.prisma.feature.findMany({
      where: {
        projectId,
        category,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find features available in a specific variant
   */
  async findByVariant(projectId: string, variantId: string): Promise<Feature[]> {
    return this.prisma.feature.findMany({
      where: {
        projectId,
        availableIn: {
          has: variantId,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find features by name (case-insensitive search)
   */
  async search(projectId: string, searchTerm: string): Promise<Feature[]> {
    return this.prisma.feature.findMany({
      where: {
        projectId,
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find safety-relevant features (ASIL rated)
   */
  async findSafetyRelevant(projectId: string): Promise<Feature[]> {
    const features = await this.prisma.feature.findMany({
      where: { projectId },
    });

    return features.filter((feature) => {
      const safety = feature.safety as any;
      return safety && safety.safety_relevant === true;
    });
  }

  /**
   * Find features by ASIL rating
   */
  async findByASIL(projectId: string, asilRating: string): Promise<Feature[]> {
    const features = await this.prisma.feature.findMany({
      where: { projectId },
    });

    return features.filter((feature) => {
      const safety = feature.safety as any;
      return safety && safety.asil_rating === asilRating;
    });
  }

  /**
   * Get feature requirements analysis
   */
  async getRequirements(featureId: string): Promise<FeatureRequirements | null> {
    const feature = await this.prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature || !feature.requirements) {
      return null;
    }

    const requirements = feature.requirements as any;

    return {
      featureId: feature.id,
      featureName: feature.name,
      pins: requirements.pins || [],
      power: requirements.power || null,
      network: requirements.network || null,
      physical: requirements.physical || null,
    };
  }

  /**
   * Get feature implementation details
   */
  async getImplementation(featureId: string): Promise<FeatureImplementation | null> {
    const feature = await this.prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature || !feature.implementation) {
      return null;
    }

    const implementation = feature.implementation as any;

    return {
      featureId: feature.id,
      featureName: feature.name,
      ecuId: implementation.ecu_id || null,
      pins: implementation.pins || [],
      wires: implementation.wires || [],
      components: implementation.components || [],
      softwareModule: implementation.software_module || null,
    };
  }

  /**
   * Find features that depend on this feature
   */
  async findDependentFeatures(featureId: string): Promise<Feature[]> {
    const feature = await this.prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return [];
    }

    // Find features in the same project that list this feature in their dependencies
    const allFeatures = await this.prisma.feature.findMany({
      where: { projectId: feature.projectId },
    });

    return allFeatures.filter((f) => {
      const dependencies = f.dependencies as any;
      if (!dependencies || !dependencies.requires) return false;

      return dependencies.requires.includes(featureId);
    });
  }

  /**
   * Find features that conflict with this feature
   */
  async findConflictingFeatures(featureId: string): Promise<Feature[]> {
    const feature = await this.prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return [];
    }

    const dependencies = feature.dependencies as any;
    if (!dependencies || !dependencies.conflicts_with) {
      return [];
    }

    const conflictIds = dependencies.conflicts_with;

    return this.prisma.feature.findMany({
      where: {
        id: { in: conflictIds },
      },
    });
  }

  /**
   * Find required features (dependencies)
   */
  async findRequiredFeatures(featureId: string): Promise<Feature[]> {
    const feature = await this.prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return [];
    }

    const dependencies = feature.dependencies as any;
    if (!dependencies || !dependencies.requires) {
      return [];
    }

    const requiredIds = dependencies.requires;

    return this.prisma.feature.findMany({
      where: {
        id: { in: requiredIds },
      },
    });
  }

  /**
   * Get feature statistics for a project
   */
  async getProjectFeatureStats(projectId: string): Promise<FeatureStats> {
    const features = await this.prisma.feature.findMany({
      where: { projectId },
    });

    const byCategory: Record<string, number> = {};
    let safetyRelevant = 0;
    const byASIL: Record<string, number> = {};

    for (const feature of features) {
      // Count by category
      byCategory[feature.category] = (byCategory[feature.category] || 0) + 1;

      // Count safety-relevant
      const safety = feature.safety as any;
      if (safety && safety.safety_relevant) {
        safetyRelevant++;

        // Count by ASIL rating
        const asilRating = safety.asil_rating;
        if (asilRating) {
          byASIL[asilRating] = (byASIL[asilRating] || 0) + 1;
        }
      }
    }

    return {
      total: features.length,
      byCategory,
      safetyRelevant,
      byASIL,
    };
  }
}

/**
 * Feature requirements interface
 */
export interface FeatureRequirements {
  featureId: string;
  featureName: string;
  pins: Array<{
    io_type: string;
    voltage: number;
    current: number;
    signal_type?: string;
  }>;
  power: {
    voltage: number;
    current: number;
    max_power: number;
  } | null;
  network: {
    protocol: string;
    messages?: any[];
  } | null;
  physical: any;
}

/**
 * Feature implementation interface
 */
export interface FeatureImplementation {
  featureId: string;
  featureName: string;
  ecuId: string | null;
  pins: Array<{
    pin_id: string;
    function: string;
  }>;
  wires: string[];
  components: string[];
  softwareModule: string | null;
}

/**
 * Feature statistics interface
 */
export interface FeatureStats {
  total: number;
  byCategory: Record<string, number>;
  safetyRelevant: number;
  byASIL: Record<string, number>;
}
