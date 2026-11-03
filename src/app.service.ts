import { Injectable } from '@nestjs/common';
import { AppInfoResponseDto } from './app.dto';

@Injectable()
export class AppService {
  getAppInfo(): AppInfoResponseDto {
    return {
      name: 'rootline-backend-nest',
      version: '0.0.1',
      docs: '/docs',
    };
  }
}
