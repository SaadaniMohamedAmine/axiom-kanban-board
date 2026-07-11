"use client";

// TEMPORARY — manual test button for the ErrorBoundary (US4 / Feature 010).
// Remove after verifying the fallback UI renders correctly.

import { useState } from "react";

export function TestErrorButton() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error("Test error — manual ErrorBoundary trigger");
  }

  return (
    <button
      onClick={() => setShouldError(true)}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-lg text-[13px] font-medium hover:bg-red-700 transition-colors shadow-lg"
    >
      💥 Trigger error
    </button>
  );
}
