import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const withPWA = withPWAInit({
  dest: "public",
  // EMERGENCY: force-disabled — next-pwa's webpack/turbopack config
  // patching breaks Vercel's serverless output file tracing, causing
  // every DB-touching route to 500 with "Cannot find module
  // '@prisma/client-runtime-utils'" in production. Re-enable once a
  // tracing-safe next-pwa config (or alternative) is confirmed working
  // on a preview deployment.
  disable: true,
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
  // A stray lockfile outside the project (e.g. C:\Users\<user>\package-lock.json)
  // makes Next.js/Turbopack misdetect the workspace root, which breaks build
  // manifest resolution entirely. Pin the root explicitly to this project.
  turbopack: {
    root: path.join(__dirname),
  },
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

export default withSentryConfig(withNextIntl(withPWA(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
