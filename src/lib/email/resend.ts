import { Resend } from "resend";

export const FROM_ADDRESS =
  process.env.RESEND_FROM ?? "Axiom <noreply@axiom.dev>";

let resendClient: Resend | null = null;

// Lazy singleton: throwing here (rather than at module scope) keeps this
// module import-safe during `next build` page-data collection, which loads
// every route module regardless of whether RESEND_API_KEY is configured.
export function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}
