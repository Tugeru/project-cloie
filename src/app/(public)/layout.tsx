import * as React from "react";
import { Suspense } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8">
      <Suspense fallback={<div className="flex items-center justify-center h-full w-full animate-pulse text-text-muted text-sm">Loading security boundary...</div>}>
        {children}
      </Suspense>
    </div>
  );
}
