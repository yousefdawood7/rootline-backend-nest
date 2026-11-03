import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AuthUserResponseSchema } from './auth-response.dto';

export const SessionInfoSchema = z.object({
  id: z.string().describe('Session ID'),
  userId: z.string().describe('User ID'),
  expiresAt: z
    .string()
    .describe('Session expiration timestamp in ISO 8601 format'),
  token: z.string().describe('Session token'),
});

export const SessionResponseSchema = z.object({
  user: AuthUserResponseSchema.describe('Current authenticated user'),
  session: SessionInfoSchema.describe('Current session details'),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

export class SessionResponseDto extends createZodDto(SessionResponseSchema) {}
