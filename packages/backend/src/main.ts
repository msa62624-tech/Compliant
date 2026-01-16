import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { winstonConfig } from './config/logger.config';

async function bootstrap() {
  // Create app with Winston logger
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Use Winston logger as the application logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Enable cookie parser for secure token storage
  app.use(cookieParser());

  // Enable CORS with credentials for cookie support
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Header-based versioning
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'X-API-Version',
    defaultVersion: '1',
  });

  // API prefix (removed version from path since we use header-based versioning)
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Compliant Platform API')
    .setDescription('Professional API for contractor and insurance management')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log('');
  console.log('🚀 Backend server is running!');
  console.log(`📍 API: http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
  console.log(`💡 Tip: Use 'X-API-Version' header for versioning (default: 1)`);
  console.log('');
}

bootstrap();
