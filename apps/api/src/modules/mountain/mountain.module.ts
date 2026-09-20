import { Module } from '@nestjs/common';
import { MountainController } from './mountain.controller';
import { MountainPublicController } from './mountain-public.controller';
import { MountainService } from './mountain.service';

@Module({
  controllers: [MountainController, MountainPublicController],
  providers: [MountainService],
  exports: [MountainService],
})
export class MountainModule {}
