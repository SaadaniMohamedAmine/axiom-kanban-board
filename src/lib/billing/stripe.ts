import Stripe from "stripe";

let stripeClient: Stripe | null = null;

// Lazy singleton: throwing here (rather than at module scope) keeps this
// module import-safe during `next build` page-data collection, which loads
// every route module regardless of whether STRIPE_SECRET_KEY is configured.
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }
  return stripeClient;
}

export const STRIPE_PRICE_IDS = {
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  TEAM: process.env.STRIPE_TEAM_PRICE_ID!,
} as const;
