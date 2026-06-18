import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ManagementCoursesList } from "@/features/academic-structure/components/management-courses-list";
import type {
  ManagementCourseSummaryItem,
  ManagementCoursesKPI,
  ProgramFilterOption,
} from "@/features/academic-structure/services/list-management-courses-summary";

const mockCourses: ManagementCourseSummaryItem[] = [
  {
    id: "course-1",
    code: "GE101",
    title: "Introduction to General Education",
    description: "A foundational course",
    courseScope: "GENERAL_EDUCATION",
    courseScopeLabel: "General Education",
    isActive: true,
    programId: null,
    programCode: null,
    programName: null,
    majorId: null,
    majorName: null,
    ciloCount: 3,
    evaluationCount: 2,
  },
  {
    id: "course-2",
    code: "IT101",
    title: "Introduction to Programming",
    description: "Basic programming concepts",
    courseScope: "PROGRAM_SPECIFIC",
    courseScopeLabel: "Program-Specific",
    isActive: true,
    programId: "prog-1",
    programCode: "BSIT",
    programName: "Bachelor of Science in Information Technology",
    majorId: null,
    majorName: null,
    ciloCount: 5,
    evaluationCount: 3,
  },
];

const mockKPI: ManagementCoursesKPI = {
  totalCourses: 2,
  activeCourses: 2,
  generalEducationCourses: 1,
  programSpecificCourses: 1,
};

const mockPrograms: ProgramFilterOption[] = [
  {
    id: "prog-1",
    code: "BSIT",
    name: "Bachelor of Science in Information Technology",
    majors: [],
  },
];

describe("ManagementCoursesList", () => {
  test("renders courses list for Secretary dashboard with correct basePath", () => {
    render(
      <ManagementCoursesList
        courses={mockCourses}
        kpi={mockKPI}
        programs={mockPrograms}
        basePath="/secretary/courses"
      />
    );

    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.getByText("GE101")).toBeInTheDocument();
    expect(screen.getByText("Introduction to General Education")).toBeInTheDocument();
    expect(screen.getByText("IT101")).toBeInTheDocument();
    expect(screen.getByText("Introduction to Programming")).toBeInTheDocument();
    expect(screen.getByText("Create Course")).toHaveAttribute("href", "/secretary/courses/new");
  });

  test("renders courses list for Dean dashboard with correct basePath", () => {
    render(
      <ManagementCoursesList
        courses={mockCourses}
        kpi={mockKPI}
        programs={mockPrograms}
        basePath="/dean/courses"
      />
    );

    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.getByText("GE101")).toBeInTheDocument();
    expect(screen.getByText("IT101")).toBeInTheDocument();
    expect(screen.getByText("Create Course")).toHaveAttribute("href", "/dean/courses/new");
  });

  test("displays KPI cards with correct values", () => {
    render(
      <ManagementCoursesList
        courses={mockCourses}
        kpi={mockKPI}
        programs={mockPrograms}
        basePath="/secretary/courses"
      />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Total Courses")).toBeInTheDocument();
    expect(screen.getByText("Active Courses")).toBeInTheDocument();
    expect(screen.getByText("General Education")).toBeInTheDocument();
    expect(screen.getByText("Program-Specific")).toBeInTheDocument();
  });

  test("displays scope badges correctly", () => {
    render(
      <ManagementCoursesList
        courses={mockCourses}
        kpi={mockKPI}
        programs={mockPrograms}
        basePath="/secretary/courses"
      />
    );

    expect(screen.getByText("General Education")).toBeInTheDocument();
    expect(screen.getByText("Program-Specific")).toBeInTheDocument();
  });

  test("shows program and major information when available", () => {
    render(
      <ManagementCoursesList
        courses={mockCourses}
        kpi={mockKPI}
        programs={mockPrograms}
        basePath="/secretary/courses"
      />
    );

    expect(screen.getByText("BSIT")).toBeInTheDocument();
  });

  test("displays CILO and evaluation counts", () => {
    render(
      <ManagementCoursesList
        courses={mockCourses}
        kpi={mockKPI}
        programs={mockPrograms}
        basePath="/secretary/courses"
      />
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("shows Edit link with correct basePath for Secretary", () => {
    const { container } = render(
      <ManagementCoursesList
        courses={mockCourses}
        kpi={mockKPI}
        programs={mockPrograms}
        basePath="/secretary/courses"
      />
    );

    const editLinks = container.querySelectorAll('a[href="/secretary/courses/course-1/edit"]');
    expect(editLinks).toHaveLength(1);
  });

  test("shows Edit link with correct basePath for Dean", () => {
    const { container } = render(
      <ManagementCoursesList
        courses={mockCourses}
        kpi={mockKPI}
        programs={mockPrograms}
        basePath="/dean/courses"
      />
    );

    const editLinks = container.querySelectorAll('a[href="/dean/courses/course-1/edit"]');
    expect(editLinks).toHaveLength(1);
  });
});
