import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import type { Role } from "@/lib/constants/roles";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  roles?: Role[];
}

export function AppShell({ children, user, roles }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar (hidden on mobile/tablet) */}
      <Sidebar user={user} roles={roles} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top App Bar */}
        <Topbar user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto p-4 sm:p-6 pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav roles={roles} />
      </div>
    </div>
  );
}
