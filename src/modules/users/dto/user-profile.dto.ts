import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().describe('User unique identifier'),
  name: z.string().describe('User full name'),
  email: z.string().email().describe('User email address'),
  emailVerified: z.boolean().describe('Whether email address is verified'),
  role: z.string().describe('User role'),
  image: z.string().nullable().optional().describe('Avatar image URL'),
  createdAt: z.string().describe('Creation timestamp in ISO 8601 format'),
  updatedAt: z.string().describe('Last update timestamp in ISO 8601 format'),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export class UserProfileDto extends createZodDto(UserProfileSchema) {}

export const UpdateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name cannot be empty')
      .max(100, 'Name must be 100 characters or fewer')
      .optional()
      .describe('Updated full name'),
    image: z
      .string()
      .url('Image must be a valid URL')
      .nullable()
      .optional()
      .describe('Avatar image URL or null to remove'),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
