import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or fewer')
      .describe('Full name of the user'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address')
      .describe('Unique email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password must be 128 characters or fewer')
      .describe('Account password'),
  })
  .strict();

export type RegisterInput = z.infer<typeof RegisterSchema>;

export class RegisterDto extends createZodDto(RegisterSchema) {}
