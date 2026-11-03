import 'dotenv/config';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url('DATABASE_URL must be a valid URL'),
    DATABASE_URL_UNPOOLED: z
      .string()
      .min(1, 'DATABASE_URL_UNPOOLED is required')
      .url('DATABASE_URL_UNPOOLED must be a valid URL'),
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:3000')
      .refine(
        () => {
          if (process.env.NODE_ENV === 'production') {
            const val = process.env.CORS_ORIGIN;
            return typeof val === 'string' && val.trim().length > 0;
          }
          return true;
        },
        {
          message: 'CORS_ORIGIN is required in production',
        },
      ),
    THROTTLE_TTL: z.coerce.number().int().positive().default(60000),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;

export const parseCorsOrigins = (rawOrigin: string): string[] => {
  return rawOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};
