import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { YearLevel, StudentSection } from "@prisma/client";
import { useState, useEffect } from "react";

import { ClassIdentityFields } from "@/features/course-assignments/components/shared/class-identity-fields";

describe("ClassIdentityFields - Hint chip", () => {
  const mockPrograms = [
    { id: "prog-1", code: "BSCS", name: "BS Computer Science" },
  ];

  const defaultProps = {
    programId: "prog-1",
    yearLevel: YearLevel.FIRST_YEAR,
    section: StudentSection.MORNING,
    availablePrograms: mockPrograms,
    onProgramChange: vi.fn(),
    onYearLevelChange: vi.fn(),
    onSectionChange: vi.fn(),
  };

  it("shows hint chip when yearLevel matches suggestedYearLevel", () => {
    render(
      <ClassIdentityFields
        {...defaultProps}
        yearLevel={YearLevel.FIRST_YEAR}
        suggestedYearLevel={YearLevel.FIRST_YEAR}
      />
    );

    expect(screen.getByText(/course default: 1st year/i)).toBeInTheDocument();
  });

  it("shows warning hint chip when yearLevel differs from suggestedYearLevel", () => {
    render(
      <ClassIdentityFields
        {...defaultProps}
        yearLevel={YearLevel.SECOND_YEAR}
        suggestedYearLevel={YearLevel.FIRST_YEAR}
      />
    );

    expect(screen.getByText(/course default: 1st year/i)).toBeInTheDocument();
    expect(screen.getByText(/selected: 2nd year/i)).toBeInTheDocument();
  });

  it("does not show hint chip when no suggestedYearLevel", () => {
    render(
      <ClassIdentityFields
        {...defaultProps}
        yearLevel={YearLevel.FIRST_YEAR}
        suggestedYearLevel={null}
      />
    );

    expect(screen.queryByText(/course default:/i)).not.toBeInTheDocument();
  });
});

describe("CourseAssignment pre-fill logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-fills yearLevel when courseId changes and user hasn't touched it", () => {
    const mockCourses = [
      { id: "course-1", code: "CS101", title: "Intro", default_year_level: YearLevel.FIRST_YEAR },
      { id: "course-2", code: "CS201", title: "Data", default_year_level: YearLevel.SECOND_YEAR },
    ];

    const { result } = renderHook(() => {
      const [courseId, setCourseId] = useState<string | null>(null);
      const [yearLevel, setYearLevel] = useState<YearLevel>(YearLevel.FIRST_YEAR);
      const [hasTouchedYearLevel, setHasTouchedYearLevel] = useState(false);

      // Simulate the pre-fill logic from CourseAssignmentFormDialog
      useEffect(() => {
        if (courseId && !hasTouchedYearLevel) {
          const course = mockCourses.find((c) => c.id === courseId);
          if (course?.default_year_level) {
            setYearLevel(course.default_year_level);
          }
        }
      }, [courseId, hasTouchedYearLevel]);

      return { courseId, yearLevel, setCourseId, setYearLevel, setHasTouchedYearLevel };
    });

    // Initial state
    expect(result.current.yearLevel).toBe(YearLevel.FIRST_YEAR);

    // Select course with default_year_level = FIRST_YEAR
    act(() => {
      result.current.setCourseId("course-1");
    });

    expect(result.current.yearLevel).toBe(YearLevel.FIRST_YEAR);

    // Select course with default_year_level = SECOND_YEAR
    act(() => {
      result.current.setCourseId("course-2");
    });

    expect(result.current.yearLevel).toBe(YearLevel.SECOND_YEAR);
  });

  it("does not pre-fill when user has manually changed yearLevel", () => {
    const mockCourses = [
      { id: "course-1", code: "CS101", title: "Intro", default_year_level: YearLevel.FIRST_YEAR },
    ];

    const { result } = renderHook(() => {
      const [courseId, setCourseId] = useState<string | null>(null);
      const [yearLevel, setYearLevel] = useState<YearLevel>(YearLevel.FIRST_YEAR);
      const [hasTouchedYearLevel, setHasTouchedYearLevel] = useState(false);

      useEffect(() => {
        if (courseId && !hasTouchedYearLevel) {
          const course = mockCourses.find((c) => c.id === courseId);
          if (course?.default_year_level) {
            setYearLevel(course.default_year_level);
          }
        }
      }, [courseId, hasTouchedYearLevel]);

      return { courseId, yearLevel, setCourseId, setYearLevel, setHasTouchedYearLevel };
    });

    // User manually changes year level
    act(() => {
      result.current.setHasTouchedYearLevel(true);
      result.current.setYearLevel(YearLevel.THIRD_YEAR);
    });

    expect(result.current.yearLevel).toBe(YearLevel.THIRD_YEAR);

    // Now select course - should NOT override
    act(() => {
      result.current.setCourseId("course-1");
    });

    // Should remain THIRD_YEAR (user's choice)
    expect(result.current.yearLevel).toBe(YearLevel.THIRD_YEAR);
  });

  it("does not change yearLevel when course has no default_year_level", () => {
    const mockCourses = [
      { id: "course-1", code: "CS301", title: "Advanced", default_year_level: null },
    ];

    const { result } = renderHook(() => {
      const [courseId, setCourseId] = useState<string | null>(null);
      const [yearLevel, setYearLevel] = useState<YearLevel>(YearLevel.FIRST_YEAR);
      const [hasTouchedYearLevel] = useState(false);

      useEffect(() => {
        if (courseId && !hasTouchedYearLevel) {
          const course = mockCourses.find((c) => c.id === courseId);
          if (course?.default_year_level) {
            setYearLevel(course.default_year_level);
          }
        }
      }, [courseId, hasTouchedYearLevel]);

      return { courseId, yearLevel, setCourseId };
    });

    act(() => {
      result.current.setCourseId("course-1");
    });

    // Should remain at initial default
    expect(result.current.yearLevel).toBe(YearLevel.FIRST_YEAR);
  });

  it("resets hasTouchedYearLevel on resetForm equivalent", () => {
    const mockCourses = [
      { id: "course-1", code: "CS101", title: "Intro", default_year_level: YearLevel.SECOND_YEAR },
    ];

    const { result } = renderHook(() => {
      const [courseId, setCourseId] = useState<string | null>(null);
      const [yearLevel, setYearLevel] = useState<YearLevel>(YearLevel.FIRST_YEAR);
      const [hasTouchedYearLevel, setHasTouchedYearLevel] = useState(false);

      useEffect(() => {
        if (courseId && !hasTouchedYearLevel) {
          const course = mockCourses.find((c) => c.id === courseId);
          if (course?.default_year_level) {
            setYearLevel(course.default_year_level);
          }
        }
      }, [courseId, hasTouchedYearLevel]);

      const resetForm = () => {
        setCourseId(null);
        setYearLevel(YearLevel.FIRST_YEAR);
        setHasTouchedYearLevel(false);
      };

      return { courseId, yearLevel, setCourseId, setYearLevel, setHasTouchedYearLevel, resetForm };
    });

    // Touch and change it
    act(() => {
      result.current.setHasTouchedYearLevel(true);
      result.current.setYearLevel(YearLevel.THIRD_YEAR);
    });

    // Reset
    act(() => {
      result.current.resetForm();
    });

    // Now select course - should pre-fill because hasTouchedYearLevel is reset to false
    act(() => {
      result.current.setCourseId("course-1");
    });

    expect(result.current.yearLevel).toBe(YearLevel.SECOND_YEAR);
  });
});
