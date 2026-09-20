import { Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripPublicController } from './trip-public.controller';
import { TripService } from './trip.service';

@Module({
  controllers: [TripController, TripPublicController],
  providers: [TripService],
  exports: [TripService],
})
export class TripModule {}
