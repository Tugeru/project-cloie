import { Bell } from "lucide-react";
import Image from "next/image";

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      {/* Mobile left-side branding (hidden on desktop since sidebar has it) */}
      <div className="flex items-center gap-3 lg:hidden">
        <Image 
          src="/logos/cloie-logo.png" 
          alt="CLOIE Logo" 
          width={28} 
          height={28} 
          className="rounded"
        />
        <span className="text-title-md font-bold text-primary tracking-tight">CLOIE</span>
      </div>

      <div className="hidden lg:flex" /> {/* Empty spacer for desktop */}

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <button 
          type="button"
          className="relative flex size-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" />
        </button>

        {/* Mobile profile avatar (Desktop has it in sidebar) */}
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-white lg:hidden">
          <span className="text-caption font-semibold">T</span>
        </div>
      </div>
    </header>
  );
}
