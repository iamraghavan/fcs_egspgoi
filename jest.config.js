// Frontend unit + page tests (Jest + React Testing Library + MSW).
// The backend is never called: MSW answers every request with fake data.
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const config = createJestConfig({
  testEnvironment: 'jest-fixed-jsdom',
  setupFiles: ['<rootDir>/tests/utils/env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.tsx'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts?(x)', '<rootDir>/tests/pages/**/*.test.ts?(x)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testEnvironmentOptions: { customExportConditions: [''] },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/ai/**', '!src/app/admissions/**', '!src/app/api/**',
    '!src/components/ui/**', '!src/lib/mock-data.ts', '!src/lib/placeholder-images.ts',
  ],
  coverageReporters: ['text-summary', 'text', 'lcov', 'json-summary'],
});

// MSW and a few of its helpers ship modern ES modules; let Jest compile them.
const ESM = ['msw', '@mswjs', '@bundled-es-modules', 'until-async', 'rettime', '@open-draft', 'headers-polyfill', 'outvariant', 'strict-event-emitter', 'is-node-process', 'graphql', 'tough-cookie', 'type-fest'];
module.exports = async () => {
  const resolved = await config();
  resolved.transformIgnorePatterns = [`node_modules/(?!(\.pnpm/)?(${ESM.join('|')}))`, '^.+\.module\.(css|sass|scss)$'];
  return resolved;
};
