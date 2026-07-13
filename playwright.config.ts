import { defineConfig, devices } from '@playwright/test';

const basePath = process.env.VITE_BASE_PATH || '/anaesthesie-rechner/';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'dot' : 'list',
  use: {
    baseURL: `http://127.0.0.1:4173${basePath}`,
    trace: 'on-first-retry'
  },
  webServer: {
    command: `VITE_BASE_PATH=${basePath} pnpm build && VITE_BASE_PATH=${basePath} pnpm preview --host 127.0.0.1`,
    url: `http://127.0.0.1:4173${basePath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] }
    }
  ]
});
