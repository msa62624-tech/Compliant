// Netlify Function for NestJS Backend (Source - will be bundled by esbuild)
// This wraps the NestJS application to run as a serverless function
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

let cachedHandler;

// Initialize the NestJS application
async function bootstrap() {
  if (!cachedHandler) {
    try {
      console.log('=== Netlify Function Initialization ===');
      console.log('__dirname:', __dirname);
      console.log('process.cwd():', process.cwd());
      
      // Find the backend dist directory
      // In bundled functions, the backend files are included via included_files
      const possiblePaths = [
        process.env.BACKEND_DIST_PATH,
        path.resolve(__dirname, 'packages', 'backend', 'dist'),
        path.resolve(__dirname, 'backend', 'dist'),
        path.join(__dirname, 'packages', 'backend', 'dist'),
        path.join(__dirname, 'backend', 'dist'),
      ].filter(Boolean);
      
      let backendPath = null;
      console.log('Searching for backend in possible paths:');
      for (const testPath of possiblePaths) {
        const appModulePath = path.join(testPath, 'app.module.js');
        const exists = fs.existsSync(appModulePath);
        console.log(`  ${exists ? '✓' : '✗'} ${testPath}`);
        if (exists) {
          backendPath = testPath;
          console.log('  Found backend at:', backendPath);
          break;
        }
      }
      
      if (!backendPath) {
        console.error('❌ Could not find backend dist directory');
        console.error('Tried paths:', possiblePaths);
        throw new Error('Backend dist directory not found');
      }
      
      // With esbuild bundling, dependencies are included in the bundle
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
      
      await app.init();
      
      const expressApp = app.getHttpAdapter().getInstance();
      cachedHandler = serverless(expressApp);
      
      console.log('✓ NestJS app initialized successfully');
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
