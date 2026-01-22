// Netlify Function for NestJS Backend
// This wraps the NestJS application to run as a serverless function
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');
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
      console.log('Current directory:', __dirname);
      console.log('Process cwd:', process.cwd());
      
      // CRITICAL: Determine backend dist path based on Netlify structure
      // In Netlify, included_files are copied relative to function directory
      // Try multiple possible paths
      const possiblePaths = [
        path.join(__dirname, '..', '..', 'packages', 'backend', 'dist'),
        path.join(process.cwd(), 'packages', 'backend', 'dist'),
        path.join(__dirname, '..', '..', '..', '..', 'packages', 'backend', 'dist'),
      ];
      
      let backendPath = null;
      for (const testPath of possiblePaths) {
        console.log('Testing path:', testPath);
        if (fs.existsSync(testPath)) {
          console.log('✓ Found backend dist at:', testPath);
          backendPath = testPath;
          break;
        } else {
          console.log('✗ Not found at:', testPath);
        }
      }
      
      if (!backendPath) {
        throw new Error(`Backend dist not found. Tried paths: ${possiblePaths.join(', ')}`);
      }
      
      console.log('Using backend path:', backendPath);
      console.log('Loading @nestjs/core...');
      const { NestFactory } = require('@nestjs/core');
      console.log('✓ @nestjs/core loaded');
      console.log('Loading @nestjs/common...');
      const { ValidationPipe } = require('@nestjs/common');
      console.log('✓ @nestjs/common loaded');
      
      // Check if app.module exists before requiring
      const appModulePath = path.join(backendPath, 'app.module');
      console.log('Looking for AppModule at:', appModulePath + '.js');
      if (!fs.existsSync(appModulePath + '.js')) {
        console.error('AppModule not found at:', appModulePath + '.js');
        console.error('Directory contents:', fs.readdirSync(backendPath));
        throw new Error(`AppModule not found at: ${appModulePath}.js`);
      }
      
      console.log('Loading AppModule from:', appModulePath);
      const { AppModule } = require(appModulePath);
      console.log('✓ AppModule loaded');
      
      console.log('Creating NestJS application...');
      // CRITICAL: Create app without Winston to avoid initialization issues in serverless
      // Winston is configured in AppModule, not here
      const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],  // Simple console logger for serverless
        abortOnError: false,  // Don't crash on init errors, log them
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
