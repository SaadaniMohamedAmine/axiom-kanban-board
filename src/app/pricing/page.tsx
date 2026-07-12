import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — Axiom",
  description: "Simple, transparent pricing for elite engineering teams.",
};

export const dynamic = "force-static";

const PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For individuals and small experiments.",
    cta: "Get started",
    ctaHref: "/sign-up",
    highlighted: false,
    features: [
      "1 workspace",
      "3 boards",
      "10 members",
      "20 AI requests/day",
      "Realtime collaboration",
      "Sprint analytics",
    ],
    limits: ["No webhooks", "No audit log", "Community support"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For professional teams who need the full Axiom Intelligence stack.",
    cta: "Upgrade to Pro",
    ctaHref: "#upgrade-pro",
    highlighted: true,
    features: [
      "Unlimited workspaces",
      "Unlimited boards",
      "50 members",
      "200 AI requests/day",
      "Webhooks & Public API",
      "Audit log (90 days)",
      "Email notifications",
      "PWA (offline access)",
    ],
    limits: [],
  },
  {
    id: "TEAM",
    name: "Team",
    price: "$29",
    period: "/month",
    description: "For scaling organisations with enterprise governance needs.",
    cta: "Upgrade to Team",
    ctaHref: "#upgrade-team",
    highlighted: false,
    features: [
      "Everything in Pro",
      "Unlimited members",
      "500 AI requests/day",
      "Audit log (365 days)",
      "Priority support",
      "Advanced webhook retry",
      "SSO (coming soon)",
    ],
    limits: [],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[15px] font-semibold text-on-surface tracking-tight">
            Axiom
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-medium hover:brightness-110 transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-4">
            Pricing
          </div>
          <h1 className="text-5xl font-semibold text-on-surface tracking-tight mb-4">
            Simple, transparent.
          </h1>
          <p className="text-[17px] text-on-surface-variant max-w-lg mx-auto leading-relaxed">
            Start free. Upgrade when your team needs more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "bg-primary/5 border-primary/30 shadow-[0_0_40px_-10px_rgba(139,92,246,0.2)]"
                  : "bg-surface-container border-outline-variant/20"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="px-3 py-1 bg-primary text-white rounded-full text-[11px] font-semibold tracking-wide">
                    Most popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="text-[13px] font-semibold text-on-surface-variant/60 mb-1">
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-semibold text-on-surface">{plan.price}</span>
                  {plan.period !== "forever" && (
                    <span className="text-[14px] text-on-surface-variant mb-1">{plan.period}</span>
                  )}
                  {plan.period === "forever" && (
                    <span className="text-[13px] text-on-surface-variant/50 mb-1">forever</span>
                  )}
                </div>
                <p className="text-[13px] text-on-surface-variant leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <svg className="text-green-400 mt-0.5 shrink-0" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="13">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[13px] text-on-surface-variant">{f}</span>
                  </div>
                ))}
                {plan.limits.map((l) => (
                  <div key={l} className="flex items-start gap-2.5">
                    <svg className="text-on-surface-variant/30 mt-0.5 shrink-0" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13">
                      <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
                    </svg>
                    <span className="text-[13px] text-on-surface-variant/40">{l}</span>
                  </div>
                ))}
              </div>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 rounded-xl text-[14px] font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-primary text-white hover:brightness-110"
                    : "bg-surface-container-high text-on-surface border border-outline-variant/30 hover:bg-surface-container-highest"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-on-surface mb-6 text-center">Questions</h2>
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from Settings → Billing. You keep Pro access until the end of the current billing period.",
            },
            {
              q: "What happens when I hit a limit on the Free plan?",
              a: "You see a clear message with an upgrade prompt. No crashes, no data loss — just a hard stop on the blocked action.",
            },
            {
              q: "Is there a trial?",
              a: "The Free plan is a permanent tier — no time limit. Try Pro features by upgrading and cancelling within the billing period.",
            },
          ].map((item) => (
            <div key={item.q} className="border-b border-outline-variant/20 py-5">
              <div className="text-[14px] font-medium text-on-surface mb-2">{item.q}</div>
              <div className="text-[13px] text-on-surface-variant leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
