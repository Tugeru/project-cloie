import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { UserPlus, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveAuthSessionFromUser } from "@/features/auth/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/features/auth/services/resolve-post-login-destination";
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
      }),
    );
  }

  const resolvedParams = await searchParams;
  const intent = resolvedParams?.intent as string | undefined;
  const step = resolvedParams?.step as string | undefined;

  const meta = user.user_metadata || {};
  // Use Google's structured name fields (given_name / family_name) when available.
  // These are pre-separated by Google and handle multi-word first names correctly.
  // Fall back to splitting full_name only if structured fields are missing.
  const firstNameFallback =
    meta.given_name ?? (meta.full_name ? meta.full_name.split(" ")[0] : "");
  const lastNameFallback =
    meta.family_name ??
    (meta.full_name ? meta.full_name.split(" ").slice(1).join(" ") : "");

  // Step 2: Show the student profile form
  if (intent === "student" && step === "form") {
    const programs = await prisma.program.findMany({
      include: { majors: true },
    });
    const yearLevels = await prisma.yearLevel.findMany({
      orderBy: { order: "asc" },
    });

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

  // Step 1: Show the landing card (mockup design)
  if (intent === "student") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <Card className="overflow-hidden border-border shadow-lg">
          {/* Blue header banner with icon */}
          <div className="flex items-center justify-center bg-primary py-10">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <UserPlus className="size-8 text-white" />
            </div>
          </div>

          <CardContent className="space-y-6 px-8 py-8">
            {/* Heading */}
            <h1 className="text-center font-heading text-2xl font-bold text-primary">
              Complete Your Student Profile
            </h1>

            {/* Info callout */}
            <div className="flex gap-3 rounded-lg border-l-4 border-warning bg-warning-soft/30 p-4">
              <CheckCircle className="mt-0.5 size-5 shrink-0 text-warning" />
              <p className="text-body-sm text-text-secondary">
                We found your ACD account, but your student profile is not yet
                set up. Please complete your registration to access the
                platform.
              </p>
            </div>

            {/* CTA button */}
            <Button
              render={<Link href="?intent=student&step=form" />}
              className="w-full gap-2 py-6 text-base font-semibold"
            >
              Continue Setup
              <ArrowRight className="size-5" />
            </Button>

            {/* Back link */}
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="size-4" />
              Cancel / Back to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: Role selection (no intent specified)
  return (
    <div className="mx-auto w-full max-w-lg">
      <Card className="overflow-hidden border-border shadow-lg">
        {/* Blue header banner */}
        <div className="flex items-center justify-center bg-primary py-10">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/cloie-logo.png"
              alt="CLOIE Logo"
              width={40}
              height={40}
              className="rounded-lg brightness-0 invert"
            />
            <span className="text-2xl font-bold tracking-tight text-white">
              CLOIE
            </span>
          </div>
        </div>

        <CardContent className="space-y-6 px-8 py-8">
          <div className="space-y-2 text-center">
            <h1 className="font-heading text-2xl font-bold text-text-primary">
              Welcome to CLOIE
            </h1>
            <p className="text-body-md text-text-secondary">
              Let&apos;s get your account set up. Who are you logging in as
              today?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              render={<Link href="?intent=student" />}
              variant="outline"
              className="h-14 text-base font-semibold"
            >
              I am a Student
            </Button>
            <Button
              variant="outline"
              disabled
              className="h-14 cursor-not-allowed border-dashed text-base opacity-50"
            >
              I am a Faculty Member (Coming Soon)
            </Button>
          </div>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to Login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
