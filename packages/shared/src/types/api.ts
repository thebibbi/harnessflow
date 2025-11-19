/**
 * API request and response types
 */

import { PaginatedResponse } from './common';
import {
  Project,
  ECU,
  Connector,
  Pin,
  Wire,
  Splice,
  Feature,
  Component,
  Network,
  ChangeRequest,
} from './harness';
import { ValidationReport } from './validation';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Project filter parameters
 */
export interface ProjectFilterParams extends PaginationParams {
  status?: string;
  vehicle?: string;
  tags?: string[];
}

/**
 * Create project request
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    platform?: string;
  };
  variants?: Array<{
    name: string;
    code: string;
    description?: string;
  }>;
}

/**
 * Update project request
 */
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  vehicle?: {
    make?: string;
    model?: string;
    year?: number;
    platform?: string;
  };
  metadata?: {
    status?: 'draft' | 'review' | 'approved' | 'released';
    tags?: string[];
  };
}

/**
 * Import harness request
 */
export interface ImportHarnessRequest {
  projectId: string;
  format: 'kbl' | 'vec' | 'wireviz' | 'excel' | 'pdf';
  data: string | Buffer;
  options?: {
    mergeMode?: 'replace' | 'merge' | 'append';
    validateOnImport?: boolean;
  };
}

/**
 * Import harness response
 */
export interface ImportHarnessResponse {
  success: boolean;
  projectId: string;
  importedEntities: {
    ecus: number;
    connectors: number;
    pins: number;
    wires: number;
    splices: number;
  };
  warnings?: string[];
  errors?: string[];
  validationReport?: ValidationReport;
}

/**
 * Export harness request
 */
export interface ExportHarnessRequest {
  projectId: string;
  format: 'kbl' | 'vec' | 'wireviz' | 'excel' | 'pdf';
  options?: {
    includeValidation?: boolean;
    includeMetadata?: boolean;
  };
}

/**
 * Export harness response
 */
export interface ExportHarnessResponse {
  format: string;
  data: string | Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Validate harness request
 */
export interface ValidateHarnessRequest {
  projectId: string;
  constraintIds?: string[];
  options?: {
    stopOnFirstError?: boolean;
    includeWarnings?: boolean;
  };
}

/**
 * Add feature request
 */
export interface AddFeatureRequest {
  projectId: string;
  name: string;
  description: string;
  requirements: Array<{
    description: string;
    type: 'functional' | 'electrical' | 'physical' | 'regulatory';
    mandatory: boolean;
  }>;
}

/**
 * Create change request
 */
export interface CreateChangeRequest {
  projectId: string;
  title: string;
  description: string;
  requestedChanges: Record<string, unknown>;
}

/**
 * Approve change request
 */
export interface ApproveChangeRequest {
  changeRequestId: string;
  approvedBy: string;
  comments?: string;
}

/**
 * API response types
 */
export type ProjectResponse = Project;
export type ProjectListResponse = PaginatedResponse<Project>;
export type ECUResponse = ECU;
export type ConnectorResponse = Connector;
export type PinResponse = Pin;
export type WireResponse = Wire;
export type SpliceResponse = Splice;
export type FeatureResponse = Feature;
export type ComponentResponse = Component;
export type NetworkResponse = Network;
export type ChangeRequestResponse = ChangeRequest;
export type ValidationReportResponse = ValidationReport;
