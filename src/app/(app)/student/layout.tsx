import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/components/auth/session-guard";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.STUDENT, ROLES.GRADUATING_STUDENT]}>{children}</SessionGuard>;
}
