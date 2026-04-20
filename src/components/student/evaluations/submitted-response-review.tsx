import type { SubmittedResponseSection } from "@/modules/student-evaluation-workflow/services/get-student-submitted-response-review";

interface SubmittedResponseReviewProps {
  evaluationTitle: string;
  courseTitle: string;
  submittedAt: Date;
  sections: SubmittedResponseSection[];
}

export function SubmittedResponseReview({
  evaluationTitle,
  courseTitle,
  submittedAt,
  sections,
}: SubmittedResponseReviewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black font-heading">{evaluationTitle}</h1>
        <p className="text-sm text-text-secondary">{courseTitle}</p>
        <p className="text-xs text-text-muted mt-1">
          Submitted on {formatDate(submittedAt)}
        </p>
      </div>

      {sections.map((section) => (
        <section key={section.id} className="space-y-4">
          <h2 className="text-lg font-bold border-b border-border pb-2">{section.name}</h2>
          <div className="space-y-4">
            {section.items.map((item, idx) => {
              const itemKey = item.kind === "quantitative" ? item.itemKey : item.promptKey;
              return (
                <div key={itemKey ?? idx} className="rounded-xl border border-border p-4">
                  <p className="text-sm text-text-secondary mb-2">{item.prompt}</p>
                  <p className="font-bold text-text-primary">
                    {item.answer !== undefined ? String(item.answer) : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}