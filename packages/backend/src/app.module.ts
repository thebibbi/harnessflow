import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { GraphQLModule } from '@nestjs/graphql';
// import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
// import { join } from 'path';
// import { Request, Response } from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database module (Prisma + Repositories)
    DatabaseModule,

    // GraphQL configuration - will be added back once we have resolvers
    // GraphQLModule.forRoot<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    //   sortSchema: true,
    //   playground: true,
    //   context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    // }),

    // Feature modules will be added here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
