import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/features/auth/components/session-guard";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { prisma } from "@/lib/db/prisma";
import { VerificationStatusBanner } from "@/features/auth/components/verification-status-banner";

export default async function IndustryPartnerLayout({ children }: { children: ReactNode }) {
  const session = await resolveAuthSession();
  let verificationStatus = null;

  if (session?.industryPartnerProfileId) {
    const profile = await prisma.industryPartnerProfile.findUnique({
      where: { id: session.industryPartnerProfileId },
      select: { verification_status: true },
    });
    if (profile) {
      verificationStatus = profile.verification_status;
    }
  }

  return (
    <SessionGuard allowedRoles={[ROLES.INDUSTRY_PARTNER]}>
      {verificationStatus && <VerificationStatusBanner status={verificationStatus} />}
      {children}
    </SessionGuard>
  );
}
