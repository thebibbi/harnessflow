import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable file uploads for GraphQL
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 HarnessFlow Backend running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🔍 GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap();
