import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Request } from 'express';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { createBetterAuth } from './config/auth.config';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { PrismaModule } from './database/prisma.module';
import { PrismaService } from './database/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BetterAuthModule.forRootAsync({
      imports: [PrismaModule],
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({
        auth: createBetterAuth(prisma),
        disableTrustedOriginsCors: true,
      }),
    }),
    AuthModule,
    UsersModule,
    HealthModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          genReqId: (req: IncomingMessage) => {
            const expressReq = req as Request;
            const headerId = expressReq.headers['x-request-id'];
            if (typeof headerId === 'string' && headerId.trim().length > 0) {
              return headerId;
            }
            return expressReq.id ?? randomUUID();
          },
          transport: config.isProduction
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              },
          level: config.isProduction ? 'info' : 'debug',
          autoLogging: true,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL'),
          limit: config.get('THROTTLE_LIMIT'),
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
