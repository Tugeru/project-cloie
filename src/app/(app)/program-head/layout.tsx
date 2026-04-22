import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/features/auth/components/session-guard";

export default function ProgramHeadLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.PROGRAM_HEAD]}>{children}</SessionGuard>;
}
