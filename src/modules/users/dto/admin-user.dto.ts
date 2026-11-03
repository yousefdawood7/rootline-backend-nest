import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminUserItemSchema = z.object({
  id: z.string().describe('User ID'),
  name: z.string().describe('User name'),
  email: z.string().email().describe('User email'),
  emailVerified: z.boolean().describe('Email verification status'),
  role: z.string().describe('Assigned role'),
  banned: z.boolean().describe('Whether user is banned/deactivated'),
  banReason: z.string().nullable().optional().describe('Reason for ban'),
  image: z.string().nullable().optional().describe('Avatar image URL'),
  createdAt: z.string().describe('Creation timestamp in ISO 8601 format'),
  updatedAt: z.string().describe('Last update timestamp in ISO 8601 format'),
});

export type AdminUserItem = z.infer<typeof AdminUserItemSchema>;

export class AdminUserItemDto extends createZodDto(AdminUserItemSchema) {}

export const AdminUserQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .optional()
      .describe('Search query for user name or email'),
    role: z
      .string()
      .trim()
      .optional()
      .describe('Filter by role (e.g. ADMIN or CUSTOMER)'),
    banned: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional()
      .describe('Filter by banned status'),
    page: z.coerce.number().int().positive().default(1).describe('Page number'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20)
      .describe('Items per page (max 100)'),
  })
  .strict();

export type AdminUserQuery = z.infer<typeof AdminUserQuerySchema>;

export class AdminUserQueryDto extends createZodDto(AdminUserQuerySchema) {}

export const AdminUserListResponseSchema = z.object({
  items: z
    .array(AdminUserItemSchema)
    .describe('List of users matching criteria'),
  total: z.number().int().describe('Total matching count'),
  page: z.number().int().describe('Current page number'),
  limit: z.number().int().describe('Page limit'),
  totalPages: z.number().int().describe('Total available pages'),
});

export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;

export class AdminUserListResponseDto extends createZodDto(
  AdminUserListResponseSchema,
) {}

export const AdminUpdateUserStatusSchema = z
  .object({
    banned: z
      .boolean()
      .describe('Set to true to deactivate/ban or false to activate'),
    banReason: z
      .string()
      .trim()
      .max(255)
      .optional()
      .describe('Reason for deactivation/ban'),
  })
  .strict();

export type AdminUpdateUserStatusInput = z.infer<
  typeof AdminUpdateUserStatusSchema
>;

export class AdminUpdateUserStatusDto extends createZodDto(
  AdminUpdateUserStatusSchema,
) {}
