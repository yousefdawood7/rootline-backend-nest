import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CustomPrismaHealthIndicator } from './prisma.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [CustomPrismaHealthIndicator],
  exports: [CustomPrismaHealthIndicator],
})
export class HealthModule {}
