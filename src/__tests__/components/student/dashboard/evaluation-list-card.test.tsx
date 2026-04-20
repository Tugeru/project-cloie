import { render, screen } from "@testing-library/react";
import { EvaluationListCard } from "@/components/student/dashboard/evaluation-list-card";
import { expect, test, describe } from "vitest";

describe("EvaluationListCard", () => {
  const mockProps = {
    evaluationId: "eval-1",
    evaluationTitle: "Post-Term CILO Evaluation",
    courseTitle: "ITE 18",
    programLabel: "BSIT",
    deadlineAt: new Date("2026-05-20"),
    status: "NOT_STARTED" as const,
    progress: 0,
    section: { id: "section-b", name: "Section B", description: "", items: [] },
    session: { responseId: null, answeredItems: 0, totalItems: 5, submittedAt: null },
  };

  test("renders basic evaluation details", () => {
    render(<EvaluationListCard {...mockProps} />);

    expect(screen.getByText(/Post-Term CILO Evaluation/i)).toBeDefined();
    expect(screen.getByText(/ITE 18/i)).toBeDefined();
    expect(screen.getByText(/Deadline: May 20/i)).toBeDefined();
  });

  test("shows progress bar when in progress", () => {
    render(<EvaluationListCard {...mockProps} status="IN_PROGRESS" progress={45} />);

    expect(screen.getByText(/45% Complete/i)).toBeDefined();
    expect(screen.getByRole("progressbar")).toBeDefined();
  });
});
