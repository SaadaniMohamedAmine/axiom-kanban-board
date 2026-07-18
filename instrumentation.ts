import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
      enabled: process.env.NODE_ENV === "production",
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
      enabled: process.env.NODE_ENV === "production",
    });
  }
}

// Required by @sentry/nextjs to capture errors thrown in nested React Server
// Components (Next.js's own onRequestError hook) — without this export the
// SDK logs an "outdated configuration" warning at build time.
export const onRequestError = Sentry.captureRequestError;
