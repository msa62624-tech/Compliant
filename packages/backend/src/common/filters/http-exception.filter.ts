import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine if we're in production mode
    const isProduction = process.env.NODE_ENV === 'production';

    // Get the error message
    let message: string | object;
    
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      
      // In production, sanitize error messages to prevent information leakage
      if (isProduction && status >= 500) {
        // For 5xx errors in production, return generic message
        message = { message: 'Internal server error' };
      } else {
        // For 4xx errors or non-production, return the actual message
        message = exceptionResponse;
      }
    } else {
      // For non-HTTP exceptions, always return generic message in production
      if (isProduction) {
        message = { message: 'Internal server error' };
      } else {
        // In development, include error details for debugging
        message = {
          message: exception instanceof Error ? exception.message : 'Internal server error',
          stack: exception instanceof Error ? exception.stack : undefined,
        };
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof message === 'string' ? { message } : message),
    });
  }
}
