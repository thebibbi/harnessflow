import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { LLMModule } from './llm';
import { GraphQLModule } from './graphql/graphql.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database module (Prisma + Repositories)
    DatabaseModule,

    // LLM module (Local LLM integration for AI-assisted features)
    LLMModule,

    // GraphQL API
    GraphQLModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
