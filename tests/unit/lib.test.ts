import { cn } from '@/lib/utils';

describe('api-url', () => {
  test('uses NEXT_PUBLIC_API_URL origin and builds /api/v1', () => {
    jest.isolateModules(() => {
      const m = require('@/lib/api-url');
      expect(m.API_ORIGIN).toBe('http://api.test');
      expect(m.API_V1).toBe('http://api.test/api/v1');
    });
  });
  test('falls back to NEXT_PUBLIC_API_BASE_URL', () => {
    const old = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://backup.test/x';
    jest.isolateModules(() => expect(require('@/lib/api-url').API_ORIGIN).toBe('https://backup.test'));
    process.env.NEXT_PUBLIC_API_URL = old;
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test';
  });
  test('with no setting, API calls become relative (same site)', () => {
    const a = process.env.NEXT_PUBLIC_API_URL; const b = process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_URL; delete process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.isolateModules(() => expect(require('@/lib/api-url').API_V1).toBe('/api/v1'));
    process.env.NEXT_PUBLIC_API_URL = a; process.env.NEXT_PUBLIC_API_BASE_URL = b;
  });
});

describe('cn()', () => {
  test('merges and de-duplicates Tailwind classes', () => {
    expect(cn('p-2', 'p-4', false && 'x', 'text-sm')).toBe('p-4 text-sm');
  });
});
