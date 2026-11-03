import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppInfoResponseDto } from './app.dto';
import { AppService } from './app.service';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application info and docs route' })
  @ApiOkResponse({
    description: 'Application details and swagger documentation path',
    type: AppInfoResponseDto,
  })
  getRoot(): AppInfoResponseDto {
    return this.appService.getAppInfo();
  }
}
