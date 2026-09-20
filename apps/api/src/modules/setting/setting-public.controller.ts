import { Controller, Get } from '@nestjs/common';
import { SettingService } from './setting.service';

@Controller('site-settings')
export class SettingPublicController {
  constructor(private readonly service: SettingService) {}

  @Get('public')
  async getPublicSettings() {
    const data = await this.service.getPublicSettings();
    return { success: true, data };
  }
}
