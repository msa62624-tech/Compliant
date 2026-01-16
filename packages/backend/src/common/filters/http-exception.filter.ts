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

    // Environment-based error handling
    const isDev = process.env.NODE_ENV === 'development';
    
    const message =
      exception instanceof HttpException
        ? (isDev ? exception.getResponse() : 'Internal server error')
        : (isDev && exception instanceof Error 
            ? { message: 'Internal server error', error: exception.message, name: exception.name } 
            : { message: 'Internal server error' });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof message === 'string' ? { message } : message),
    });
  }
}
