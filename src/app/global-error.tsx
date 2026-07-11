"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#0f131d", margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <div>
            <h2 style={{ color: "#dfe2f1", fontSize: "24px", marginBottom: "12px" }}>
              Something went wrong.
            </h2>
            <p style={{ color: "#c2c6d6", marginBottom: "24px", fontSize: "14px" }}>
              The team has been notified automatically.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "10px 24px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
