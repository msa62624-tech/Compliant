// Netlify Function for NestJS Backend
// This wraps the NestJS application to run as a serverless function
const serverless = require('serverless-http');
const path = require('path');
const cookieParser = require('cookie-parser');

let cachedHandler;

// Initialize the NestJS application
async function bootstrap() {
  if (!cachedHandler) {
    try {
      // Use environment variable or default path for backend module
      const backendPath = process.env.BACKEND_DIST_PATH || 
        path.join(__dirname, '..', '..', 'packages', 'backend', 'dist');
      
      const { NestFactory } = require('@nestjs/core');
      const { ValidationPipe } = require('@nestjs/common');
      const { AppModule } = require(path.join(backendPath, 'app.module'));
      
      const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
      });
      
      // CRITICAL: Enable cookie parser for JWT authentication
      app.use(cookieParser());
      
      // Enable CORS for Netlify frontend
      app.enableCors({
        origin: [
          process.env.FRONTEND_URL,
          process.env.URL,
          /\.netlify\.app$/,
        ].filter(Boolean),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
        exposedHeaders: ['Set-Cookie'],
      });
      
      // Global validation pipe
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );
      
      // Don't set global prefix for Netlify - routes are already compiled without prefix
      // Netlify redirect: /api/auth/login → /.netlify/functions/api/auth/login
      // serverless-http receives: /auth/login
      // Controllers: @Controller("auth") creates /auth/* routes
      // This matches perfectly!
      
      await app.init();
      
      const expressApp = app.getHttpAdapter().getInstance();
      cachedHandler = serverless(expressApp);
      
      console.log('NestJS app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NestJS app:', error);
      throw error;
    }
  }
  return cachedHandler;
}

// Netlify Function handler
exports.handler = async (event, context) => {
  // Prevent function from timing out
  context.callbackWaitsForEmptyEventLoop = false;
  
  // DIAGNOSTIC: Log environment and request details
  console.log('=== NETLIFY FUNCTION INVOKED ===');
  console.log('Path:', event.path);
  console.log('Method:', event.httpMethod);
  console.log('Environment check:');
  console.log('- USE_SIMPLE_AUTH:', process.env.USE_SIMPLE_AUTH);
  console.log('- NETLIFY:', process.env.NETLIFY);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  try {
    const handler = await bootstrap();
    const result = await handler(event, context);
    console.log('Function executed successfully, status:', result.statusCode);
    return result;
  } catch (error) {
    console.error('=== FUNCTION EXECUTION ERROR ===');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  }
};
