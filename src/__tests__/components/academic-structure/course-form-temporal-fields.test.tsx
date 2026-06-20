import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicSemester, AcademicTerm, CourseScope, YearLevel } from "@prisma/client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/secretary/courses",
  useSearchParams: () => new URLSearchParams(),
}));

import { CourseForm } from "@/features/academic-structure/components/course-form";

describe("CourseForm temporal fields", () => {
  const mockAction = vi.fn().mockResolvedValue({ success: true });
  beforeEach(() => {
    mockAction.mockClear();
  });
  const mockPrograms = [
    { id: "prog-1", code: "BSCS", name: "BS Computer Science" },
    { id: "prog-2", code: "BSED", name: "BS Education" },
  ];
  const mockMajors = [
    { id: "major-1", name: "Computer Science", program_id: "prog-1", program_code: "BSCS" },
    { id: "major-2", name: "English", program_id: "prog-2", program_code: "BSED" },
  ];

  type CourseFormDefaultValues = Parameters<typeof CourseForm>[0]["defaultValues"];

  const renderCourseForm = (defaultValues?: CourseFormDefaultValues) => {
    return render(
      <CourseForm
        action={mockAction}
        programs={mockPrograms}
        majors={mockMajors}
        defaultValues={defaultValues}
        submitLabel="Save Course"
      />
    );
  };

  describe("temporal field rendering", () => {
    it("renders Year Level, Semester, and Term selects after course scope/program/major block", () => {
      renderCourseForm();

      expect(screen.getByLabelText(/year level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/semester/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/term/i)).toBeInTheDocument();
    });

    it("labels temporal fields as optional/default", () => {
      renderCourseForm();

      const yearLevelLabel = screen.getByLabelText(/year level/i);
      const semesterLabel = screen.getByLabelText(/semester/i);
      const termLabel = screen.getByLabelText(/term/i);

      // Fields should be optional (not have required attribute)
      expect(yearLevelLabel).not.toHaveAttribute("required");
      expect(semesterLabel).not.toHaveAttribute("required");
      expect(termLabel).not.toHaveAttribute("required");
    });
  });

  describe("Summer semester disables Term field", () => {
    it("disables Term select when Summer semester is selected", async () => {
      renderCourseForm();

      const semesterSelect = screen.getByLabelText(/semester/i);
      const termSelect = screen.getByLabelText(/term/i);

      // Select Summer semester
      fireEvent.change(semesterSelect, { target: { value: AcademicSemester.SUMMER } });

      // Wait for Term to be disabled
      await waitFor(() => {
        expect(termSelect).toBeDisabled();
      });

      // Term should show N/A or be empty
      expect(termSelect).toHaveValue("");
    });

    it("enables Term select when changing from Summer to regular semester", async () => {
      renderCourseForm();

      const semesterSelect = screen.getByLabelText(/semester/i);
      const termSelect = screen.getByLabelText(/term/i);

      // First set to Summer
      fireEvent.change(semesterSelect, { target: { value: AcademicSemester.SUMMER } });
      await waitFor(() => {
        expect(termSelect).toBeDisabled();
      });

      // Change to First semester
      fireEvent.change(semesterSelect, { target: { value: AcademicSemester.FIRST } });

      // Term should be enabled now
      await waitFor(() => {
        expect(termSelect).not.toBeDisabled();
      });
    });

    it("shows helper text that Summer has no terms", () => {
      renderCourseForm();

      const semesterSelect = screen.getByLabelText(/semester/i);
      fireEvent.change(semesterSelect, { target: { value: AcademicSemester.SUMMER } });

      expect(screen.getByText(/summer semester has no terms/i)).toBeInTheDocument();
    });
  });

  describe("temporal defaults persistence on edit", () => {
    it("loads default_year_level, default_semester, default_term from defaultValues", () => {
      renderCourseForm({
        id: "course-1",
        code: "TEST101",
        title: "Test Course",
        course_scope: CourseScope.PROGRAM_SPECIFIC,
        program_id: "prog-1",
        major_id: null,
        default_year_level: YearLevel.FIRST_YEAR,
        default_semester: AcademicSemester.FIRST,
        default_term: AcademicTerm.FIRST_TERM,
      });

      expect(screen.getByLabelText(/year level/i)).toHaveValue(YearLevel.FIRST_YEAR);
      expect(screen.getByLabelText(/semester/i)).toHaveValue(AcademicSemester.FIRST);
      expect(screen.getByLabelText(/term/i)).toHaveValue(AcademicTerm.FIRST_TERM);
    });

    it("allows clearing temporal defaults to empty values", () => {
      renderCourseForm({
        id: "course-1",
        code: "TEST101",
        title: "Test Course",
        course_scope: CourseScope.PROGRAM_SPECIFIC,
        program_id: "prog-1",
        major_id: null,
        default_year_level: YearLevel.SECOND_YEAR,
        default_semester: AcademicSemester.SECOND,
        default_term: AcademicTerm.SECOND_TERM,
      });

      const yearLevelSelect = screen.getByLabelText(/year level/i);
      fireEvent.change(yearLevelSelect, { target: { value: "" } });
      expect(yearLevelSelect).toHaveValue("");
    });
  });

  describe("form submission with temporal fields", () => {
    it("submits temporal field values in FormData", async () => {
      renderCourseForm();

      const yearLevelSelect = screen.getByLabelText(/year level/i);
      const semesterSelect = screen.getByLabelText(/semester/i);
      const termSelect = screen.getByLabelText(/term/i);
      const submitButton = screen.getByRole("button", { name: /save course/i });

      fireEvent.change(yearLevelSelect, { target: { value: YearLevel.FIRST_YEAR } });
      fireEvent.change(semesterSelect, { target: { value: AcademicSemester.FIRST } });
      fireEvent.change(termSelect, { target: { value: AcademicTerm.FIRST_TERM } });

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/course code/i), {
        target: { value: "TEST101" },
      });
      fireEvent.change(screen.getByLabelText(/course title/i), {
        target: { value: "Test Course" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalled();
      });

      const formData = mockAction.mock.calls[0][0] as FormData;
      expect(formData.get("default_year_level")).toBe(YearLevel.FIRST_YEAR);
      expect(formData.get("default_semester")).toBe(AcademicSemester.FIRST);
      expect(formData.get("default_term")).toBe(AcademicTerm.FIRST_TERM);
    });

    it("submits null/empty term when Summer is selected", async () => {
      renderCourseForm();

      const semesterSelect = screen.getByLabelText(/semester/i) as HTMLSelectElement;
      const submitButton = screen.getByRole("button", { name: /save course/i });

      fireEvent.change(semesterSelect, { target: { value: AcademicSemester.SUMMER } });
      
      // Verify the select value changed
      expect(semesterSelect.value).toBe(AcademicSemester.SUMMER);

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/course code/i), {
        target: { value: "SUM101" },
      });
      fireEvent.change(screen.getByLabelText(/course title/i), {
        target: { value: "Summer Course" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalled();
      });

      const formData = mockAction.mock.calls[0][0] as FormData;
      expect(formData.get("default_semester")).toBe(AcademicSemester.SUMMER);
      // Term should be empty or null for Summer
      const termValue = formData.get("default_term");
      expect(termValue === "" || termValue === null).toBe(true);
    });
  });
});

  describe("CourseForm Zod validation for temporal fields", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("rejects Summer semester with non-null term via superRefine", async () => {
    const { createCourseSchema } = await import(
      "@/features/academic-structure/schemas/course"
    );

    const invalidData = {
      code: "TEST101",
      title: "Test Course",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
      program_id: validUuid,
      major_id: null,
      default_semester: AcademicSemester.SUMMER,
      default_term: AcademicTerm.FIRST_TERM, // Invalid: Summer should have null term
    };

    const result = createCourseSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("default_semester"))).toBe(true);
    }
  });

  it("accepts Summer semester with null term", async () => {
    const { createCourseSchema } = await import(
      "@/features/academic-structure/schemas/course"
    );

    const validData = {
      code: "SUM101",
      title: "Summer Course",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
      program_id: validUuid,
      major_id: null,
      default_semester: AcademicSemester.SUMMER,
      default_term: null,
    };

    const result = createCourseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts regular semester with term", async () => {
    const { createCourseSchema } = await import(
      "@/features/academic-structure/schemas/course"
    );

    const validData = {
      code: "TEST101",
      title: "Test Course",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
      program_id: validUuid,
      major_id: null,
      default_semester: AcademicSemester.FIRST,
      default_term: AcademicTerm.FIRST_TERM,
    };

    const result = createCourseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts all temporal fields as optional (undefined)", async () => {
    const { createCourseSchema } = await import(
      "@/features/academic-structure/schemas/course"
    );

    const validData = {
      code: "TEST101",
      title: "Test Course",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
      program_id: validUuid,
      major_id: null,
      // No temporal fields - should be valid
    };

    const result = createCourseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
