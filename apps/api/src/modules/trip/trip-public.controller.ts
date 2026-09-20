import { Controller, Get, Param, Query } from '@nestjs/common';
import { TripService } from './trip.service';

@Controller('trips')
export class TripPublicController {
  constructor(private readonly service: TripService) {}

  @Get()
  async list(@Query() query: Record<string, unknown>) {
    const result = await this.service.listPublic(query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const data = await this.service.getBySlugPublic(slug);
    return { success: true, data };
  }
}
