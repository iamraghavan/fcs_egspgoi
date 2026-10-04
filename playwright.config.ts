/**
 * End-to-end tests in real browsers against a fully LOCAL stack:
 *   website  http://localhost:9002   (next dev, settings forced below)
 *   backend  http://127.0.0.1:5050   (backend/tests/support/testServer.js:
 *                                     DynamoDB Local + seeded test users, fake email/WhatsApp/GitHub)
 * Every browser request to any other host is blocked (see tests/e2e/fixtures.ts).
 */
import { defineConfig, devices } from '@playwright/test';

const API = 'http://127.0.0.1:5050';

// Forced over .env.local so the website can never talk to production.
const frontendEnv = {
  NEXT_PUBLIC_API_URL: `${API}/api/v1`,
  NEXT_PUBLIC_API_BASE_URL: API,
  NEXT_PUBLIC_FIREBASE_API_KEY: '', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: '', NEXT_PUBLIC_FIREBASE_PROJECT_ID: '',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: '', NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '', NEXT_PUBLIC_FIREBASE_APP_ID: '',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: '', NEXT_PUBLIC_FIREBASE_VAPID_KEY: '', NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: '',
  NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: 'e2e-site-key',
  NEXT_PUBLIC_ENFORCE_WHATSAPP_VERIFICATION: 'false',
  NEXT_PUBLIC_OA_USERNAME: 'not-a-real-account@example.org',
  MAINTENANCE_MODE: 'false',
  NEXT_TELEMETRY_DISABLED: '1',
};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1, // one shared test database
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    baseURL: 'http://localhost:9002',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox-desktop', grep: /@cross/, use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit-desktop', grep: /@cross/, use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chrome', grep: /@cross|@mobile/, use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', grep: /@cross|@mobile/, use: { ...devices['iPhone 14'] } },
  ],
  webServer: [
    {
      command: 'node ../backend/tests/support/testServer.js',
      url: `${API}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { TEST_SERVER_PORT: '5050', NO_RATE_LIMIT: '1', TEST_CORS_ORIGIN: 'http://localhost:9002', TEST_SERVER_PREFIX: 'fcs_e2e' },
    },
    {
      command: 'npx next dev -p 9002',
      url: 'http://localhost:9002/u/portal/auth',
      reuseExistingServer: false,
      timeout: 300_000,
      env: frontendEnv,
    },
  ],
});
