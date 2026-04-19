import { render, screen } from "@testing-library/react";
import { EvaluationListCard } from "@/components/student/dashboard/evaluation-list-card";
import { expect, test, describe } from "vitest";

describe("EvaluationListCard", () => {
  const mockProps = {
    title: "Post-Term CILO Evaluation",
    course: "ITE 18",
    program: "BSIT",
    deadline: "May 20",
    status: "NOT_STARTED" as const
  };

  test("renders basic evaluation details", () => {
    render(<EvaluationListCard {...mockProps} />);

    expect(screen.getByText(mockProps.title)).toBeDefined();
    expect(screen.getByText(/ITE 18/i)).toBeDefined();
    expect(screen.getByText(/Deadline: May 20/i)).toBeDefined();
  });

  test("shows progress bar when in progress", () => {
    render(<EvaluationListCard {...mockProps} status="IN_PROGRESS" progress={45} />);

    expect(screen.getByText(/45% Complete/i)).toBeDefined();
    expect(screen.getByRole("progressbar")).toBeDefined();
  });
});
