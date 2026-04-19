import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SessionGuard } from "@/components/auth/session-guard";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await resolveAuthSession();
  
  const user = session ? {
    name: session.email?.split('@')[0] || "User", // Fallback name since AuthSessionSnapshot doesn't have it yet
    email: session.email,
  } : undefined;

  return (
    <SessionGuard>
      <AppShell user={user} roles={session?.roles}>
        {children}
      </AppShell>
    </SessionGuard>
  );
}
