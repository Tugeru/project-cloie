import { HeroCard } from "@/components/student/dashboard/hero-card";
import { StatCards } from "@/components/student/dashboard/stat-cards";
import { EvaluationListCard } from "@/components/student/dashboard/evaluation-list-card";
import Link from "next/link";
import { listStudentCourseBoundEvaluations } from "@/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations";

export default async function StudentDashboardPage() {
  const { active } = await listStudentCourseBoundEvaluations();
  const inProgressCount = active.filter((item) => item.status === "IN_PROGRESS").length;

  return (
    <div className="animate-in fade-in duration-500">
      <HeroCard name="Andy" program="BSIT" year="4th Year" section="Section A" />
      <StatCards pending={active.length} inProgress={inProgressCount} completed={0} />
      
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
