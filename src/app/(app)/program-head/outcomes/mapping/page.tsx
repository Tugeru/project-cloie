import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listCILOMappingsForProgram } from "@/features/outcomes/services/manage-program-head-outcomes";

export const metadata = {
  title: "CILO-GO Mappings — Program Head | CLOIE",
};

export default async function OutcomeMappingPage() {
  const result = await listCILOMappingsForProgram();

  if (!result.success) {
    redirect("/unauthorized");
  }

  const courseMappings = result.data;

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <Link href="/program-head/outcomes">
          <Button variant="ghost" className="mb-4 inline-flex items-center gap-2 px-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Graduate Outcomes
          </Button>
        </Link>
        <h1 className="mb-2 font-heading text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">
          CILO-GO Mapping Review
        </h1>
        <p className="text-body-md text-text-muted">
          Review how Course Intended Learning Outcomes map to Graduate Outcomes
          across your program&apos;s courses. Faculty manage CILOs and their
          mappings.
        </p>
      </div>

      {/* Course Sections */}
      {courseMappings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-body-md text-text-secondary">
              No CILO mappings found. CILOs and their GO mappings are created by
              faculty when publishing evaluations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {courseMappings.map((course) => (
            <Card key={course.courseId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Badge variant="default" className="text-sm font-semibold">
                    {course.courseCode}
                  </Badge>
                  <span>{course.courseTitle}</span>
                </CardTitle>
                <CardDescription>
                  {course.cilos.length}{" "}
                  {course.cilos.length === 1 ? "CILO" : "CILOs"} defined
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.cilos.map((cilo) => (
                    <div
                      key={cilo.id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                            CILO {cilo.order}
                          </span>
                          <p className="text-body-md mt-1 text-text-primary">
                            {cilo.description}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-text-muted">
                          {cilo.academic_term}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {cilo.mappedGOs.length > 0 ? (
                          cilo.mappedGOs.map((go) => (
                            <Badge
                              key={go.id}
                              variant="secondary"
                              className="text-xs"
                              title={go.description}
                            >
                              {go.code}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs italic text-text-muted">
                            No mappings
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
