import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CourseBoundReviewResponseCard } from "@/modules/analytics-reporting-and-review/types";

type AnonymizedResponseCardsProps = {
  responses: CourseBoundReviewResponseCard[];
  responseBasePath: string;
};

function formatMean(value: number | null) {
  return value === null ? "N/A" : value.toFixed(2);
}

export function AnonymizedResponseCards({
  responses,
  responseBasePath,
}: AnonymizedResponseCardsProps) {
  if (responses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-text-muted">
        No submitted responses yet.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {responses.map((response) => (
        <li key={response.responseId}>
          <Card size="sm">
            <CardHeader className="gap-1">
              <CardTitle>{response.respondentLabel}</CardTitle>
              <p className="text-xs text-text-muted">Submitted {response.submittedAt.toLocaleDateString()}</p>
            </CardHeader>

            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-text-muted">
                Mean: <span className="font-semibold text-text-primary">{formatMean(response.overallMean)}</span>
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href={`${responseBasePath}/responses/${response.responseId}`}>View Response</Link>
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
