// Server-side error tracking with Sentry (roadmap Q-8).
// Does nothing unless NEXT_PUBLIC_SENTRY_DSN is set.
import type { Instrumentation } from 'next';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (!dsn) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: 0,
  });
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!dsn) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
};
