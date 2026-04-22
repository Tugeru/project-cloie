import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/features/auth/components/session-guard";

export default function DeanLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.DEAN]}>{children}</SessionGuard>;
}
