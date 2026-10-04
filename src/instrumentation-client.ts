// Browser error tracking with Sentry (roadmap Q-8).
// Loaded only when NEXT_PUBLIC_SENTRY_DSN is set, so it adds nothing otherwise.
// Tokens, cookies and URLs' query strings are removed before sending.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      tracesSampleRate: 0,
      beforeSend(event) {
        if (event.request) {
          delete event.request.cookies;
          delete event.request.data;
          if (event.request.headers) delete event.request.headers.Authorization;
          if (event.request.url) event.request.url = event.request.url.split('?')[0];
        }
        return event;
      },
    });
  });
}

export {};
