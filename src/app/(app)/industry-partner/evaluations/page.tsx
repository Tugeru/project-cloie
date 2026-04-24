import Link from "next/link";
import { redirect } from "next/navigation";
import { TargetStakeholder } from "@prisma/client";
import { ClipboardList } from "lucide-react";
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

function StatusBadge({ status }: { status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" }) {
  switch (status) {
    case "SUBMITTED":
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          Submitted
        </Badge>
      );
    case "IN_PROGRESS":
      return <Badge variant="secondary">In Progress</Badge>;
    default:
      return <Badge variant="default">Pending</Badge>;
  }
}

export default async function IndustryPartnerEvaluationsPage() {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const { active, submitted } = await listStakeholderEvaluations(
    TargetStakeholder.INDUSTRY_PARTNER,
  );

  const allItems = [...active, ...submitted];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-heading-lg">Industry Partner Evaluations</h1>
        <p className="text-body-md text-text-secondary">
          View and complete your assigned evaluations.
        </p>
      </div>

      {allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 text-center">
          <ClipboardList className="size-12 text-text-muted mb-4" />
          <h3 className="text-lg font-bold mb-1">No Evaluations Assigned</h3>
          <p className="text-body-md text-text-secondary max-w-md">
            You currently have no evaluations assigned. Check back later or
            contact your program administrator.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {allItems.map((item) => {
            const isSubmitted = item.status === "SUBMITTED";
            const href = isSubmitted
              ? `/industry-partner/evaluations/${item.deploymentId}/submitted`
              : `/industry-partner/evaluations/${item.deploymentId}`;

            return (
              <Card key={item.assignmentId}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {item.evaluationTitle}
                    </CardTitle>
                    <StatusBadge status={item.status} />
                  </div>
                  <CardDescription>{item.programLabel}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-xs text-text-muted">
                    {isSubmitted && item.submittedAt
                      ? `Submitted ${item.submittedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : item.deadlineAt
                        ? `Due ${item.deadlineAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : "No deadline"}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant={isSubmitted ? "outline" : "default"}
                    className="ml-auto font-bold"
                  >
                    <Link href={href}>
                      {isSubmitted
                        ? "View Submission"
                        : item.status === "IN_PROGRESS"
                          ? "Continue"
                          : "Start"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
