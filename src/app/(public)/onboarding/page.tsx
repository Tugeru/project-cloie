import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { StudentProfileForm } from "./student-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Pre-fetch DB dictionaries strictly mapping to the requirements
  const programs = await prisma.program.findMany({ include: { majors: true } });
  const yearLevels = await prisma.yearLevel.findMany({ orderBy: { order: 'asc' } });

  const resolvedParams = await searchParams;
  const intent = resolvedParams?.intent as string | undefined;

  // Extract presumed name chunks via Google Meta safely
  const meta = user.user_metadata || {};
  const firstNameFallback = meta.full_name ? meta.full_name.split(' ')[0] : "";
  const lastNameFallback = meta.full_name ? meta.full_name.split(' ').slice(1).join(' ') : "";

  // 1. Direct Intent Router (Student Flow)
  if (intent === "student") {
    return (
      <div className="w-full max-w-2xl mx-auto py-8">
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

  // 2. Fallback Role Selector Matrix
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-border shadow-card text-center overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-brand-600 to-brand-400" />
        <CardHeader className="space-y-2 pb-6 mt-2">
          <CardTitle className="text-display-sm font-heading font-bold text-text-primary">Welcome to CLOIE</CardTitle>
          <CardDescription className="text-body-md text-text-secondary mt-2 px-2">
            Let&apos;s get your account set up. Who are you logging in as today?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link
            href="?intent=student"
            className="inline-flex items-center justify-center h-16 rounded-lg border border-brand-500/30 bg-background text-[17px] font-semibold hover:bg-brand-50 hover:text-brand-700 shadow-sm transition-all duration-300"
          >
            I am a Student
          </Link>
          <Button variant="outline" disabled className="h-16 text-[17px] shadow-sm bg-surface opacity-50 cursor-not-allowed border-dashed">
            I am a Faculty Member (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
