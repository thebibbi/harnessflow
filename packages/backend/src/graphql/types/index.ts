/**
 * GraphQL Object Types
 *
 * Defines the GraphQL schema types for HarnessFlow entities
 */

import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

/**
 * Project type
 */
@ObjectType()
export class ProjectType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field()
  vehicleManufacturer!: string;

  @Field()
  vehicleModel!: string;

  @Field(() => Int)
  vehicleYear!: number;

  @Field({ nullable: true })
  vehiclePlatform?: string | null;

  @Field(() => [String])
  vehicleRegion!: string[];

  @Field()
  version!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  asilRating?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  createdAt!: Date;

  @Field()
  createdBy!: string;

  @Field()
  modifiedAt!: Date;

  @Field()
  modifiedBy!: string;

  @Field(() => [ECUType], { nullable: true })
  ecus?: ECUType[];

  @Field(() => [WireType], { nullable: true })
  wires?: WireType[];

  @Field(() => [FeatureType], { nullable: true })
  features?: FeatureType[];
}

/**
 * ECU type
 */
@ObjectType()
export class ECUType {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field()
  partNumber: string;

  @Field()
  name: string;

  @Field()
  manufacturer: string;

  @Field({ nullable: true })
  supplierCode?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  physical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  electrical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  software?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  procurement?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  safety?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  createdBy: string;

  @Field()
  modifiedAt: Date;

  @Field()
  modifiedBy: string;

  @Field(() => ProjectType, { nullable: true })
  project?: ProjectType;

  @Field(() => [ConnectorType], { nullable: true })
  connectors?: ConnectorType[];
}

/**
 * Connector type
 */
@ObjectType()
export class ConnectorType {
  @Field(() => ID)
  id: string;

  @Field()
  ecuId: string;

  @Field()
  name: string;

  @Field()
  partNumber: string;

  @Field()
  manufacturer: string;

  @Field()
  type: string;

  @Field()
  gender: string;

  @Field(() => Int)
  pinCount: number;

  @Field(() => GraphQLJSON, { nullable: true })
  physical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  createdBy: string;

  @Field()
  modifiedAt: Date;

  @Field()
  modifiedBy: string;

  @Field(() => ECUType, { nullable: true })
  ecu?: ECUType;

  @Field(() => [PinType], { nullable: true })
  pins?: PinType[];
}

/**
 * Pin type
 */
@ObjectType()
export class PinType {
  @Field(() => ID)
  id: string;

  @Field()
  connectorId: string;

  @Field()
  pinNumber: string;

  @Field({ nullable: true })
  label?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  capabilities?: any;

  @Field()
  createdAt: Date;

  @Field()
  createdBy: string;

  @Field()
  modifiedAt: Date;

  @Field()
  modifiedBy: string;

  @Field(() => ConnectorType, { nullable: true })
  connector?: ConnectorType;

  @Field(() => [WireType], { nullable: true })
  wiresFrom?: WireType[];

  @Field(() => [WireType], { nullable: true })
  wiresTo?: WireType[];
}

/**
 * Wire type
 */
@ObjectType()
export class WireType {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  fromPinId?: string;

  @Field({ nullable: true })
  toPinId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  endpoints?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  viaPoints?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  physical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  electrical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  routing?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  createdBy: string;

  @Field()
  modifiedAt: Date;

  @Field()
  modifiedBy: string;

  @Field(() => ProjectType, { nullable: true })
  project?: ProjectType;

  @Field(() => PinType, { nullable: true })
  fromPin?: PinType;

  @Field(() => PinType, { nullable: true })
  toPin?: PinType;
}

/**
 * Feature type
 */
@ObjectType()
export class FeatureType {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  category: string;

  @Field({ nullable: true })
  asilRating?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  requirements?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  dependencies?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  createdBy: string;

  @Field()
  modifiedAt: Date;

  @Field()
  modifiedBy: string;

  @Field(() => ProjectType, { nullable: true })
  project?: ProjectType;
}

/**
 * Paginated results type
 */
@ObjectType()
export class PaginatedProjects {
  @Field(() => [ProjectType])
  items: ProjectType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  totalPages: number;
}

/**
 * Import result type
 */
@ObjectType()
export class ImportResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  projectId?: string;

  @Field(() => [String], { nullable: true })
  errors?: string[];

  @Field(() => [String], { nullable: true })
  warnings?: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  stats?: any;
}
