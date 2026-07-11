import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <div className="mb-6">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-widest mb-3">
          Axiom
        </div>
        <h1 className="text-[80px] font-semibold text-on-surface leading-none tracking-tight mb-2">
          404
        </h1>
        <p className="text-[18px] text-on-surface-variant">
          This page does not exist.
        </p>
        <p className="text-[14px] text-on-surface-variant/60 mt-2 max-w-sm mx-auto">
          The resource you requested may have been moved, deleted, or never existed.
        </p>
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:brightness-110 transition-all"
      >
        <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        Back to Axiom
      </Link>
    </div>
  );
}
