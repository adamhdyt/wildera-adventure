import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentPagePublicController } from './content-page-public.controller';
import { FaqPublicController } from './faq-public.controller';
import { FaqController } from './faq.controller';
import { ContentPageController } from './content-page.controller';

@Module({
  controllers: [
    FaqPublicController,
    ContentPagePublicController,
    FaqController,
    ContentPageController,
  ],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
