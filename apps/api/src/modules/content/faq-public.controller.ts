import { Controller, Get, Query } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('faqs')
export class FaqPublicController {
  constructor(private readonly service: ContentService) {}

  @Get()
  async list(@Query('category') category?: string) {
    const data = await this.service.listPublicFaqs(category);
    return { success: true, data };
  }
}
