import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BETTER_AUTH } from './auth.constants';
import { PrismaModule } from '../../database/prisma.module';
import { PrismaService } from '../../database/prisma.service';
import { createBetterAuth } from '../../config/auth.config';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    {
      provide: BETTER_AUTH,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => createBetterAuth(prisma),
    },
    AuthService,
  ],
  exports: [AuthService, BETTER_AUTH],
})
export class AuthModule {}
