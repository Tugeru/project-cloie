import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublishCourseBoundEvaluationForm } from "@/components/faculty/publish-course-bound-evaluation-form";

describe("PublishCourseBoundEvaluationForm", () => {
  const courseContexts = [
    {
      courseCode: "CS101",
      courseId: "course-1",
      courseTitle: "Intro to Computing",
      programCode: "BSCS",
      programId: "program-1",
      programName: "BS Computer Science",
    },
  ];

  const yearLevels = [
    { id: "year-1", name: "1st Year", order: 1 },
    { id: "year-2", name: "2nd Year", order: 2 },
  ];

  it("renders available course contexts and year levels", () => {
    render(
      <PublishCourseBoundEvaluationForm
        courseContexts={courseContexts}
        yearLevels={yearLevels}
        publishAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: /publish cilo evaluation/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /CS101 - Intro to Computing/i })).toBeInTheDocument();
    expect(screen.getByLabelText("1st Year")).toBeInTheDocument();
    expect(screen.getByLabelText("2nd Year")).toBeInTheDocument();
  });

  it("submits normalized payload to publish action", async () => {
    const publishAction = vi.fn().mockResolvedValue({
      assignmentCount: 40,
      evaluationId: "eval-1",
      status: "ACTIVE",
      success: true,
      targetCount: 2,
    });

    render(
      <PublishCourseBoundEvaluationForm
        courseContexts={courseContexts}
        yearLevels={yearLevels}
        publishAction={publishAction}
      />,
    );

    fireEvent.change(screen.getByLabelText(/course context/i), { target: { value: "course-1" } });
    fireEvent.change(screen.getByLabelText(/academic year/i), { target: { value: "2026-2027" } });
    fireEvent.change(screen.getByLabelText(/semester/i), { target: { value: "1ST" } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: "PRELIM" } });
    fireEvent.change(screen.getByLabelText(/activation schedule/i), {
      target: { value: "2026-05-01T08:30" },
    });
    fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: "2026-05-31T23:59" } });
    fireEvent.change(screen.getByLabelText(/target cilos/i), {
      target: { value: "Apply core concepts\n\nBuild maintainable software" },
    });
    fireEvent.click(screen.getByLabelText("1st Year"));
    fireEvent.click(screen.getByLabelText("2nd Year"));
    fireEvent.click(screen.getByRole("button", { name: /publish evaluation/i }));

    await waitFor(() => {
      expect(publishAction).toHaveBeenCalledTimes(1);
    });

    const payload = publishAction.mock.calls[0][0];
    expect(payload).toMatchObject({
      academicYear: "2026-2027",
      courseId: "course-1",
      semester: "1ST",
      term: "PRELIM",
      yearLevelIds: ["year-1", "year-2"],
      cilos: [{ description: "Apply core concepts" }, { description: "Build maintainable software" }],
    });
    expect(payload.activationAt).toBeInstanceOf(Date);
    expect(payload.deadlineAt).toBeInstanceOf(Date);
    expect(screen.getByText(/evaluation published successfully/i)).toBeInTheDocument();
  });

  it("shows validation error when required values are missing", async () => {
    const publishAction = vi.fn();

    render(
      <PublishCourseBoundEvaluationForm
        courseContexts={courseContexts}
        yearLevels={yearLevels}
        publishAction={publishAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /publish evaluation/i }));

    expect(await screen.findByText(/please select a course context/i)).toBeInTheDocument();
    expect(publishAction).not.toHaveBeenCalled();
  });

  it("shows action-provided error when publish returns success false", async () => {
    const publishAction = vi.fn().mockResolvedValue({
      error: "An evaluation is already published for this course context.",
      success: false,
    });

    render(
      <PublishCourseBoundEvaluationForm
        courseContexts={courseContexts}
        yearLevels={yearLevels}
        publishAction={publishAction}
      />,
    );

    fireEvent.change(screen.getByLabelText(/course context/i), { target: { value: "course-1" } });
    fireEvent.change(screen.getByLabelText(/academic year/i), { target: { value: "2026-2027" } });
    fireEvent.change(screen.getByLabelText(/target cilos/i), { target: { value: "CILO A" } });
    fireEvent.click(screen.getByLabelText("1st Year"));
    fireEvent.click(screen.getByRole("button", { name: /publish evaluation/i }));

    expect(await screen.findByText(/already published for this course context/i)).toBeInTheDocument();
  });

  it("shows fallback error when publish action throws", async () => {
    const publishAction = vi.fn().mockRejectedValue(new Error("Network down"));

    render(
      <PublishCourseBoundEvaluationForm
        courseContexts={courseContexts}
        yearLevels={yearLevels}
        publishAction={publishAction}
      />,
    );

    fireEvent.change(screen.getByLabelText(/course context/i), { target: { value: "course-1" } });
    fireEvent.change(screen.getByLabelText(/academic year/i), { target: { value: "2026-2027" } });
    fireEvent.change(screen.getByLabelText(/target cilos/i), { target: { value: "CILO A" } });
    fireEvent.click(screen.getByLabelText("1st Year"));
    fireEvent.click(screen.getByRole("button", { name: /publish evaluation/i }));

    expect(
      await screen.findByText(/unable to publish evaluation right now\. please try again\./i),
    ).toBeInTheDocument();
  });
});
