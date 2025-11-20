/**
 * Project GraphQL Resolver
 */

import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { ProjectRepository } from '../../database/repositories/project.repository';
import { ECURepository } from '../../database/repositories/ecu.repository';
import { WireRepository } from '../../database/repositories/wire.repository';
import { ProjectType, PaginatedProjects, ECUType, WireType, FeatureType } from '../types';
import {
  CreateProjectInput,
  UpdateProjectInput,
  PaginationInput,
  ProjectFilterInput,
} from '../types/inputs';

@Resolver(() => ProjectType)
export class ProjectResolver {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly ecuRepo: ECURepository,
    private readonly wireRepo: WireRepository
  ) {}

  /**
   * Get project by ID
   */
  @Query(() => ProjectType, { nullable: true })
  async project(@Args('id', { type: () => ID }) id: string): Promise<ProjectType | null> {
    return this.projectRepo.findById(id) as Promise<ProjectType | null>;
  }

  /**
   * Get all projects with pagination
   */
  @Query(() => PaginatedProjects)
  async projects(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: ProjectFilterInput
  ): Promise<PaginatedProjects> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter?.vehicleManufacturer) {
      where.vehicleManufacturer = filter.vehicleManufacturer;
    }
    if (filter?.vehicleModel) {
      where.vehicleModel = filter.vehicleModel;
    }
    if (filter?.vehicleYear) {
      where.vehicleYear = filter.vehicleYear;
    }
    if (filter?.status) {
      where.status = filter.status;
    }

    const [items, total] = await Promise.all([
      this.projectRepo.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }) as Promise<ProjectType[]>,
      this.projectRepo.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Create new project
   */
  @Mutation(() => ProjectType)
  async createProject(@Args('input') input: CreateProjectInput): Promise<ProjectType> {
    return this.projectRepo.create({
      name: input.name,
      description: input.description,
      vehicleManufacturer: input.vehicleManufacturer,
      vehicleModel: input.vehicleModel,
      vehicleYear: input.vehicleYear,
      vehiclePlatform: input.vehiclePlatform,
      vehicleRegion: input.vehicleRegion,
      asilRating: input.asilRating,
      metadata: input.metadata,
      createdBy: 'user', // TODO: Get from auth context
      modifiedBy: 'user',
    }) as Promise<ProjectType>;
  }

  /**
   * Update project
   */
  @Mutation(() => ProjectType)
  async updateProject(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProjectInput
  ): Promise<ProjectType> {
    return this.projectRepo.update(id, {
      ...input,
      modifiedBy: 'user', // TODO: Get from auth context
    }) as Promise<ProjectType>;
  }

  /**
   * Delete project
   */
  @Mutation(() => Boolean)
  async deleteProject(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.projectRepo.delete(id);
    return true;
  }

  /**
   * Resolve ECUs for project
   */
  @ResolveField(() => [ECUType])
  async ecus(@Parent() project: ProjectType): Promise<ECUType[]> {
    return this.ecuRepo.findMany({
      where: { projectId: project.id },
    }) as Promise<ECUType[]>;
  }

  /**
   * Resolve wires for project
   */
  @ResolveField(() => [WireType])
  async wires(@Parent() project: ProjectType): Promise<WireType[]> {
    return this.wireRepo.findMany({
      where: { projectId: project.id },
    }) as Promise<WireType[]>;
  }

  /**
   * Resolve features for project
   */
  @ResolveField(() => [FeatureType])
  async features(@Parent() _project: ProjectType): Promise<FeatureType[]> {
    // TODO: Implement when FeatureRepository is created
    return [];
  }
}
