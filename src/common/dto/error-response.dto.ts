import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  statusCode: z.number().int().describe('HTTP status code'),
  message: z.string().describe('Error message'),
  code: z.string().describe('Machine-readable application error code'),
  requestId: z.string().describe('Unique request identifier for tracing'),
  timestamp: z
    .string()
    .describe('ISO 8601 timestamp of when the error occurred'),
  errors: z
    .array(z.record(z.string(), z.unknown()))
    .optional()
    .describe('Detailed validation error issues when applicable'),
});

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
