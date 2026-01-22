<<<<<<< HEAD
// Netlify Function for NestJS Backend
// This wraps the NestJS application to run as a serverless function
const serverless = require('serverless-http');
const path = require('path');

let cachedHandler;

=======
// Netlify Function for NestJS Backend (Source - will be bundled by esbuild)
// This wraps the NestJS application to run as a serverless function
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

let cachedHandler;

// Helper function to recursively list directory contents
function listDirectory(dir, prefix = '', maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];
  try {
    const items = fs.readdirSync(dir);
    let results = [];
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(`${prefix}${item}/`);
          if (currentDepth < maxDepth - 1) {
            results = results.concat(listDirectory(fullPath, `${prefix}${item}/`, maxDepth, currentDepth + 1));
          }
        } else {
          results.push(`${prefix}${item}`);
        }
      } catch (e) {
        // Skip files we can't stat
      }
    }
    return results;
  } catch (e) {
    return [`Error reading directory: ${e.message}`];
  }
}

>>>>>>> copilot/fix-module-not-found-error
// Initialize the NestJS application
async function bootstrap() {
  if (!cachedHandler) {
    try {
<<<<<<< HEAD
      // Use environment variable or default path for backend module
      const backendPath = process.env.BACKEND_DIST_PATH || 
        path.join(__dirname, '..', '..', 'packages', 'backend', 'dist');
      
=======
      console.log('=== Netlify Function Initialization Debug ===');
      console.log('__dirname:', __dirname);
      console.log('process.cwd():', process.cwd());
      console.log('');
      
      // List current directory contents to help debug path issues
      console.log('Contents of __dirname:');
      const dirContents = listDirectory(__dirname, '', 2);
      dirContents.slice(0, 50).forEach(item => console.log('  ', item));
      if (dirContents.length > 50) {
        console.log(`  ... and ${dirContents.length - 50} more items`);
      }
      console.log('');
      
      // Find the backend dist directory
      // In Netlify Functions with esbuild bundler, included_files are relative to base
      // Base is packages/frontend, included_files are ../backend/dist/**, etc.
      // Files should be accessible relative to the function
      const possiblePaths = [
        process.env.BACKEND_DIST_PATH,
        path.resolve(__dirname, 'backend', 'dist'),
        path.join(__dirname, 'backend', 'dist'),
        path.resolve(__dirname, '..', 'backend', 'dist'),
        path.join(__dirname, '..', 'backend', 'dist'),
        path.resolve(__dirname, 'packages', 'backend', 'dist'),
        path.resolve(__dirname, '..', '..', 'packages', 'backend', 'dist'),
        path.join(__dirname, 'packages', 'backend', 'dist'),
        path.join(__dirname, 'dist'),
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
      console.log('');
      
      if (!backendPath) {
        console.error('❌ Could not find backend dist directory');
        console.error('Tried paths:', possiblePaths);
        throw new Error('Backend dist directory not found. Check Netlify function logs for directory structure.');
      }
      
      // With esbuild bundling, dependencies are included in the bundle
>>>>>>> copilot/fix-module-not-found-error
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
      
<<<<<<< HEAD
      // NOTE: Do NOT set globalPrefix here as the redirect already maps /api/* to this function
      // The backend routes already have /api in them from the NestJS configuration
      
=======
>>>>>>> copilot/fix-module-not-found-error
      await app.init();
      
      const expressApp = app.getHttpAdapter().getInstance();
      cachedHandler = serverless(expressApp);
      
<<<<<<< HEAD
      console.log('NestJS app initialized successfully');
=======
      console.log('✓ NestJS app initialized successfully');
>>>>>>> copilot/fix-module-not-found-error
    } catch (error) {
      console.error('Failed to initialize NestJS app:', error);
      throw error;
    }
  }
  return cachedHandler;
}

<<<<<<< HEAD
=======

>>>>>>> copilot/fix-module-not-found-error
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
