// Netlify Function for NestJS Backend
// This wraps the NestJS application to run as a serverless function
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

let cachedHandler;

// Initialize the NestJS application
async function bootstrap() {
  if (!cachedHandler) {
    try {
      // In Netlify Functions, included_files are relative to the function
      // Try multiple possible paths to handle different deployment structures
      const possiblePaths = [
        process.env.BACKEND_DIST_PATH,
        path.resolve(__dirname, 'packages', 'backend', 'dist'),
        path.resolve(__dirname, '..', '..', 'packages', 'backend', 'dist'),
        path.join(__dirname, 'packages', 'backend', 'dist'),
      ].filter(Boolean);
      
      let backendPath = null;
      for (const testPath of possiblePaths) {
        const appModulePath = path.join(testPath, 'app.module.js');
        if (fs.existsSync(appModulePath)) {
          backendPath = testPath;
          console.log('Found backend at:', backendPath);
          break;
        }
      }
      
      if (!backendPath) {
        console.error('Could not find backend dist directory');
        console.error('__dirname:', __dirname);
        console.error('Tried paths:', possiblePaths);
        throw new Error('Backend dist directory not found');
      }
      
      const { NestFactory } = require('@nestjs/core');
      const { AppModule } = require(path.join(backendPath, 'app.module'));
      
      const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
      });
      
      // Enable CORS for Netlify frontend
      app.enableCors({
        origin: [
          process.env.FRONTEND_URL,
          process.env.URL,
          /\.netlify\.app$/,
        ].filter(Boolean),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      });
      
      // NOTE: Do NOT set globalPrefix here as the redirect already maps /api/* to this function
      // The backend routes already have /api in them from the NestJS configuration
      
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
  
  try {
    const handler = await bootstrap();
    return await handler(event, context);
  } catch (error) {
    console.error('Function execution error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
    };
  }
};
