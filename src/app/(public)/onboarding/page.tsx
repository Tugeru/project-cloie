import { redirect } from "next/navigation";
import Link from "next/link";
import { UserPlus, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { YearLevel } from "@prisma/client";
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
      })
    );
  }

  const resolvedParams = await searchParams;
  const intent = resolvedParams?.intent as string | undefined;
  const step = resolvedParams?.step as string | undefined;

  const meta = user.user_metadata || {};
  // Use Google's structured name fields (given_name / family_name) when available.
  // These are pre-separated by Google and handle multi-word first names correctly.
  // Fall back to splitting full_name only if structured fields are missing.
  const nameParts: string[] = meta.full_name ? meta.full_name.trim().split(/\s+/) : [];
  const firstNameFallback = meta.given_name ?? (nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0] ?? "");
  const lastNameFallback = meta.family_name ?? (nameParts.length > 1 ? nameParts[nameParts.length - 1] : "");

  // Step 2: Show the student profile form
  if (intent === "student" && step === "form") {
    const programs = await prisma.program.findMany({
      include: { majors: true },
    });
    const yearLevels = Object.values(YearLevel);

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
        <Card className="border-border overflow-hidden shadow-lg">
          {/* Blue header banner with icon */}
          <div className="bg-primary flex items-center justify-center py-10">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <UserPlus className="size-8 text-white" />
            </div>
          </div>

          <CardContent className="space-y-6 px-8 py-8">
            {/* Heading */}
            <h1 className="font-heading text-primary text-center text-2xl font-bold">
              Complete Your Student Profile
            </h1>

            {/* Info callout */}
            <div className="border-warning bg-warning-soft/30 flex gap-3 rounded-lg border-l-4 p-4">
              <CheckCircle className="text-warning mt-0.5 size-5 shrink-0" />
              <p className="text-body-sm text-text-secondary">
                We found your ACD account, but your student profile is not yet set up. Please
                complete your registration to access the platform.
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
              className="text-text-muted hover:text-text-primary flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="size-4" />
              Cancel / Back to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: skip role selection, go directly to student onboarding
  redirect("/onboarding?intent=student");
}
