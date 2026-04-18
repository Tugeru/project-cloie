import { redirect } from "next/navigation";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";

export default async function DashboardPage() {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  redirect(
    resolvePostLoginDestination({
      requestedPath: "/dashboard",
      intent: null,
      primaryRole: session.primaryRole,
      profileGate: session.profileGate,
    })
  );
}
