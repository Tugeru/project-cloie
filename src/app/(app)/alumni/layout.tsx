import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/features/auth/components/session-guard";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { prisma } from "@/lib/db/prisma";
import { VerificationStatusBanner } from "@/features/auth/components/verification-status-banner";

export default async function AlumniLayout({ children }: { children: ReactNode }) {
  const session = await resolveAuthSession();
  let verificationStatus = null;

  if (session?.alumniProfileId) {
    const profile = await prisma.alumniProfile.findUnique({
      where: { id: session.alumniProfileId },
      select: { verification_status: true },
    });
    if (profile) {
      verificationStatus = profile.verification_status;
    }
  }

  return (
    <SessionGuard allowedRoles={[ROLES.ALUMNI]}>
      {verificationStatus && <VerificationStatusBanner status={verificationStatus} />}
      {children}
    </SessionGuard>
  );
}
