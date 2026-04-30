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
      courseType: "PROGRAM_SPECIFIC" as const,
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
      structure: [
        {
          key: "outcomes",
          title: "Learning Outcomes",
          order: 0,
          questions: [
            { key: "q1", prompt: "Students can apply the core concepts taught in the course.", type: "likert" as const, order: 0, required: true },
            { key: "q2", prompt: "Students can produce maintainable software artifacts.", type: "likert" as const, order: 1, required: true },
          ],
        },
      ],
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
        previewAction={vi.fn()}
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
    // Year level is now a dropdown (single-select)
    expect(screen.getByLabelText(/target year level/i)).toBeInTheDocument();
    // Section selector exists
    expect(screen.getByLabelText(/section/i)).toBeInTheDocument();
  });

  it("loads preview when configuration is valid then publishes with confirmed respondents", async () => {
    const previewAction = vi.fn().mockResolvedValue({
      respondents: [
        {
          email: "alice@school.edu",
          firstName: "Alice",
          lastName: "Adams",
          majorId: null,
          majorName: null,
          programCode: "BSCS",
          programId: "program-1",
          programName: "BS Computer Science",
          section: "MORNING",
          studentId: "S001",
          userId: "user-1",
          yearLevelId: "year-1",
          yearLevelName: "1st Year",
        },
      ],
      success: true,
      totalCount: 1,
    });
    const publishAction = vi.fn().mockResolvedValue({
      assignmentCount: 1,
      evaluationId: "eval-1",
      status: "ACTIVE",
      success: true,
      targetCount: 1,
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
        previewAction={previewAction}
        publishAction={publishAction}
      />
    );

    fireEvent.change(screen.getByLabelText(/deployed evaluation name/i), {
      target: { value: "CS101 Post-Term CILO Evaluation" },
    });
    // Select year level (single)
    fireEvent.change(screen.getByLabelText(/target year level/i), {
      target: { value: "year-1" },
    });
    // For PROGRAM_SPECIFIC courses the single program is pre-selected — verify, don't click
    expect(screen.getByLabelText(/BSCS - BS Computer Science/i)).toBeChecked();
    // Click Preview Respondents
    fireEvent.click(screen.getByRole("button", { name: /preview respondents/i }));

    await waitFor(() => {
      expect(previewAction).toHaveBeenCalledTimes(1);
    });

    expect(previewAction).toHaveBeenCalledWith({
      academicYear: "2026-2027",
      section: null,
      targetPrograms: ["program-1"],
      targetYearLevelId: "year-1",
    });

    // Confirm and publish
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /confirm and publish/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm and publish/i }));

    await waitFor(() => {
      expect(publishAction).toHaveBeenCalledTimes(1);
    });

    expect(publishAction).toHaveBeenCalledWith(
      expect.objectContaining({
        academicYear: "2026-2027",
        deploymentName: "CS101 Post-Term CILO Evaluation",
        respondentIds: ["user-1"],
        section: null,
        semester: AcademicSemester.FIRST,
        targetPrograms: ["program-1"],
        targetYearLevelId: "year-1",
        templateId: "template-1",
        term: AcademicTerm.FIRST_TERM,
      })
    );
  });
});
