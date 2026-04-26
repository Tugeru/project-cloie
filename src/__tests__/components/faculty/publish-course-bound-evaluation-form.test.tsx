import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AcademicSemester, AcademicTerm } from "@prisma/client";
import { PublishCourseBoundEvaluationForm } from "@/features/evaluations/components/publish-course-bound-evaluation-form";

describe("PublishCourseBoundEvaluationForm", () => {
  const publicationContext = {
    bindings: [
      {
        ciloDescriptionSnapshot: "Apply core concepts",
        ciloId: "cilo-1",
        itemKey: "q1",
        questionPromptSnapshot: "Students can apply the core concepts taught in the course.",
        sectionKey: "outcomes",
      },
      {
        ciloDescriptionSnapshot: "Build maintainable software",
        ciloId: "cilo-2",
        itemKey: "q2",
        questionPromptSnapshot: "Students can produce maintainable software artifacts.",
        sectionKey: "outcomes",
      },
    ],
    cilos: [
      { description: "Apply core concepts", id: "cilo-1" },
      { description: "Build maintainable software", id: "cilo-2" },
    ],
    course: {
      code: "CS101",
      courseType: "PROGRAM_SPECIFIC",
      id: "course-1",
      majorId: null,
      majorName: null,
      programCode: "BSCS",
      programId: "program-1",
      programName: "BS Computer Science",
      scopeLabel: "BSCS - Shared Program Course",
      title: "Intro to Computing",
    },
    majorId: null,
    programId: "program-1",
    template: {
      id: "template-1",
      name: "Course-Bound CILO Evaluation",
    },
  };

  const yearLevels = [
    { id: "year-1", name: "1st Year", order: 1 },
    { id: "year-2", name: "2nd Year", order: 2 },
  ];

  it("renders the saved template context and bound cilos", () => {
    render(
      <PublishCourseBoundEvaluationForm
        publicationContext={publicationContext}
        yearLevels={yearLevels}
        publishAction={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: /publish cilo evaluation/i })).toBeInTheDocument();
    expect(screen.getByText("Course-Bound CILO Evaluation")).toBeInTheDocument();
    expect(screen.getByText("CS101 - Intro to Computing")).toBeInTheDocument();
    expect(screen.getByText("Apply core concepts")).toBeInTheDocument();
    expect(
      screen.getByText(/students can apply the core concepts taught in the course/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("1st Year")).toBeInTheDocument();
    expect(screen.getByLabelText("2nd Year")).toBeInTheDocument();
  });

  it("submits the targeting payload using the saved template context", async () => {
    const publishAction = vi.fn().mockResolvedValue({
      assignmentCount: 40,
      evaluationId: "eval-1",
      status: "ACTIVE",
      success: true,
      targetCount: 2,
    });

    render(
      <PublishCourseBoundEvaluationForm
        initialSelection={{
          academicYear: "2026-2027",
          semester: AcademicSemester.FIRST,
          term: AcademicTerm.FIRST_TERM,
        }}
        publicationContext={publicationContext}
        yearLevels={yearLevels}
        publishAction={publishAction}
      />
    );

    fireEvent.change(screen.getByLabelText(/deployed evaluation name/i), {
      target: { value: "CS101 Post-Term CILO Evaluation" },
    });
    fireEvent.change(screen.getByLabelText(/activation schedule/i), {
      target: { value: "2026-05-01T08:30" },
    });
    fireEvent.change(screen.getByLabelText(/deadline/i), {
      target: { value: "2026-05-31T23:59" },
    });
    fireEvent.click(screen.getByLabelText("1st Year"));
    fireEvent.click(screen.getByLabelText("2nd Year"));
    fireEvent.click(screen.getByRole("button", { name: /publish evaluation/i }));

    await waitFor(() => {
      expect(publishAction).toHaveBeenCalledTimes(1);
    });

    expect(publishAction).toHaveBeenCalledWith({
      academicYear: "2026-2027",
      activationAt: new Date("2026-05-01T08:30"),
      deadlineAt: new Date("2026-05-31T23:59"),
      deploymentName: "CS101 Post-Term CILO Evaluation",
      semester: AcademicSemester.FIRST,
      templateId: "template-1",
      term: AcademicTerm.FIRST_TERM,
      yearLevelIds: ["year-1", "year-2"],
    });
    expect(screen.getByText(/evaluation published successfully\./i)).toBeInTheDocument();
  });
});
