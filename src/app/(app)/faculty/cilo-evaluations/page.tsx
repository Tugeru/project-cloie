import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listFacultyCourseContextsAction } from "@/lib/actions/course-bound-evaluation-actions";

export default async function FacultyCiloEvaluationsPage() {
  const courseContexts = await listFacultyCourseContextsAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">CILO Evaluations</h1>
          <p className="text-sm text-text-muted">
            Review your scoped course contexts and create a new course-bound CILO evaluation.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/faculty/cilos">Manage CILOs</Link>
          </Button>
          <Button asChild>
            <Link href="/faculty/cilo-evaluations/new">Publish New Evaluation</Link>
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">My Course Contexts</h2>
        <p className="mt-1 text-sm text-text-muted">
          You can publish one evaluation per course context (course, academic year, semester, term).
        </p>

        {courseContexts.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-5 text-sm text-text-muted">
            No active course contexts were found for your faculty affiliation.
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {courseContexts.map((context) => (
              <li key={context.courseId} className="rounded-lg border border-border p-4">
                <p className="font-semibold text-text-primary">
                  {context.courseCode} - {context.courseTitle}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  {context.programCode} - {context.programName}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
