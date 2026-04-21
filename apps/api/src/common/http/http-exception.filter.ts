import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = isHttpException ? exception.getResponse() : null;

    const error =
      typeof payload === 'object' && payload !== null
        ? payload
        : {
            code: status === HttpStatus.INTERNAL_SERVER_ERROR
              ? 'INTERNAL_SERVER_ERROR'
              : 'HTTP_ERROR',
            message:
              payload && typeof payload === 'string'
                ? payload
                : 'Unexpected server error',
          };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception for ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    }

    response.status(status).json({
      success: false,
      error,
      meta: {
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
