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

export interface BillingInvoice {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
}

// Best-effort: billing UI degrades to an empty list rather than failing the
// page if Stripe is unreachable or the customer has no invoices yet.
export async function listRecentInvoices(customerId: string, limit = 12): Promise<BillingInvoice[]> {
  try {
    const stripe = getStripeClient();
    const invoices = await stripe.invoices.list({ customer: customerId, limit });
    return invoices.data.map((invoice) => ({
      id: invoice.id ?? invoice.number ?? crypto.randomUUID(),
      date: new Date((invoice.created ?? 0) * 1000),
      amount: (invoice.amount_paid || invoice.amount_due) / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status ?? "open",
      pdfUrl: invoice.invoice_pdf ?? null,
    }));
  } catch {
    return [];
  }
}
