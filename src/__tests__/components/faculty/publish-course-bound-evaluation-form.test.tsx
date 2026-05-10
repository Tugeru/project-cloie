import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AcademicSemester, AcademicTerm, YearLevel } from "@prisma/client";
import { PublishCourseBoundEvaluationFormV2 } from "@/features/evaluations/components/publish-course-bound-evaluation-form-v2";
import type { AssignmentOption } from "@/features/evaluations/components/assignment-picker";
import type { TermInstanceItem } from "@/features/academic-calendar/types";

describe("PublishCourseBoundEvaluationFormV2", () => {
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
      id: "course-1",
      title: "Intro to Computing",
    },
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

  const termInstances: TermInstanceItem[] = [
    {
      id: "term-1",
      schoolYearId: "sy-1",
      schoolYearCode: "2025-2026",
      semester: AcademicSemester.FIRST,
      term: AcademicTerm.FIRST_TERM,
      startDate: null,
      endDate: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const assignments: AssignmentOption[] = [
    {
      id: "assignment-1",
      courseId: "course-1",
      courseCode: "CS101",
      courseTitle: "Intro to Computing",
      programId: "program-1",
      programCode: "BSCS",
      yearLevel: YearLevel.FIRST_YEAR,
      section: "MORNING",
      termInstanceId: "term-1",
      termInstanceLabel: "2025-2026 — 1st Semester — 1st Term",
      isActive: true,
    },
  ];

  const yearLevels = Object.values(YearLevel);

  it("renders the saved template context and bound cilos", () => {
    render(
      <PublishCourseBoundEvaluationFormV2
        assignments={assignments}
        termInstances={termInstances}
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
    // Assignment picker exists
    expect(screen.getByText(/class assignment/i)).toBeInTheDocument();
  });

  it("loads preview when assignment is selected then publishes with confirmed respondents", async () => {
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
          yearLevel: YearLevel.FIRST_YEAR,
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
      <PublishCourseBoundEvaluationFormV2
        assignments={assignments}
        termInstances={termInstances}
        publicationContext={publicationContext}
        yearLevels={yearLevels}
        previewAction={previewAction}
        publishAction={publishAction}
      />
    );

    fireEvent.change(screen.getByLabelText(/deployed evaluation name/i), {
      target: { value: "CS101 Post-Term CILO Evaluation" },
    });

    // Select assignment from dropdown
    fireEvent.click(screen.getByText(/select a class/i));
    await waitFor(() => {
      expect(screen.getByText(/CS101 - Intro to Computing/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/CS101 - Intro to Computing/i));

    // Click Preview Respondents
    fireEvent.click(screen.getByRole("button", { name: /preview respondents/i }));

    await waitFor(() => {
      expect(previewAction).toHaveBeenCalledTimes(1);
    });

    // V2 form calls preview with assignmentId only
    expect(previewAction).toHaveBeenCalledWith({
      assignmentId: "assignment-1",
    });

    // Confirm and publish
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /publish evaluation/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /publish evaluation/i }));

    await waitFor(() => {
      expect(publishAction).toHaveBeenCalledTimes(1);
    });

    // V2 form calls publish with simplified payload
    expect(publishAction).toHaveBeenCalledWith(
      expect.objectContaining({
        assignmentId: "assignment-1",
        deploymentName: "CS101 Post-Term CILO Evaluation",
        respondentIds: ["user-1"],
        templateId: "template-1",
      })
    );
  });

  it("shows empty state when no assignments available", () => {
    render(
      <PublishCourseBoundEvaluationFormV2
        assignments={[]}
        termInstances={termInstances}
        publicationContext={publicationContext}
        yearLevels={yearLevels}
        previewAction={vi.fn()}
        publishAction={vi.fn()}
      />
    );

    expect(screen.getByText(/no assignments available/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /preview respondents/i })).toBeDisabled();
  });

  it("filters assignments by selected term", async () => {
    const multiTermInstances: TermInstanceItem[] = [
      {
        id: "term-1",
        schoolYearId: "sy-1",
        schoolYearCode: "2025-2026",
        semester: AcademicSemester.FIRST,
        term: AcademicTerm.FIRST_TERM,
        startDate: null,
        endDate: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "term-2",
        schoolYearId: "sy-1",
        schoolYearCode: "2025-2026",
        semester: AcademicSemester.SECOND,
        term: AcademicTerm.FIRST_TERM,
        startDate: null,
        endDate: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const multiAssignments: AssignmentOption[] = [
      {
        id: "assignment-1",
        courseId: "course-1",
        courseCode: "CS101",
        courseTitle: "Intro to Computing",
        programId: "program-1",
        programCode: "BSCS",
        yearLevel: YearLevel.FIRST_YEAR,
        section: null,
        termInstanceId: "term-1",
        termInstanceLabel: "2025-2026 — 1st Semester",
        isActive: true,
      },
      {
        id: "assignment-2",
        courseId: "course-1",
        courseCode: "CS101",
        courseTitle: "Intro to Computing",
        programId: "program-1",
        programCode: "BSCS",
        yearLevel: YearLevel.SECOND_YEAR,
        section: null,
        termInstanceId: "term-2",
        termInstanceLabel: "2025-2026 — 2nd Semester",
        isActive: true,
      },
    ];

    render(
      <PublishCourseBoundEvaluationFormV2
        assignments={multiAssignments}
        termInstances={multiTermInstances}
        publicationContext={publicationContext}
        yearLevels={yearLevels}
        previewAction={vi.fn()}
        publishAction={vi.fn()}
      />
    );

    // Select a term from the dropdown
    fireEvent.click(screen.getByText(/all terms/i));
    await waitFor(() => {
      expect(screen.getByText(/2025-2026 — 1st Semester — 1st Term/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/2025-2026 — 1st Semester — 1st Term/i));

    // Now only assignments for that term should be shown
    // The assignment picker should update to show filtered results
    fireEvent.click(screen.getByText(/select a class/i));
    await waitFor(() => {
      // Should only see 1st year assignment (from term-1)
      expect(screen.getByText(/1st Year/i)).toBeInTheDocument();
    });
  });
});
