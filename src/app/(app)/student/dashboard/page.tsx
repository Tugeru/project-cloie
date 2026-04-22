import { HeroCard } from "@/features/users/components/hero-card";
import { StatCards } from "@/features/users/components/stat-cards";
import { EvaluationListCard } from "@/features/users/components/evaluation-list-card";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { listStudentCourseBoundEvaluations } from "@/features/responses/services/list-student-course-bound-evaluations";

export default async function StudentDashboardPage() {
  const session = await resolveAuthSession();
  const { active } = await listStudentCourseBoundEvaluations();
  const inProgressCount = active.filter((item) => item.status === "IN_PROGRESS").length;

  return (
    <div className="animate-in fade-in duration-500">
      <HeroCard name="Andy" program="BSIT" year="4th Year" section="Section A" />
      <StatCards pending={active.length} inProgress={inProgressCount} completed={0} />

      {session?.isGraduating && (
        <Card className="mt-6 border-primary/30 bg-primary-soft/40">
          <CardContent className="p-4">
            <p className="font-semibold text-primary">Graduating Eligibility Active</p>
            <p className="text-sm text-text-secondary">
              Graduating-student tools are exposed through your student account based on eligibility, not a separate role.
            </p>
          </CardContent>
        </Card>
      )}
      
      <section className="mt-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-extrabold font-heading">Active Evaluations</h3>
            <p className="text-sm text-text-muted font-medium">Prioritize forms closing soon</p>
          </div>
          <Link href="/student/evaluations" className="text-primary text-sm font-bold hover:underline">View All</Link>
        </div>

        <div className="grid gap-4">
          {active.map((evalItem) => (
            <EvaluationListCard key={evalItem.evaluationId} {...evalItem} />
          ))}
        </div>
      </section>
    </div>
  );
}
