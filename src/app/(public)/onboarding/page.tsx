import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAuthSessionFromUser } from "@/modules/identity-access/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";
import { createClient } from "@/lib/supabase/server";
import { StudentProfileForm } from "./student-profile-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const session = await resolveAuthSessionFromUser({
    id: user.id,
    email: user.email ?? null,
  });
  if (session && session.profileGate.status === "COMPLETE") {
    redirect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: session.primaryRole,
        profileGate: session.profileGate,
      })
    );
  }

  const resolvedParams = await searchParams;
  const intent = resolvedParams?.intent as string | undefined;

  const meta = user.user_metadata || {};
  const firstNameFallback = meta.full_name ? meta.full_name.split(" ")[0] : "";
  const lastNameFallback = meta.full_name ? meta.full_name.split(" ").slice(1).join(" ") : "";

  if (intent === "student") {
    const programs = await prisma.program.findMany({ include: { majors: true } });
    const yearLevels = await prisma.yearLevel.findMany({ orderBy: { order: "asc" } });

    return (
      <div className="mx-auto w-full max-w-2xl py-8">
        <StudentProfileForm
          email={user.email!}
          initialFirstName={firstNameFallback}
          initialLastName={lastNameFallback}
          programs={programs}
          yearLevels={yearLevels}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="overflow-hidden border-border shadow-card text-center">
        <div className="h-2 w-full bg-gradient-to-r from-primary to-info" />
        <CardHeader className="mt-2 space-y-2 pb-6">
          <CardTitle className="font-heading text-display-sm font-bold text-text-primary">Welcome to CLOIE</CardTitle>
          <CardDescription className="mt-2 px-2 text-body-md text-text-secondary">
            Let&apos;s get your account set up. Who are you logging in as today?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link
            href="?intent=student"
            className="inline-flex h-16 items-center justify-center rounded-lg border border-primary/30 bg-background text-[17px] font-semibold shadow-sm transition-all duration-300 hover:bg-primary-soft hover:text-primary"
          >
            I am a Student
          </Link>
          <Button variant="outline" disabled className="h-16 cursor-not-allowed border-dashed bg-surface text-[17px] opacity-50 shadow-sm">
            I am a Faculty Member (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
