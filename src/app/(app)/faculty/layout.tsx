import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/features/auth/components/session-guard";

export default function FacultyLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.FACULTY]}>{children}</SessionGuard>;
}
