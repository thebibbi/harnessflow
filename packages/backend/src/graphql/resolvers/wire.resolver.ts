/**
 * Wire GraphQL Resolver
 */

import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { WireRepository } from '../../database/repositories/wire.repository';
import { WireType, ProjectType, PinType } from '../types';
import { CreateWireInput, UpdateWireInput } from '../types/inputs';
import { ProjectRepository } from '../../database/repositories/project.repository';

/**
 * Helper to convert Prisma null values to undefined for GraphQL compatibility
 */
function toGraphQL<
  T extends { name?: string | null; fromPinId?: string | null; toPinId?: string | null },
>(wire: T): T & { name?: string; fromPinId?: string; toPinId?: string } {
  return {
    ...wire,
    name: wire.name ?? undefined,
    fromPinId: wire.fromPinId ?? undefined,
    toPinId: wire.toPinId ?? undefined,
  };
}

@Resolver(() => WireType)
export class WireResolver {
  constructor(
    private readonly wireRepo: WireRepository,
    private readonly projectRepo: ProjectRepository
  ) {}

  /**
   * Get wire by ID
   */
  @Query(() => WireType, { nullable: true })
  async wire(@Args('id', { type: () => ID }) id: string): Promise<WireType | null> {
    const wire = await this.wireRepo.findById(id);
    return wire ? toGraphQL(wire) : null;
  }

  /**
   * Get wires by project
   */
  @Query(() => [WireType])
  async wiresByProject(
    @Args('projectId', { type: () => ID }) projectId: string
  ): Promise<WireType[]> {
    const wires = await this.wireRepo.findMany({
      where: { projectId },
    });
    return wires.map(toGraphQL);
  }

  /**
   * Get wires by pin
   */
  @Query(() => [WireType])
  async wiresByPin(@Args('pinId', { type: () => ID }) pinId: string): Promise<WireType[]> {
    const wires = await this.wireRepo.findByPin(pinId);
    return wires.map(toGraphQL);
  }

  /**
   * Create wire
   */
  @Mutation(() => WireType)
  async createWire(@Args('input') input: CreateWireInput): Promise<WireType> {
    const wire = await this.wireRepo.create({
      project: { connect: { id: input.projectId } },
      fromPin: input.fromPinId ? { connect: { id: input.fromPinId } } : undefined,
      toPin: input.toPinId ? { connect: { id: input.toPinId } } : undefined,
      name: input.name,
      physical: input.physical,
      electrical: input.electrical,
      routing: input.routing,
      metadata: input.metadata,
      createdBy: 'user', // TODO: Get from auth context
      modifiedBy: 'user',
    });
    return toGraphQL(wire);
  }

  /**
   * Update wire
   */
  @Mutation(() => WireType)
  async updateWire(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateWireInput
  ): Promise<WireType> {
    const wire = await this.wireRepo.update(id, {
      name: input.name,
      fromPin: input.fromPinId ? { connect: { id: input.fromPinId } } : undefined,
      toPin: input.toPinId ? { connect: { id: input.toPinId } } : undefined,
      physical: input.physical,
      electrical: input.electrical,
      routing: input.routing,
      metadata: input.metadata,
      modifiedBy: 'user', // TODO: Get from auth context
    });
    return toGraphQL(wire);
  }

  /**
   * Delete wire
   */
  @Mutation(() => Boolean)
  async deleteWire(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.wireRepo.delete(id);
    return true;
  }

  /**
   * Resolve project for wire
   */
  @ResolveField(() => ProjectType)
  async project(@Parent() wire: WireType): Promise<ProjectType> {
    const project = await this.projectRepo.findById(wire.projectId);
    if (!project) {
      throw new Error(`Project not found: ${wire.projectId}`);
    }
    return project;
  }

  /**
   * Resolve from pin for wire
   */
  @ResolveField(() => PinType, { nullable: true })
  async fromPin(@Parent() wire: WireType): Promise<PinType | null> {
    // The pin will be included via Prisma's include
    return (wire as any).fromPin || null;
  }

  /**
   * Resolve to pin for wire
   */
  @ResolveField(() => PinType, { nullable: true })
  async toPin(@Parent() wire: WireType): Promise<PinType | null> {
    // The pin will be included via Prisma's include
    return (wire as any).toPin || null;
  }
}
