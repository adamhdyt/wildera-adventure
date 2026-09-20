import { Module } from '@nestjs/common';
import { DestinationController } from './destination.controller';
import { DestinationPublicController } from './destination-public.controller';
import { DestinationService } from './destination.service';

@Module({
  controllers: [DestinationController, DestinationPublicController],
  providers: [DestinationService],
  exports: [DestinationService],
})
export class DestinationModule {}
