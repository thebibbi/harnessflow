/**
 * Common types used throughout the application
 */

/**
 * Audit information for tracking entity changes
 */
export interface AuditInfo {
  at: Date;
  by: string;
  reason?: string;
}

/**
 * Base entity with audit fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  createdBy: string;
  modifiedAt: Date;
  modifiedBy: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
