import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/components/auth/session-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.ADMIN]}>{children}</SessionGuard>;
}
