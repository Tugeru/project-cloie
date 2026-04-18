import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SessionGuard } from "@/components/auth/session-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <AppShell>{children}</AppShell>
    </SessionGuard>
  );
}
