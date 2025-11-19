/**
 * Core harness data model types
 * Matches the Prisma schema and database models
 */

import { BaseEntity } from './common';

/**
 * Vehicle information
 */
export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  platform?: string;
}

/**
 * Project variant information
 */
export interface Variant {
  id: string;
  name: string;
  code: string;
  description?: string;
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  version: string;
  status: 'draft' | 'review' | 'approved' | 'released';
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * Project entity
 */
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  vehicle: VehicleInfo;
  variants: Variant[];
  metadata: ProjectMetadata;
}

/**
 * Physical properties of a component
 */
export interface PhysicalProperties {
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  material?: string;
  color?: string;
}

/**
 * Electrical properties
 */
export interface ElectricalProperties {
  voltage?: number;
  current?: number;
  resistance?: number;
  powerRating?: number;
}

/**
 * ECU software information
 */
export interface SoftwareInfo {
  version: string;
  partNumber?: string;
  calibration?: string;
}

/**
 * ECU (Electronic Control Unit)
 */
export interface ECU extends BaseEntity {
  projectId: string;
  partNumber: string;
  name: string;
  manufacturer: string;
  physical?: PhysicalProperties;
  electrical?: ElectricalProperties;
  software?: SoftwareInfo;
}

/**
 * Connector type
 */
export type ConnectorType = 'male' | 'female' | 'hermaphroditic';

/**
 * Connector entity
 */
export interface Connector extends BaseEntity {
  ecuId: string;
  partNumber: string;
  name: string;
  manufacturer: string;
  type: ConnectorType;
  pinCount: number;
  physical?: PhysicalProperties;
}

/**
 * Pin function type
 */
export type PinFunction = 'power' | 'ground' | 'signal' | 'can_high' | 'can_low' | 'lin' | 'unused';

/**
 * Pin entity
 */
export interface Pin extends BaseEntity {
  connectorId: string;
  position: string;
  label?: string;
  function: PinFunction;
  signalName?: string;
  electrical?: ElectricalProperties;
}

/**
 * Wire gauge standard
 */
export type WireGauge = 'AWG' | 'SQ_MM';

/**
 * Wire entity
 */
export interface Wire extends BaseEntity {
  projectId: string;
  sourcePinId: string;
  targetPinId: string;
  wireId: string;
  color: string;
  gauge: number;
  gaugeStandard: WireGauge;
  length?: number;
  material?: string;
}

/**
 * Splice type
 */
export type SpliceType = 'crimp' | 'solder' | 'ultrasonic';

/**
 * Splice entity
 */
export interface Splice extends BaseEntity {
  projectId: string;
  name: string;
  type: SpliceType;
  wireIds: string[];
  physical?: PhysicalProperties;
}

/**
 * Feature requirement
 */
export interface FeatureRequirement {
  id: string;
  description: string;
  type: 'functional' | 'electrical' | 'physical' | 'regulatory';
  mandatory: boolean;
}

/**
 * Feature entity
 */
export interface Feature extends BaseEntity {
  projectId: string;
  name: string;
  description: string;
  requirements: FeatureRequirement[];
  implementedBy: string[];
  status: 'planned' | 'in_progress' | 'implemented' | 'verified';
}

/**
 * Component entity (generic harness component)
 */
export interface Component extends BaseEntity {
  projectId: string;
  partNumber: string;
  name: string;
  type: string;
  manufacturer?: string;
  specifications: Record<string, unknown>;
  quantity: number;
}

/**
 * Network protocol type
 */
export type NetworkProtocol = 'CAN' | 'LIN' | 'FlexRay' | 'Ethernet' | 'MOST';

/**
 * Network entity
 */
export interface Network extends BaseEntity {
  projectId: string;
  name: string;
  protocol: NetworkProtocol;
  baudRate?: number;
  configuration: Record<string, unknown>;
}

/**
 * Network member (ECU or component on a network)
 */
export interface NetworkMember extends BaseEntity {
  networkId: string;
  ecuId?: string;
  componentId?: string;
  nodeId: string;
  role: 'master' | 'slave' | 'peer';
}

/**
 * Change request status
 */
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'implemented';

/**
 * Impact analysis result
 */
export interface ImpactAnalysis {
  affectedECUs: string[];
  affectedWires: string[];
  affectedFeatures: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort?: string;
}

/**
 * Change request entity
 */
export interface ChangeRequest extends BaseEntity {
  projectId: string;
  title: string;
  description: string;
  requestedChanges: Record<string, unknown>;
  status: ChangeRequestStatus;
  impactAnalysis?: ImpactAnalysis;
  approvedBy?: string;
  approvedAt?: Date;
  implementedAt?: Date;
}
