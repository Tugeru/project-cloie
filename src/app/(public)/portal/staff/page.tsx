import { PortalShell } from "@/features/portals";
import { ROLE_CARDS_STAFF } from "@/features/portals/lib/role-card-config";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";

export const metadata = {
  title: "Staff & Faculty Portal | System CLOIE",
  description: "Sign in as ACD Staff or Faculty Member",
};

export default async function StaffPortalPage() {
  const session = await resolveAuthSession();

  return (
    <PortalShell
      title="ACD Staff & Faculty Portal"
      subtitle="Select your role to manage and configure the system."
      cards={ROLE_CARDS_STAFF}
      session={
        session
          ? {
              email: session.email ?? "",
              isComplete: session.profileGate.status === "COMPLETE",
            }
          : null
      }
      backLink={{ label: "← Back to portal selection", href: "/" }}
    />
  );
}
