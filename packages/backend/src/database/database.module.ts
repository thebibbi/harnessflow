import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ProjectRepository } from './repositories/project.repository';
import { ECURepository } from './repositories/ecu.repository';
import { WireRepository } from './repositories/wire.repository';
import { FeatureRepository } from './repositories/feature.repository';

/**
 * DatabaseModule
 *
 * Provides database access layer with:
 * - PrismaService: Database connection management
 * - Repositories: Data access layer for all entities
 *
 * This is a Global module, so it's automatically available
 * in all modules without needing to import it.
 *
 * Usage in other modules:
 * ```typescript
 * @Injectable()
 * export class ProjectService {
 *   constructor(
 *     private readonly projectRepo: ProjectRepository,
 *   ) {}
 * }
 * ```
 */
@Global()
@Module({
  providers: [PrismaService, ProjectRepository, ECURepository, WireRepository, FeatureRepository],
  exports: [PrismaService, ProjectRepository, ECURepository, WireRepository, FeatureRepository],
})
export class DatabaseModule {}
