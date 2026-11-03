import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AppInfoSchema = z.object({
  name: z.string().describe('Application name'),
  version: z.string().describe('Application version'),
  docs: z.string().describe('Swagger documentation route'),
});

export class AppInfoResponseDto extends createZodDto(AppInfoSchema) {}
