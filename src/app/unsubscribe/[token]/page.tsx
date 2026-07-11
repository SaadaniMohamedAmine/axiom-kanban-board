import Link from "next/link";

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-widest mb-3">
          Axiom
        </div>
        <h1 className="text-2xl font-semibold text-on-surface mb-3">
          Email preferences updated.
        </h1>
        <p className="text-[14px] text-on-surface-variant mb-8 leading-relaxed">
          You have been unsubscribed from this type of notification. You can manage all notification
          preferences in your account settings.
        </p>
        <Link
          href="/login"
          className="inline-flex px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-[14px] font-medium hover:bg-surface-container-high transition-colors"
        >
          Back to Axiom
        </Link>
      </div>
    </div>
  );
}
