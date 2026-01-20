import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from "nest-winston";
import { AppModule } from "./app.module";
import { winstonConfig } from "./config/logger.config";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  // Create app with Winston logger
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Use Winston logger as the application logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Global exception filter for error sanitization
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable cookie parser for secure token storage
  app.use(cookieParser());
  // Enable CORS with credentials for cookie support
  // Support multiple origins for production flexibility
  const corsOrigin =
    process.env.NODE_ENV === "production"
      ? process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
        : "https://compliant.example.com"
      : true; // Allow all origins in development

  app.enableCors({
    origin: corsOrigin,
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
  // Note: Versioning will be handled at application level if needed in the future
  // For now, all routes are v1 by default
  // app.enableVersioning({
  //   type: VersioningType.HEADER,
  //   header: "X-API-Version",
  //   defaultVersion: "1",
  // });

  // API prefix (removed version from path since we use header-based versioning)
  // NOTE: Controllers already have full paths, so this adds the /api prefix
  app.setGlobalPrefix("api");

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Compliant Platform API")
    .setDescription("Professional API for contractor and insurance management")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  // Get the Winston logger for startup messages
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log("");
  logger.log("🚀 Backend server is running!");
  logger.log(`📍 API: http://localhost:${port}/api`);
  logger.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
  logger.log(`💡 Tip: Use 'X-API-Version' header for versioning (default: 1)`);
  logger.log("");
}

bootstrap();
