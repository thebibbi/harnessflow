/**
 * Database Module - Exports
 *
 * Central export point for all database-related services and types.
 */

// Module
export { DatabaseModule } from './database.module';

// Services
export { PrismaService } from './prisma.service';

// Repositories
export { ProjectRepository, ProjectStats } from './repositories/project.repository';
export { ECURepository, SparePin } from './repositories/ecu.repository';
export { WireRepository, WirePath, EndpointInfo } from './repositories/wire.repository';
export {
  FeatureRepository,
  FeatureRequirements,
  FeatureImplementation,
  FeatureStats,
} from './repositories/feature.repository';

// Base Repository Interface
export {
  BaseRepository,
  QueryOptions,
  CreateInput,
  UpdateInput,
  PaginatedResult,
  createPaginatedResult,
} from './base.repository';
