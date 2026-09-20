import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev -w @wildera/api',
      cwd: '../..',
      url: 'http://127.0.0.1:3101/health',
      env: { PORT: '3101', NODE_ENV: 'test' },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --port 3100',
      url: 'http://127.0.0.1:3100/admin/login',
      env: {
        API_BASE_URL: 'http://127.0.0.1:3101/api/v1',
        APP_URL: 'http://127.0.0.1:3100',
      },
      reuseExistingServer: false,
    },
  ],
});
