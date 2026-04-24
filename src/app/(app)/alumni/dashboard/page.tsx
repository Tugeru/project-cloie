import Link from "next/link";
import { redirect } from "next/navigation";
import { TargetStakeholder } from "@prisma/client";
import { ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { listStakeholderEvaluations } from "@/features/responses/services/list-stakeholder-evaluations";

export default async function AlumniDashboardPage() {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const { active, submitted } = await listStakeholderEvaluations(
    TargetStakeholder.ALUMNI,
  );

  const pendingCount = active.filter((e) => e.status === "NOT_STARTED").length;
  const inProgressCount = active.filter(
    (e) => e.status === "IN_PROGRESS",
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-heading-lg">Alumni Dashboard</h1>
        <p className="text-body-md text-text-secondary">
          Complete your assigned evaluations and track submission status.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Pending
            </CardTitle>
            <Clock className="size-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {pendingCount + inProgressCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              In Progress
            </CardTitle>
            <ClipboardList className="size-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Submitted
            </CardTitle>
            <CheckCircle2 className="size-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{submitted.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active evaluations */}
      {active.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Pending Evaluations</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((item) => (
              <Card key={item.assignmentId}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {item.evaluationTitle}
                    </CardTitle>
                    <Badge
                      variant={
                        item.status === "IN_PROGRESS" ? "secondary" : "default"
                      }
                    >
                      {item.status === "IN_PROGRESS"
                        ? "In Progress"
                        : "Pending"}
                    </Badge>
                  </div>
                  <CardDescription>{item.programLabel}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  {item.deadlineAt && (
                    <p className="text-xs text-text-muted">
                      Due{" "}
                      {item.deadlineAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <Button asChild size="sm" className="ml-auto font-bold">
                    <Link href={`/alumni/evaluations/${item.deploymentId}`}>
                      {item.status === "IN_PROGRESS" ? "Continue" : "Start"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Submitted evaluations */}
      {submitted.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Submitted Evaluations</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {submitted.map((item) => (
              <Card key={item.assignmentId}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {item.evaluationTitle}
                    </CardTitle>
                    <Badge className="bg-success/10 text-success border-success/20">
                      Submitted
                    </Badge>
                  </div>
                  <CardDescription>{item.programLabel}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  {item.submittedAt && (
                    <p className="text-xs text-text-muted">
                      Submitted{" "}
                      {item.submittedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="ml-auto font-bold"
                  >
                    <Link
                      href={`/alumni/evaluations/${item.deploymentId}/submitted`}
                    >
                      View Submission
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {active.length === 0 && submitted.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 text-center">
          <ClipboardList className="size-12 text-text-muted mb-4" />
          <h3 className="text-lg font-bold mb-1">No Evaluations Assigned</h3>
          <p className="text-body-md text-text-secondary max-w-md">
            You currently have no evaluations assigned. Check back later or
            contact your program administrator.
          </p>
        </div>
      )}
    </div>
  );
}
