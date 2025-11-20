/**
 * GraphQL Input Types
 *
 * Defines input types for mutations and queries
 */

import { InputType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';

/**
 * Project create input
 */
@InputType()
export class CreateProjectInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  vehicleManufacturer!: string;

  @Field()
  vehicleModel!: string;

  @Field(() => Int)
  vehicleYear!: number;

  @Field({ nullable: true })
  vehiclePlatform?: string;

  @Field(() => [String], { defaultValue: ['Global'] })
  vehicleRegion!: string[];

  @Field({ nullable: true })
  asilRating?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

/**
 * Project update input
 */
@InputType()
export class UpdateProjectInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  vehicleManufacturer?: string;

  @Field({ nullable: true })
  vehicleModel?: string;

  @Field(() => Int, { nullable: true })
  vehicleYear?: number;

  @Field({ nullable: true })
  vehiclePlatform?: string;

  @Field(() => [String], { nullable: true })
  vehicleRegion?: string[];

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  asilRating?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

/**
 * ECU create input
 */
@InputType()
export class CreateECUInput {
  @Field()
  projectId!: string;

  @Field()
  name!: string;

  @Field()
  partNumber!: string;

  @Field()
  manufacturer!: string;

  @Field({ nullable: true })
  supplierCode?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  physical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  electrical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  software?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

/**
 * Connector create input
 */
@InputType()
export class CreateConnectorInput {
  @Field()
  ecuId!: string;

  @Field()
  name!: string;

  @Field()
  partNumber!: string;

  @Field()
  manufacturer!: string;

  @Field()
  type!: string;

  @Field()
  gender!: string;

  @Field(() => Int)
  pinCount!: number;

  @Field(() => GraphQLJSON, { nullable: true })
  physical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

/**
 * Pin create input
 */
@InputType()
export class CreatePinInput {
  @Field()
  connectorId!: string;

  @Field()
  pinNumber!: string;

  @Field({ nullable: true })
  label?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  capabilities?: any;
}

/**
 * Wire create input
 */
@InputType()
export class CreateWireInput {
  @Field()
  projectId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  fromPinId?: string;

  @Field({ nullable: true })
  toPinId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  physical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  electrical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  routing?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

/**
 * Wire update input
 */
@InputType()
export class UpdateWireInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  fromPinId?: string;

  @Field({ nullable: true })
  toPinId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  physical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  electrical?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  routing?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

/**
 * Pagination input
 */
@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  page!: number;

  @Field(() => Int, { defaultValue: 20 })
  pageSize!: number;

  @Field({ nullable: true })
  sortBy?: string;

  @Field({ nullable: true })
  sortOrder?: string;
}

/**
 * Project filter input
 */
@InputType()
export class ProjectFilterInput {
  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  vehicleManufacturer?: string;

  @Field({ nullable: true })
  vehicleModel?: string;

  @Field(() => Int, { nullable: true })
  vehicleYear?: number;

  @Field({ nullable: true })
  status?: string;
}

/**
 * WireViz import input
 */
@InputType()
export class WireVizImportInput {
  @Field()
  yamlContent!: string;

  @Field()
  projectName!: string;

  @Field({ nullable: true })
  projectDescription?: string;

  @Field({ nullable: true })
  vehicle?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

/**
 * Excel column mapping input
 */
@InputType()
export class ExcelColumnMappingInput {
  @Field({ nullable: true })
  wireId?: string;

  @Field({ nullable: true })
  wireName?: string;

  @Field({ nullable: true })
  wireGauge?: string;

  @Field({ nullable: true })
  wireColor?: string;

  @Field({ nullable: true })
  wireLength?: string;

  @Field({ nullable: true })
  fromConnector?: string;

  @Field({ nullable: true })
  fromPin?: string;

  @Field({ nullable: true })
  toConnector?: string;

  @Field({ nullable: true })
  toPin?: string;

  @Field({ nullable: true })
  signal?: string;
}

/**
 * Excel import input
 */
@InputType()
export class ExcelImportInput {
  @Field(() => GraphQLUpload)
  file!: FileUpload;

  @Field()
  projectName!: string;

  @Field({ nullable: true })
  projectDescription?: string;

  @Field({ nullable: true })
  vehicle?: string;

  @Field({ nullable: true })
  autoDetect?: boolean;

  @Field(() => ExcelColumnMappingInput, { nullable: true })
  columnMapping?: ExcelColumnMappingInput;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}
