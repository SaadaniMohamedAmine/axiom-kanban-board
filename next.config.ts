import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const withPWA = withPWAInit({
  dest: "public",
  // Previously force-disabled after being suspected in a prod incident
  // where DB-touching routes 500'd with "Cannot find module
  // '@prisma/client-runtime-utils'". The real cause was a stray custom
  // Prisma generator `output` path (unrelated to this plugin) plus a
  // separate Vercel packaging bug in outputFileTracingIncludes, both
  // fixed below and in prisma/schema.prisma — next-pwa was never
  // actually the cause. Re-enabling; still verify on a preview deploy
  // before merging, since the original incident was never conclusively
  // cleared of next-pwa involvement.
  //
  // IMPORTANT: this plugin only hooks into webpack's config function —
  // confirmed empirically that it silently generates no service worker
  // at all under Turbopack (no error, `public/sw.js` just never gets
  // written). package.json's build script must stay on `next build
  // --webpack` as long as PWA is enabled; switching back to Turbopack
  // would make this `disable` flag a no-op lie.
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
  // A stray lockfile outside the project (e.g. C:\Users\<user>\package-lock.json)
  // makes Next.js/Turbopack misdetect the workspace root, which breaks build
  // manifest resolution entirely. Pin the root explicitly to this project.
  turbopack: {
    root: path.join(__dirname),
  },
  // Prisma 7's driver-adapter client loads @prisma/client-runtime-utils via
  // a computed require(), which Next's automatic file tracer can't follow —
  // without externalizing it, the deployed function is missing that package
  // and every DB-touching route 500s. This used to be worked around with
  // outputFileTracingIncludes, but that glob crosses the pnpm symlink at
  // node_modules/@prisma/client-runtime-utils without including the symlink
  // itself, so Next re-creates a dangling symlink in the deploy package —
  // "The framework produced an invalid deployment package... produces files
  // in symlinked directories." serverExternalPackages is Next's supported
  // mechanism for this class of package (it already externalizes
  // @prisma/client and prisma by default) and doesn't have that bug.
  serverExternalPackages: ["@prisma/client-runtime-utils"],
};

export default withSentryConfig(withNextIntl(withPWA(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
