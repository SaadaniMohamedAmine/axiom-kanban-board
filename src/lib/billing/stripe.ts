import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30",
  typescript: true,
});

export const STRIPE_PRICE_IDS = {
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  TEAM: process.env.STRIPE_TEAM_PRICE_ID!,
} as const;
