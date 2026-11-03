import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z
    .enum(['ok', 'error', 'shutting_down'])
    .describe('Overall health check status'),
  info: z
    .record(z.string(), z.record(z.string(), z.unknown()))
    .optional()
    .describe('Healthy components information'),
  error: z
    .record(z.string(), z.record(z.string(), z.unknown()))
    .optional()
    .describe('Unhealthy components error details'),
  details: z
    .record(z.string(), z.record(z.string(), z.unknown()))
    .describe('Aggregated health check components details'),
});

export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}
