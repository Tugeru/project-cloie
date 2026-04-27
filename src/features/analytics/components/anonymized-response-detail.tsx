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
        <p className="text-text-muted text-sm">
          {response.courseTitle} | {response.programLabel} | {response.academicYear}
        </p>
        <p className="text-text-muted text-sm">{response.respondentLabel}</p>
      </section>

      <section className="border-border rounded-xl border p-4">
        <p className="text-text-muted text-sm">
          Response Mean:{" "}
          <span className="text-text-primary font-semibold">
            {formatMean(response.overallMean)}
          </span>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Section Responses (Read-only)</h2>
        {response.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="gap-1">
              <CardTitle>{section.name}</CardTitle>
              <p className="text-text-muted text-sm">Mean: {formatMean(section.mean)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Quantitative</h3>
                {section.quantitativeResponses.length === 0 ? (
                  <p className="text-text-muted text-sm">No quantitative answers.</p>
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
                  <p className="text-text-muted text-sm">No qualitative answers.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {section.qualitativeResponses.map((entry) => (
                      <li
                        key={`${section.id}-${entry.promptKey}`}
                        className="border-border rounded-md border p-3"
                      >
                        <p className="font-semibold">{entry.prompt}</p>
                        <p className="text-text-muted mt-1">{entry.text}</p>
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
