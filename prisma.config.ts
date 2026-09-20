import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'database/schema.prisma',
  migrations: {
    path: 'database/migrations',
    seed: 'ts-node --project database/tsconfig.json database/seeds/development.ts',
  },
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
