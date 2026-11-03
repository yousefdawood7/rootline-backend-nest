import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AuthUserResponseSchema = z.object({
  id: z.string().describe('Unique user identifier'),
  name: z.string().describe('User full name'),
  email: z.string().email().describe('User email address'),
  emailVerified: z.boolean().describe('Whether the user email is verified'),
  role: z.string().describe('User role (ADMIN or CUSTOMER)'),
  image: z.string().nullable().optional().describe('User avatar URL'),
  createdAt: z
    .string()
    .describe('Account creation timestamp in ISO 8601 format'),
});

export type AuthUserResponse = z.infer<typeof AuthUserResponseSchema>;

export class AuthUserResponseDto extends createZodDto(AuthUserResponseSchema) {}

export const AuthResponseSchema = z.object({
  user: AuthUserResponseSchema.describe('Authenticated user profile'),
  token: z.string().describe('Bearer session token'),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}

export const SignOutResponseSchema = z.object({
  success: z.boolean().describe('Whether logout was successful'),
  message: z.string().describe('Confirmation message'),
});

export type SignOutResponse = z.infer<typeof SignOutResponseSchema>;

export class SignOutResponseDto extends createZodDto(SignOutResponseSchema) {}
