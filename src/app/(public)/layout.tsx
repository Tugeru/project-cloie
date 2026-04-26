import * as React from "react";
import { Suspense } from "react";
import Image from "next/image";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#f8fafc] p-4 sm:p-8">
      {/* ACD Logo Watermark - lower left corner */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-20 -left-20 size-[400px] opacity-[0.04]">
          <Image
            src="/logos/acd-logo.png"
            alt=""
            fill
            className="object-contain"
            priority={false}
          />
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex h-full w-full animate-pulse items-center justify-center text-sm text-[#64748b]">
            Loading...
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
