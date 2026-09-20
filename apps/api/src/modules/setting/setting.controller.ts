import { Controller, Get, Patch, Param, Body, Req } from '@nestjs/common';
import { Authorize } from '../../common/authorization/authorize.decorator';
import { Permission } from '../../common/authorization/permission';
import { SettingService } from './setting.service';
import type { AuthenticatedRequest } from '../auth/auth.types';
import type { RequestWithId } from '../../common/logger/request-context';

@Controller('admin/site-settings')
export class SettingController {
  constructor(private readonly service: SettingService) {}

  @Get()
  @Authorize(Permission.SETTING_VIEW)
  async getSettings() {
    const data = await this.service.getAllAdminSettings();
    return { success: true, data };
  }

  @Patch(':key')
  @Authorize(Permission.SETTING_MANAGE)
  async updateSetting(
    @Param('key') key: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    const adminId = request.admin?.id;
    const data = await this.service.updateSetting(key, body, adminId);
    return { success: true, data };
  }
}
