import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^\/(?!api).*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "axiom-pages",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Prisma 7's driver-adapter client loads its runtime via a computed
  // require() (e.g. "@prisma/client-<hash>"), which Vercel's static file
  // tracer can't follow — without this, the deployed function is missing
  // @prisma/client-runtime-utils and every DB-touching route 500s.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client-runtime-utils/**/*",
    ],
  },
};

export default withSentryConfig(withPWA(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
