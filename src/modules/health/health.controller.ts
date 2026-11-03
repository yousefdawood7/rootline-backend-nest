import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { HealthResponseDto } from './dto/health-response.dto';
import { CustomPrismaHealthIndicator } from './prisma.health';
import { AllowAnonymous } from '../../common/decorators/auth.decorator';

@ApiTags('Health')
@AllowAnonymous()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: CustomPrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Performs an application health check verifying database reachability.',
  })
  @ApiOkResponse({
    description: 'Application and database are healthy',
    type: HealthResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'Application or database is unhealthy',
    type: HealthResponseDto,
  })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.prismaHealth.isHealthy('database')]);
  }
}
