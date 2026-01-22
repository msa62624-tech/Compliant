// Netlify Function for NestJS Backend
// This wraps the NestJS application to run as a serverless function
const serverless = require('serverless-http');
const path = require('path');
const cookieParser = require('cookie-parser');

let cachedHandler;
let initializationError = null;

// Global error handlers to catch unhandled rejections/exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED PROMISE REJECTION ===');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
});

// Initialize the NestJS application
async function bootstrap() {
  if (initializationError) {
    console.error('Previous initialization failed, throwing cached error');
    throw initializationError;
  }
  
  if (!cachedHandler) {
    try {
      console.log('=== STARTING NEST APP BOOTSTRAP ===');
      
      // Use environment variable or default path for backend module
      const backendPath = process.env.BACKEND_DIST_PATH || 
        path.join(__dirname, '..', '..', 'packages', 'backend', 'dist');
      
      console.log('Backend path:', backendPath);
      console.log('Loading @nestjs/core...');
      const { NestFactory } = require('@nestjs/core');
      console.log('Loading @nestjs/common...');
      const { ValidationPipe } = require('@nestjs/common');
      console.log('Loading AppModule from:', path.join(backendPath, 'app.module'));
      const { AppModule } = require(path.join(backendPath, 'app.module'));
      
      console.log('Creating NestJS application...');
      const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        abortOnError: false,
      });
      
      console.log('NestJS app created, adding middleware...');
      
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
      
      console.log('CORS enabled, adding validation pipe...');
      
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
      
      console.log('Initializing NestJS app...');
      await app.init();
      
      console.log('Getting Express instance...');
      const expressApp = app.getHttpAdapter().getInstance();
      console.log('Creating serverless handler...');
      cachedHandler = serverless(expressApp, {
        basePath: '',
        // Add request/response interceptors for debugging
        request: (req) => {
          console.log('Incoming request:', req.method, req.url);
        },
        response: (res) => {
          console.log('Outgoing response:', res.statusCode);
        }
      });
      
      console.log('=== NEST APP BOOTSTRAP COMPLETE ===');
    } catch (error) {
      console.error('=== FAILED TO INITIALIZE NESTJS APP ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.cause) {
        console.error('Error cause:', error.cause);
      }
      initializationError = error;
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
