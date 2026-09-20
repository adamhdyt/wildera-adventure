import { Controller, Get } from '@nestjs/common';
import { DestinationService } from './destination.service';

@Controller('destinations')
export class DestinationPublicController {
  constructor(private readonly service: DestinationService) {}

  @Get()
  async list() {
    const data = await this.service.listPublic();
    return { success: true, data };
  }
}
