"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ maxWidth: "28rem", width: "100%", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1.5rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Critical Error</h1>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              A critical error occurred. Please refresh the page to try again.
            </p>
            {error.digest && (
              <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1rem" }}>
                Error ID: {error.digest}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={reset}
                style={{ padding: "0.5rem 1rem", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.assign("/")}
                style={{ padding: "0.5rem 1rem", backgroundColor: "white", color: "#111827", border: "1px solid #d1d5db", borderRadius: "0.375rem", cursor: "pointer" }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
