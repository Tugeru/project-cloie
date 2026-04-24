import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AcademicSemester, AcademicTerm } from "@prisma/client";
import { PublishCourseBoundEvaluationForm } from "@/features/evaluations/components/publish-course-bound-evaluation-form";

describe("PublishCourseBoundEvaluationForm", () => {
  const courseContexts = [
    {
      courseCode: "CS101",
      courseId: "course-1",
      courseTitle: "Intro to Computing",
      courseType: "PROGRAM_SPECIFIC" as const,
      majorId: null,
      majorName: null,
      programCode: "BSCS",
      programId: "program-1",
      programName: "BS Computer Science",
      scopeLabel: "BSCS - Shared Program Course",
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
        loadManagedCilosAction={vi.fn().mockResolvedValue({
          ciloAcademicTerm: "2026-2027|FIRST|FIRST_TERM|program-1",
          hasSavedCilos: false,
          items: [],
          success: true,
        })}
        yearLevels={yearLevels}
        publishAction={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/program context/i), {
      target: { value: "program-1" },
    });

    expect(
      screen.getByRole("heading", { name: /publish cilo evaluation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /CS101 - Intro to Computing/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("1st Year")).toBeInTheDocument();
    expect(screen.getByLabelText("2nd Year")).toBeInTheDocument();
  });

  it("submits normalized payload to publish action using saved cilos", async () => {
    const publishAction = vi.fn().mockResolvedValue({
      assignmentCount: 40,
      evaluationId: "eval-1",
      status: "ACTIVE",
      success: true,
      targetCount: 2,
    });
    const loadManagedCilosAction = vi.fn().mockResolvedValue({
      ciloAcademicTerm: "2026-2027|FIRST|FIRST_TERM|program-1",
      hasSavedCilos: true,
      items: [
        { description: "Apply core concepts", id: "cilo-1", order: 1 },
        { description: "Build maintainable software", id: "cilo-2", order: 2 },
      ],
      success: true,
    });

    render(
      <PublishCourseBoundEvaluationForm
        courseContexts={courseContexts}
        loadManagedCilosAction={loadManagedCilosAction}
        yearLevels={yearLevels}
        publishAction={publishAction}
      />,
    );

    fireEvent.change(screen.getByLabelText(/program context/i), {
      target: { value: "program-1" },
    });
    fireEvent.change(screen.getByLabelText(/^course$/i), {
      target: { value: "course-1" },
    });
    fireEvent.change(screen.getByLabelText(/academic year/i), {
      target: { value: "2026-2027" },
    });
    fireEvent.change(screen.getByLabelText(/^semester$/i), {
      target: { value: AcademicSemester.FIRST },
    });
    fireEvent.change(screen.getByLabelText(/term/i), {
      target: { value: AcademicTerm.FIRST_TERM },
    });
    fireEvent.change(screen.getByLabelText(/activation schedule/i), {
      target: { value: "2026-05-01T08:30" },
    });
    fireEvent.change(screen.getByLabelText(/deadline/i), {
      target: { value: "2026-05-31T23:59" },
    });

    await waitFor(() => {
      expect(loadManagedCilosAction).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("Apply core concepts")).toBeInTheDocument();
    expect(screen.getByText("Build maintainable software")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("1st Year"));
    fireEvent.click(screen.getByLabelText("2nd Year"));
    fireEvent.click(screen.getByRole("button", { name: /publish evaluation/i }));

    await waitFor(() => {
      expect(publishAction).toHaveBeenCalledTimes(1);
    });

    const payload = publishAction.mock.calls[0][0];
    expect(payload).toMatchObject({
      academicYear: "2026-2027",
      cilos: [
        { description: "Apply core concepts" },
        { description: "Build maintainable software" },
      ],
      courseId: "course-1",
      programId: "program-1",
      semester: AcademicSemester.FIRST,
      term: AcademicTerm.FIRST_TERM,
      yearLevelIds: ["year-1", "year-2"],
    });
    expect(payload.activationAt).toBeInstanceOf(Date);
    expect(payload.deadlineAt).toBeInstanceOf(Date);
    expect(
      screen.getByText(/evaluation published successfully/i),
    ).toBeInTheDocument();
  });

  it("keeps publishing disabled until saved cilos are available", async () => {
    const publishAction = vi.fn();

    render(
      <PublishCourseBoundEvaluationForm
        courseContexts={courseContexts}
        loadManagedCilosAction={vi.fn().mockResolvedValue({
          ciloAcademicTerm: "2026-2027|FIRST|FIRST_TERM|program-1",
          hasSavedCilos: false,
          items: [],
          success: true,
        })}
        yearLevels={yearLevels}
        publishAction={publishAction}
      />,
    );

    expect(screen.getByRole("button", { name: /publish evaluation/i })).toBeDisabled();
    expect(publishAction).not.toHaveBeenCalled();
  });
});
