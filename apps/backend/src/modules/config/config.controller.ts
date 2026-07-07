import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ConfigService } from './config.service';
import type { SystemConfig } from './config.service';

@Controller('api/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfig() {
    return this.configService.getConfig();
  }

  @Put()
  updateConfig(@Body() config: Partial<SystemConfig>) {
    return this.configService.updateConfig(config);
  }

  @Post('reset')
  resetConfig() {
    return this.configService.resetConfig();
  }
}
