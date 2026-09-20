import { Module } from '@nestjs/common';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { ContentModule } from './modules/content/content.module';
import { DestinationModule } from './modules/destination/destination.module';
import { MediaModule } from './modules/media/media.module';
import { MountainModule } from './modules/mountain/mountain.module';
import { PackageModule } from './modules/package/package.module';
import { ParticipantModule } from './modules/participant/participant.module';
import { PrivateTripModule } from './modules/private-trip/private-trip.module';
import { RouteModule } from './modules/route/route.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { SettingModule } from './modules/setting/setting.module';
import { TripModule } from './modules/trip/trip.module';
import { AppConfigModule } from './common/config/config.module';
import { DatabaseModule } from './common/database/database.module';
import { ErrorHandlingModule } from './common/error-handling/error-handling.module';
import { HealthModule } from './common/health/health.module';
import { LoggerModule } from './common/logger/logger.module';
import { AuthorizationModule } from './common/authorization/authorization.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    ErrorHandlingModule,
    AuthorizationModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    AdminModule,
    DestinationModule,
    MountainModule,
    RouteModule,
    TripModule,
    ScheduleModule,
    PackageModule,
    BookingModule,
    ParticipantModule,
    PrivateTripModule,
    ContentModule,
    MediaModule,
    SettingModule,
    AuditModule,
  ],
})
export class AppModule {}
