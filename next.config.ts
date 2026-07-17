import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const withPWA = withPWAInit({
  dest: "public",
  // Re-enabling this in production (2026-07-17) broke the Vercel deploy:
  // "The framework produced an invalid deployment package for a Serverless
  // Function... produces files in symlinked directories." That's the same
  // failure mode commit 7ec82a9 already pinned on next-pwa's build-time
  // config patching interfering with Next's output file tracing — the
  // stray Prisma `output` path (b047fd5) explained the *500s*, but never
  // actually cleared next-pwa as a packaging-time suspect. Disabling again
  // until a tracing-safe next-pwa config is confirmed on a preview deploy.
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
