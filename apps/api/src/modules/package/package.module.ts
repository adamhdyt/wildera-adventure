import { Module } from '@nestjs/common';
import { MeetingPointController } from './meeting-point.controller';
import { MeetingPointService } from './meeting-point.service';
import { PackageController } from './package.controller';
import { PackageService } from './package.service';

@Module({
  controllers: [MeetingPointController, PackageController],
  providers: [MeetingPointService, PackageService],
  exports: [MeetingPointService, PackageService],
})
export class PackageModule {}
