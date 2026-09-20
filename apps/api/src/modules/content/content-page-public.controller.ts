import { Controller, Get, Param } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content-pages')
export class ContentPagePublicController {
  constructor(private readonly service: ContentService) {}

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const data = await this.service.getPublicContentPage(slug);
    return { success: true, data };
  }
}
