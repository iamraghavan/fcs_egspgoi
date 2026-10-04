import '@testing-library/jest-dom';
import React from 'react';
import { server } from './server';

// --- Next.js router: controllable fake ---
export const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() };
export const mockNav = { pathname: '/u/portal/dashboard', search: new URLSearchParams() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockNav.pathname,
  useSearchParams: () => mockNav.search,
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// --- Animation / captcha / browser-only libraries ---
jest.mock('gsap', () => ({ gsap: { fromTo: jest.fn(), to: jest.fn(), from: jest.fn(), set: jest.fn(), timeline: () => ({ to: jest.fn(), from: jest.fn(), fromTo: jest.fn() }) } }));
jest.mock('react-turnstile', () => ({
  __esModule: true,
  // A button stands in for the Cloudflare widget so tests can "solve" it.
  default: ({ onVerify }: { onVerify: (t: string) => void }) =>
    React.createElement('button', { type: 'button', 'data-testid': 'turnstile', onClick: () => onVerify('test-turnstile-token') }, 'captcha'),
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  jest.clearAllMocks();
  mockNav.pathname = '/u/portal/dashboard';
  mockNav.search = new URLSearchParams();
});
afterAll(() => server.close());

// jsdom lacks these browser APIs used by UI libraries.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (q: string) => ({ matches: false, media: q, onchange: null, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn() }),
});
class RO { observe() {} unobserve() {} disconnect() {} }
(global as any).ResizeObserver = RO;
(global as any).IntersectionObserver = RO;
window.HTMLElement.prototype.scrollIntoView = jest.fn();
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();

// Firebase is not configured in tests (the app treats it as optional).
jest.mock('@/lib/firebase', () => ({ app: null, messaging: null, remoteConfig: null }));
jest.mock('firebase/messaging', () => ({ getToken: jest.fn(async () => null), onMessage: jest.fn(() => () => {}), isSupported: jest.fn(async () => false), getMessaging: jest.fn() }));
jest.mock('firebase/remote-config', () => ({ fetchAndActivate: jest.fn(), getValue: jest.fn(), getRemoteConfig: jest.fn() }));
