import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingPublicController } from './setting-public.controller';
import { SettingController } from './setting.controller';

@Module({
  controllers: [SettingPublicController, SettingController],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
