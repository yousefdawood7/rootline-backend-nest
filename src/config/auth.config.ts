import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { admin, bearer, createAccessControl } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const adminStatements = {
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'impersonate-admins',
    'delete',
    'set-password',
    'set-email',
    'set-phone',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
} as const;

const ac = createAccessControl(adminStatements);

const adminRole = ac.newRole({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
    'set-email',
    'set-phone',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
});

const customerRole = ac.newRole({
  user: [],
  session: [],
});

export const createBetterAuth = (prisma: PrismaClient) => {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    disabledPaths: ['/sign-up/email', '/sign-in/email'],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: {
      cookieCache: {
        enabled: false,
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
    },
    plugins: [
      admin({
        adminRoles: ['ADMIN'],
        defaultRole: 'CUSTOMER',
        ac,
        roles: {
          ADMIN: adminRole,
          CUSTOMER: customerRole,
        },
      }),
      bearer(),
    ],
  });
};

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
