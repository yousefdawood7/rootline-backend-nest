import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

const HTTP_STATUS_NAMES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let requestId = 'unknown-request-id';
    if (typeof request.id === 'string' && request.id.trim().length > 0) {
      requestId = request.id;
    } else if (typeof request.id === 'number') {
      requestId = request.id.toString();
    } else {
      const headerId = request.headers['x-request-id'];
      if (typeof headerId === 'string' && headerId.trim().length > 0) {
        requestId = headerId;
      }
    }

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let errors: Record<string, unknown>[] | undefined;

    if (exception instanceof ZodValidationException) {
      statusCode = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'Validation failed';
      const zodError = exception.getZodError();
      if (zodError && typeof zodError === 'object' && 'issues' in zodError) {
        errors = Array.isArray(zodError.issues)
          ? (zodError.issues as Record<string, unknown>[])
          : [];
      }
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responsePayload = exception.getResponse();

      if (
        typeof responsePayload === 'object' &&
        responsePayload !== null &&
        'message' in responsePayload
      ) {
        const payloadMessage = responsePayload.message;
        message = Array.isArray(payloadMessage)
          ? payloadMessage.join(', ')
          : String(payloadMessage);
      } else if (typeof responsePayload === 'string') {
        message = responsePayload;
      } else {
        message = exception.message;
      }

      code = this.getStatusCodeName(statusCode);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        code = 'RESOURCE_ALREADY_EXISTS';
        message = 'A resource with this unique field already exists';
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        code = 'RESOURCE_NOT_FOUND';
        message = 'The requested resource was not found';
      } else if (exception.code === 'P2003') {
        statusCode = HttpStatus.BAD_REQUEST;
        code = 'FOREIGN_KEY_VIOLATION';
        message = 'Referenced entity does not exist';
      } else {
        statusCode = HttpStatus.BAD_REQUEST;
        code = `DATABASE_ERROR_${exception.code}`;
        message = 'Database operation failed';
      }
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'statusCode' in exception &&
      typeof (exception as Record<string, unknown>).statusCode === 'number'
    ) {
      const errObj = exception as Record<string, unknown>;
      statusCode = errObj.statusCode as number;
      message =
        typeof errObj.message === 'string' ? errObj.message : 'Request failed';
      code =
        typeof errObj.status === 'string'
          ? errObj.status
          : this.getStatusCodeName(statusCode);
    } else if (exception instanceof Error) {
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message;
    }

    if (statusCode >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} - ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${requestId}] ${request.method} ${request.url} - ${statusCode} - ${message}`,
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      code,
      requestId,
      timestamp: new Date().toISOString(),
      ...(errors && errors.length > 0 ? { errors } : {}),
    });
  }

  private getStatusCodeName(statusCode: number): string {
    return (
      HTTP_STATUS_NAMES[statusCode] ??
      (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : `HTTP_ERROR_${statusCode}`)
    );
  }
}
