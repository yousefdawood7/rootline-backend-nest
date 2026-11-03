import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AddressResponseSchema = z.object({
  id: z.string().describe('Address ID'),
  userId: z.string().describe('Owner user ID'),
  recipientName: z.string().describe('Full name of recipient'),
  phone: z.string().describe('Contact phone number'),
  street: z.string().describe('Street address and building number'),
  line2: z.string().nullable().optional().describe('Apartment, suite, or unit'),
  city: z.string().describe('City name'),
  state: z.string().nullable().optional().describe('State or province'),
  postalCode: z.string().describe('Postal or ZIP code'),
  country: z.string().describe('Country name or code'),
  isDefault: z
    .boolean()
    .describe('Whether this is the default shipping address'),
  createdAt: z.string().describe('Creation timestamp in ISO 8601 format'),
  updatedAt: z.string().describe('Last update timestamp in ISO 8601 format'),
});

export type AddressResponse = z.infer<typeof AddressResponseSchema>;

export class AddressResponseDto extends createZodDto(AddressResponseSchema) {}

export const CreateAddressSchema = z
  .object({
    recipientName: z
      .string()
      .trim()
      .min(1, 'Recipient name is required')
      .max(100, 'Recipient name must be 100 characters or fewer')
      .describe('Full recipient name'),
    phone: z
      .string()
      .trim()
      .min(5, 'Phone must be at least 5 characters')
      .max(30, 'Phone must be 30 characters or fewer')
      .describe('Contact telephone number'),
    street: z
      .string()
      .trim()
      .min(1, 'Street is required')
      .max(255, 'Street must be 255 characters or fewer')
      .describe('Street address line'),
    line2: z
      .string()
      .trim()
      .max(255)
      .optional()
      .describe('Apartment, suite, unit (optional)'),
    city: z
      .string()
      .trim()
      .min(1, 'City is required')
      .max(100, 'City must be 100 characters or fewer')
      .describe('City'),
    state: z
      .string()
      .trim()
      .max(100)
      .optional()
      .describe('State or province (optional)'),
    postalCode: z
      .string()
      .trim()
      .min(1, 'Postal code is required')
      .max(20, 'Postal code must be 20 characters or fewer')
      .describe('Postal code'),
    country: z
      .string()
      .trim()
      .min(2, 'Country must be at least 2 characters')
      .max(100, 'Country must be 100 characters or fewer')
      .describe('Country code or name'),
    isDefault: z
      .boolean()
      .optional()
      .default(false)
      .describe('Set as default shipping address'),
  })
  .strict();

export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;

export class CreateAddressDto extends createZodDto(CreateAddressSchema) {}

export const UpdateAddressSchema = z
  .object({
    recipientName: z
      .string()
      .trim()
      .min(1, 'Recipient name cannot be empty')
      .max(100)
      .optional()
      .describe('Full recipient name'),
    phone: z
      .string()
      .trim()
      .min(5)
      .max(30)
      .optional()
      .describe('Contact phone number'),
    street: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .optional()
      .describe('Street line'),
    line2: z
      .string()
      .trim()
      .max(255)
      .nullable()
      .optional()
      .describe('Apartment or suite'),
    city: z.string().trim().min(1).max(100).optional().describe('City'),
    state: z
      .string()
      .trim()
      .max(100)
      .nullable()
      .optional()
      .describe('State or province'),
    postalCode: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .optional()
      .describe('Postal code'),
    country: z.string().trim().min(2).max(100).optional().describe('Country'),
    isDefault: z
      .boolean()
      .optional()
      .describe('Set as default shipping address'),
  })
  .strict();

export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;

export class UpdateAddressDto extends createZodDto(UpdateAddressSchema) {}

export const DeleteAddressResponseSchema = z.object({
  success: z.boolean().describe('Whether address was deleted'),
  message: z.string().describe('Confirmation message'),
});

export type DeleteAddressResponse = z.infer<typeof DeleteAddressResponseSchema>;

export class DeleteAddressResponseDto extends createZodDto(
  DeleteAddressResponseSchema,
) {}
