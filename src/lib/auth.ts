import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prisma } from "./prisma";
import { requireEnv } from "./env";

requireEnv("DATABASE_URL");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  account: {
    // Auto-linking is disabled so a sign-up with an email already tied to a
    // different provider is rejected (FR-011) instead of silently merged.
    accountLinking: {
      enabled: false,
    },
  },
  socialProviders: {
    google: {
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    },
    github: {
      clientId: requireEnv("GITHUB_CLIENT_ID"),
      clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  hooks: {
    // contracts/auth-conflict.md (FR-011): block credentials sign-up when the
    // email is already linked to a different provider, before any Account is created.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const email = ctx.body?.email as string | undefined;
      if (!email) return;

      const existingAccount = await prisma.account.findFirst({
        where: { user: { email } },
      });

      if (existingAccount && existingAccount.providerId !== "credential") {
        throw new APIError("CONFLICT", {
          code: "EMAIL_ALREADY_LINKED",
          message: `This email is already registered with ${existingAccount.providerId}. Sign in with ${existingAccount.providerId} instead.`,
          existingProvider: existingAccount.providerId,
        });
      }
    }),
  },
});
