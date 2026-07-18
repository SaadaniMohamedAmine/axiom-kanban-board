import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
  enabled: process.env.NODE_ENV === "production",
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error exception captured",
    "Network request failed",
  ],
});

// Required by @sentry/nextjs so client-side route transitions are captured —
// without this export the SDK logs an "ACTION REQUIRED" warning at build time.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
