"use client";

interface DownloadAllInvoicesButtonProps {
  pdfUrls: string[];
  label: string;
}

export function DownloadAllInvoicesButton({ pdfUrls, label }: DownloadAllInvoicesButtonProps) {
  function handleClick() {
    for (const url of pdfUrls) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-outline-variant hover:border-primary transition-colors hover:bg-primary/5 text-[13px] text-on-surface shrink-0 cursor-pointer"
    >
      <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
      </svg>
      {label}
    </button>
  );
}
