/**
 * Base Repository Interface
 *
 * Defines common CRUD operations that all repositories should implement.
 * Generic type T represents the entity type (Project, ECU, Wire, etc.)
 *
 * Usage:
 * ```typescript
 * export class ProjectRepository implements BaseRepository<Project> {
 *   // Implement all methods...
 * }
 * ```
 */
export interface BaseRepository<T> {
  /**
   * Find a single entity by ID
   * @param id - Entity ID
   * @returns Entity or null if not found
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find multiple entities matching criteria
   * @param query - Query parameters
   * @returns Array of entities
   */
  findMany(query?: QueryOptions<T>): Promise<T[]>;

  /**
   * Find a single entity matching criteria
   * @param query - Query parameters
   * @returns Entity or null if not found
   */
  findOne(query: QueryOptions<T>): Promise<T | null>;

  /**
   * Create a new entity
   * @param data - Entity data
   * @returns Created entity
   */
  create(data: CreateInput<T>): Promise<T>;

  /**
   * Update an existing entity
   * @param id - Entity ID
   * @param data - Updated data
   * @returns Updated entity
   */
  update(id: string, data: UpdateInput<T>): Promise<T>;

  /**
   * Delete an entity
   * @param id - Entity ID
   * @returns Deleted entity
   */
  delete(id: string): Promise<T>;

  /**
   * Count entities matching criteria
   * @param query - Query parameters
   * @returns Count of entities
   */
  count(query?: QueryOptions<T>): Promise<number>;

  /**
   * Check if entity exists
   * @param id - Entity ID
   * @returns True if entity exists
   */
  exists(id: string): Promise<boolean>;
}

/**
 * Query options for findMany/findOne operations
 */
export interface QueryOptions<T> {
  where?: Partial<T> | any;
  orderBy?: any;
  skip?: number;
  take?: number;
  include?: any;
  select?: any;
}

/**
 * Type helpers for create/update operations
 * These will be overridden by specific repository implementations
 */
export type CreateInput<T> = Partial<T> | any;
export type UpdateInput<T> = Partial<T> | any;

/**
 * Pagination result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Helper function to create paginated results
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
