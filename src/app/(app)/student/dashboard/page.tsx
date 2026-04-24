import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { listStudentAssignedEvaluations } from "@/features/responses/services/list-student-assigned-evaluations";
import { EvaluationListCard } from "@/features/users/components/evaluation-list-card";
import { HeroCard } from "@/features/users/components/hero-card";
import { StatCards } from "@/features/users/components/stat-cards";
import { prisma } from "@/lib/db/prisma";

export default async function StudentDashboardPage() {
  const session = await resolveAuthSession();
  const { active, submitted } = await listStudentAssignedEvaluations();
  const inProgressCount = active.filter((item) => item.status === "IN_PROGRESS").length;
  const resumeItem =
    active.find((item) => item.status === "IN_PROGRESS") ?? active[0] ?? null;

  const profile = session
    ? await prisma.studentAcademicProfile.findUnique({
        where: { user_id: session.userId },
        include: {
          major: true,
          program: true,
          user: true,
          year_level: true,
        },
      })
    : null;

  const contextLabel = profile
    ? [
        profile.program.code,
        profile.major?.name ?? null,
        profile.year_level.name,
        profile.academic_year,
      ]
        .filter(Boolean)
        .join(" • ")
    : "Student portal";

  const displayName = profile?.user.first_name ?? "Student";

  return (
    <div className="animate-in fade-in duration-500">
      <HeroCard name={displayName} contextLabel={contextLabel} />
      <StatCards
        pending={active.length}
        inProgress={inProgressCount}
        completed={submitted.length}
      />

      {session?.isGraduating && (
        <Card className="mt-6 border-primary/30 bg-primary-soft/40">
          <CardContent className="p-4">
            <p className="font-semibold text-primary">Graduating Eligibility Active</p>
            <p className="text-sm text-text-secondary">
              Graduating-student tools appear here only when a real program-level
              deployment assigns them to your account.
            </p>
          </CardContent>
        </Card>
      )}

      {resumeItem && (
        <section className="mt-8 space-y-4">
          <div>
            <h3 className="font-heading text-xl font-extrabold">Continue</h3>
            <p className="text-sm font-medium text-text-muted">
              Pick up where you left off.
            </p>
          </div>

          <Card className="overflow-hidden border-border shadow-sm">
            <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {resumeItem.status === "IN_PROGRESS" ? "In Progress" : "Pending"}
                </p>
                <div>
                  <h4 className="text-xl font-bold">
                    {resumeItem.courseTitle ?? resumeItem.evaluationTitle}
                  </h4>
                  <p className="text-sm text-text-secondary">
                    {resumeItem.courseTitle
                      ? `${resumeItem.evaluationTitle} • ${resumeItem.programLabel}`
                      : resumeItem.programLabel}
                  </p>
                </div>
                {resumeItem.status === "IN_PROGRESS" && (
                  <p className="text-sm font-medium text-secondary">
                    {resumeItem.progress}% complete
                  </p>
                )}
              </div>

              {resumeItem.href && (
                <Button
                  render={<Link href={resumeItem.href} />}
                  className="font-semibold"
                >
                  {resumeItem.status === "IN_PROGRESS" ? "Resume" : "Start Evaluation"}
                </Button>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-xl font-extrabold">Pending Evaluations</h3>
            <p className="text-sm font-medium text-text-muted">
              Prioritize forms that are active and closing soon.
            </p>
          </div>
          <Link
            href="/student/evaluations"
            className="text-sm font-bold text-primary hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="grid gap-4">
          {active.slice(0, 3).map((evalItem) => (
            <EvaluationListCard key={evalItem.assignmentId} {...evalItem} />
          ))}
          {active.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
              <p className="font-medium text-text-muted">No active evaluations found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
