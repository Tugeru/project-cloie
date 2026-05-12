import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CourseBoundReviewListItem } from "@/features/analytics/types";

type PublishedCourseBoundListProps = {
  title: string;
  subtitle: string;
  items: CourseBoundReviewListItem[];
  detailBasePath: string;
  emptyMessage: string;
};

function formatMean(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return value.toFixed(2);
}

export function PublishedCourseBoundList({
  title,
  subtitle,
  items,
  detailBasePath,
  emptyMessage,
}: PublishedCourseBoundListProps) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-text-muted text-sm">{subtitle}</p>
      </header>

      {items.length === 0 ? (
        <div className="border-border text-text-muted rounded-lg border border-dashed p-5 text-sm">
          {emptyMessage}
        </div>
      ) : (
        <ul className="grid gap-4">
          {items.map((item) => (
            <li key={item.evaluationId}>
              <Card>
                <CardHeader className="gap-2">
                  <CardTitle>{item.evaluationTitle}</CardTitle>
                  <p className="text-text-muted text-sm">
                    {item.courseTitle} | {item.programLabel} | {item.termInstanceLabel}
                  </p>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-text-muted grid gap-1 text-sm">
                    <p>
                      Responses:{" "}
                      <span className="text-text-primary font-semibold">{item.responseCount}</span>
                    </p>
                    <p>
                      Overall Mean:{" "}
                      <span className="text-text-primary font-semibold">
                        {formatMean(item.overallMean)}
                      </span>
                    </p>
                  </div>

                  <Button asChild>
                    <Link href={`${detailBasePath}/${item.evaluationId}`}>Review Evaluation</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
