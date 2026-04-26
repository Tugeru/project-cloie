import * as React from "react";
import { Suspense } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8">
      <Suspense
        fallback={
          <div className="text-text-muted flex h-full w-full animate-pulse items-center justify-center text-sm">
            Loading security boundary...
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
