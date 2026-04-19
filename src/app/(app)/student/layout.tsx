import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/components/auth/session-guard";
import { AppShell } from "@/components/layout/app-shell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  // Mock user and roles for Task 1 as requested in plan
  const mockUser = {
    name: "Andy Student",
    email: "andy.student@acd.edu.ph",
  };
  const mockRoles = [ROLES.STUDENT];

  return (
    <SessionGuard allowedRoles={[ROLES.STUDENT, ROLES.GRADUATING_STUDENT]}>
      <AppShell user={mockUser} roles={mockRoles}>
        {children}
      </AppShell>
    </SessionGuard>
  );
}
