import { ROLE_CARDS, RoleSelectionCard } from "@/features/portals";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut } from "lucide-react";

export const metadata = {
  title: "Portal | CLOIE",
  description: "Select your role to sign in to CLOIE",
};

export default async function PortalPage() {
  const session = await resolveAuthSession();

  let hasRoles = false;
  let isComplete = false;
  let email = null;

  if (session) {
    email = session.email;
    if (session.profileGate.status !== "ROLE_SELECTION_REQUIRED") {
      hasRoles = true;
    }
    if (session.profileGate.status === "COMPLETE") {
      isComplete = true;
    }
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/10">
      {/* Dynamic Background */}
      <div className="pointer-events-none fixed inset-0 flex justify-center overflow-hidden">
        <div className="bg-primary/5 absolute -top-[20%] right-[10%] h-[600px] w-[600px] rounded-full blur-[120px]" />
        <div className="bg-primary/5 absolute -left-[10%] top-[40%] h-[500px] w-[500px] rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h1 className="text-display-sm text-text-primary mb-4">
            Welcome to CLOIE
          </h1>
          <p className="text-body-lg text-text-secondary">
            Select your role to access your personalized dashboard and tools.
          </p>

          {session && (
            <div className="mt-8 p-4 bg-surface rounded-xl border border-border inline-flex flex-col items-center gap-3">
              <p className="text-body-sm text-text-secondary">
                Signed in as <span className="font-medium text-text-primary">{email}</span>
              </p>
              <div className="flex items-center gap-3">
                <form action="/api/auth/signout" method="post">
                  <Button variant="outline" size="sm" type="submit">
                    <LogOut className="size-4 mr-2" />
                    Sign Out
                  </Button>
                </form>
                {isComplete && (
                  <Button asChild size="sm">
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="size-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ROLE_CARDS.map((config) => (
            <RoleSelectionCard key={config.role} config={config} />
          ))}
        </div>
      </div>
    </div>
  );
}
