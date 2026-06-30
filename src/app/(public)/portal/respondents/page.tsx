import { PortalShell } from "@/features/portals";
import { ROLE_CARDS_RESPONDENT } from "@/features/portals/lib/role-card-config";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";

export const metadata = {
  title: "Respondent Portal | System CLOIE",
  description: "Sign in as a Student, Alumni, or Industry Partner",
};

export default async function RespondentPortalPage() {
  const session = await resolveAuthSession();

  return (
    <PortalShell
      title="Welcome to System CLOIE"
      subtitle="Select your role to access your personalized dashboard and tools."
      cards={ROLE_CARDS_RESPONDENT}
      session={
        session
          ? {
              email: session.email ?? "",
              isComplete: session.profileGate.status === "COMPLETE",
            }
          : null
      }
      backLink={{
        label: "Back to portal selection",
        href: "/",
      }}
      crossLink={{
        label: "ACD Staff or Faculty? Go to Staff Portal",
        href: "/portal/staff",
      }}
    />
  );
}
