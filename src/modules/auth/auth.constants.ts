import { createBetterAuth } from '../../config/auth.config';

export const BETTER_AUTH = Symbol('BETTER_AUTH');
export type BetterAuthClient = ReturnType<typeof createBetterAuth>;
