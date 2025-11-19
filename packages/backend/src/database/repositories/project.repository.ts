import { Injectable } from '@nestjs/common';
import { Project, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  BaseRepository,
  QueryOptions,
  createPaginatedResult,
  PaginatedResult,
} from '../base.repository';

/**
 * ProjectRepository
 *
 * Handles all database operations for Project entities.
 * Implements the BaseRepository interface with Project-specific methods.
 *
 * Features:
 * - Full CRUD operations
 * - Pagination support
 * - Relations loading (ECUs, Wires, Features, etc.)
 * - Query by vehicle info
 * - Audit field tracking
 */
@Injectable()
export class ProjectRepository implements BaseRepository<Project> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find project by ID
   * @param id - Project ID
   * @param includeRelations - Whether to include related entities
   */
  async findById(id: string, includeRelations = false): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: includeRelations ? this.getDefaultIncludes() : undefined,
    });
  }

  /**
   * Find multiple projects
   */
  async findMany(query?: QueryOptions<Project>): Promise<Project[]> {
    const options: any = {
      where: query?.where,
      orderBy: query?.orderBy || { createdAt: 'desc' },
      skip: query?.skip,
      take: query?.take,
    };

    if (query?.select) {
      options.select = query.select;
    } else if (query?.include) {
      options.include = query.include;
    }

    return this.prisma.project.findMany(options);
  }

  /**
   * Find one project matching criteria
   */
  async findOne(query: QueryOptions<Project>): Promise<Project | null> {
    const options: any = {
      where: query.where,
    };

    if (query.select) {
      options.select = query.select;
    } else if (query.include) {
      options.include = query.include;
    }

    return this.prisma.project.findFirst(options);
  }

  /**
   * Create a new project
   */
  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({
      data,
    });
  }

  /**
   * Update a project
   */
  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        modifiedAt: new Date(), // Automatically update modifiedAt
      },
    });
  }

  /**
   * Delete a project
   * Note: This will cascade delete all related entities (ECUs, Wires, etc.)
   */
  async delete(id: string): Promise<Project> {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  /**
   * Count projects matching criteria
   */
  async count(query?: QueryOptions<Project>): Promise<number> {
    return this.prisma.project.count({
      where: query?.where,
    });
  }

  /**
   * Check if project exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.project.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Find projects with pagination
   */
  async findPaginated(
    page = 1,
    pageSize = 20,
    where?: Prisma.ProjectWhereInput
  ): Promise<PaginatedResult<Project>> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return createPaginatedResult(data, total, page, pageSize);
  }

  /**
   * Find projects by vehicle info
   */
  async findByVehicle(manufacturer: string, model?: string, year?: number): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: {
        vehicleManufacturer: manufacturer,
        ...(model && { vehicleModel: model }),
        ...(year && { vehicleYear: year }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find projects by status
   */
  async findByStatus(status: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find projects created by user
   */
  async findByCreator(createdBy: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { createdBy },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get project with full details (all relations)
   */
  async findByIdWithDetails(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Get project statistics
   */
  async getProjectStats(id: string): Promise<ProjectStats> {
    const [ecusCount, wiresCount, featuresCount, networksCount] = await Promise.all([
      this.prisma.eCU.count({ where: { projectId: id } }),
      this.prisma.wire.count({ where: { projectId: id } }),
      this.prisma.feature.count({ where: { projectId: id } }),
      this.prisma.network.count({ where: { projectId: id } }),
    ]);

    return {
      ecusCount,
      wiresCount,
      featuresCount,
      networksCount,
    };
  }

  /**
   * Default relations to include
   */
  private getDefaultIncludes() {
    return {
      ecus: {
        include: {
          connectors: {
            include: {
              pins: true,
            },
          },
        },
      },
      wires: true,
      features: true,
      networks: true,
      components: true,
      changeRequests: true,
    };
  }
}

/**
 * Project statistics interface
 */
export interface ProjectStats {
  ecusCount: number;
  wiresCount: number;
  featuresCount: number;
  networksCount: number;
}
