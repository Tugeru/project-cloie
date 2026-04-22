import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseBoundResponseReview } from "@/features/analytics/types";

type AnonymizedResponseDetailProps = {
  response: CourseBoundResponseReview;
};

function formatMean(value: number | null) {
  return value === null ? "N/A" : value.toFixed(2);
}

export function AnonymizedResponseDetail({ response }: AnonymizedResponseDetailProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold">{response.evaluationTitle}</h1>
        <p className="text-sm text-text-muted">
          {response.courseTitle} | {response.programLabel} | {response.academicYear}
        </p>
        <p className="text-sm text-text-muted">{response.respondentLabel}</p>
      </section>

      <section className="rounded-xl border border-border p-4">
        <p className="text-sm text-text-muted">
          Response Mean: <span className="font-semibold text-text-primary">{formatMean(response.overallMean)}</span>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Section Responses (Read-only)</h2>
        {response.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="gap-1">
              <CardTitle>{section.name}</CardTitle>
              <p className="text-sm text-text-muted">Mean: {formatMean(section.mean)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Quantitative</h3>
                {section.quantitativeResponses.length === 0 ? (
                  <p className="text-sm text-text-muted">No quantitative answers.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {section.quantitativeResponses.map((entry) => (
                      <li key={`${section.id}-${entry.itemKey}`}>
                        {entry.prompt}: <span className="font-semibold">{entry.rating}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Qualitative</h3>
                {section.qualitativeResponses.length === 0 ? (
                  <p className="text-sm text-text-muted">No qualitative answers.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {section.qualitativeResponses.map((entry) => (
                      <li key={`${section.id}-${entry.promptKey}`} className="rounded-md border border-border p-3">
                        <p className="font-semibold">{entry.prompt}</p>
                        <p className="mt-1 text-text-muted">{entry.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
