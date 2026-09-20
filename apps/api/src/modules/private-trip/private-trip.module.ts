import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { PrivateTripController } from './private-trip.controller';
import { PrivateTripService } from './private-trip.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PrivateTripController],
  providers: [PrivateTripService],
  exports: [PrivateTripService],
})
export class PrivateTripModule {}
