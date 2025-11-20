/**
 * GraphQL Module
 *
 * Configures GraphQL with resolvers and schema generation
 */

import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { GraphQLJSON } from 'graphql-type-json';

// Resolvers
import { ProjectResolver } from './resolvers/project.resolver';
import { WireResolver } from './resolvers/wire.resolver';
import { ImportResolver } from './resolvers/import.resolver';
import { ValidationResolver } from './resolvers/validation.resolver';

// Database and services
import { DatabaseModule } from '../database';
import { WireVizModule } from '../ingestion/wireviz';
import { ExcelModule } from '../ingestion/excel';
import { ValidationModule } from '../domain/validation';

@Module({
  imports: [
    NestGraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      resolvers: { JSON: GraphQLJSON },
      context: ({ req, res }: any) => ({ req, res }),
    }),
    DatabaseModule,
    WireVizModule,
    ExcelModule,
    ValidationModule,
  ],
  providers: [ProjectResolver, WireResolver, ImportResolver, ValidationResolver],
  exports: [],
})
export class GraphQLModule {}
