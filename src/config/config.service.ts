import { Injectable } from '@nestjs/common';
import { env, Env, parseCorsOrigins } from './env';

@Injectable()
export class ConfigService {
  readonly env: Env = env;

  get<K extends keyof Env>(key: K): Env[K] {
    return this.env[key];
  }

  get corsOrigins(): string[] {
    return parseCorsOrigins(this.env.CORS_ORIGIN);
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }
}
