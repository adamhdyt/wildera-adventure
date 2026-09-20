import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly database: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.database.checkConnection();
      return {
        status: 'ok',
        database: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database tidak tersedia.',
      });
    }
  }
}
