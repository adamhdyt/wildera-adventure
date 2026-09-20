import { ConfigService } from '@nestjs/config';
import { createApp } from './app';

async function bootstrap() {
  const app = await createApp();
  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>('PORT'), config.get('HOST'));
}

void bootstrap();
