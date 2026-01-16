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
    
    let message: any;
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      // Sanitize HttpException response to only include safe properties
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const safeResponse: any = {};
        // Only include known safe properties
        if ('message' in exceptionResponse) safeResponse.message = exceptionResponse.message;
        if ('error' in exceptionResponse) safeResponse.error = exceptionResponse.error;
        if ('statusCode' in exceptionResponse) safeResponse.statusCode = exceptionResponse.statusCode;
        message = isDev ? safeResponse : 'Internal server error';
      } else {
        message = isDev ? exceptionResponse : 'Internal server error';
      }
    } else if (exception instanceof Error) {
      message = isDev 
        ? { message: 'Internal server error', error: exception.message, name: exception.name } 
        : { message: 'Internal server error' };
    } else {
      message = { message: 'Internal server error' };
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof message === 'string' ? { message } : message),
    });
  }
}
