import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address')
      .describe('User email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .max(128, 'Password must be 128 characters or fewer')
      .describe('Account password'),
  })
  .strict();

export type LoginInput = z.infer<typeof LoginSchema>;

export class LoginDto extends createZodDto(LoginSchema) {}
