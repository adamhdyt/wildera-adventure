import { Controller, Get, Param, Query } from '@nestjs/common';
import { MountainService } from './mountain.service';

@Controller('mountains')
export class MountainPublicController {
  constructor(private readonly service: MountainService) {}

  @Get()
  async list(@Query() query: Record<string, unknown>) {
    const result = await this.service.listPublic(query);
    return { success: true, ...result };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const data = await this.service.getBySlugPublic(slug);
    return { success: true, data };
  }
}
