import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { AddClassesForFacultyDialog } from "@/features/course-assignments/components/bulk-helpers/add-classes-for-faculty-dialog";
import { bulkCreateCourseAssignmentsAction } from "@/lib/actions/course-assignment-actions";
import type { TermInstanceItem } from "@/features/academic-calendar/types";

vi.mock("@/lib/actions/course-assignment-actions", () => ({
  bulkCreateCourseAssignmentsAction: vi.fn(),
}));

vi.mock("@/features/course-assignments/components/shared/faculty-search-popover", () => ({
  FacultySearchPopover: ({
    onSelect,
    selectedFacultyName,
  }: {
    onSelect: (faculty: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      affiliations: string[];
    }) => void;
    selectedFacultyName: string | null;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          id: "faculty-1",
          firstName: "Test",
          lastName: "Faculty",
          email: "test@example.com",
          affiliations: [],
        })
      }
    >
      {selectedFacultyName ?? "Pick faculty"}
    </button>
  ),
}));

function clickSelectByPlaceholder(placeholder: string) {
  const value = screen.getByText(placeholder);
  const trigger = value.closest('[role="combobox"]');
  if (!trigger) throw new Error(`Select trigger for "${placeholder}" not found`);
  fireEvent.click(trigger);
}

const mockCourses = [
  {
    id: "course-1",
    code: "CS101",
    title: "Intro to Computing",
  },
];

const mockPrograms = [
  { id: "program-1", code: "BSCS", name: "BS Computer Science" },
];

const mockTermInstances = [
  {
    id: "term-1",
    schoolYearId: "sy-1",
    schoolYearCode: "2025-2026",
    semester: "FIRST" as const,
    term: "FIRST_TERM" as const,
    startDate: null,
    endDate: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as unknown as TermInstanceItem[];

describe("AddClassesForFacultyDialog", () => {
  let toastMessages: Array<{ kind: string; message: string }> = [];
  const toastListener = ((event: Event) => {
    const detail = (event as CustomEvent).detail;
    toastMessages.push({ kind: detail.kind, message: detail.message });
  }) as EventListener;

  beforeEach(() => {
    toastMessages = [];
    window.addEventListener("cloie-toast", toastListener);
  });

  afterEach(() => {
    window.removeEventListener("cloie-toast", toastListener);
    vi.restoreAllMocks();
  });

  it("keeps the dialog open and shows per-item errors on total failure", async () => {
    vi.mocked(bulkCreateCourseAssignmentsAction).mockResolvedValue({
      success: false,
      created: 0,
      errors: [{ index: 0, error: "Assignment already exists." }],
    });

    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <AddClassesForFacultyDialog
        open={true}
        onOpenChange={onOpenChange}
        availableCourses={mockCourses}
        availablePrograms={mockPrograms}
        termInstances={mockTermInstances}
        onSuccess={onSuccess}
      />
    );

    // Term step
    clickSelectByPlaceholder("Select a term...");
    fireEvent.click(await screen.findByRole("option", { name: /2025-2026 — 1st Semester — 1st Term/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Course step
    clickSelectByPlaceholder("Select a course...");
    fireEvent.click(await screen.findByRole("option", { name: /cs101 — intro to computing/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Faculty step
    fireEvent.click(screen.getByRole("button", { name: /pick faculty/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Classes step
    fireEvent.click(screen.getByRole("button", { name: /create 1 assignments/i }));

    await waitFor(() => {
      expect(bulkCreateCourseAssignmentsAction).toHaveBeenCalled();
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("alert")).toHaveTextContent("Assignment already exists.");
    expect(toastMessages.some((t) => t.kind === "error")).toBe(true);
  });

  it("calls onSuccess and closes the dialog on full success", async () => {
    vi.mocked(bulkCreateCourseAssignmentsAction).mockResolvedValue({
      success: true,
      created: 1,
      errors: [],
    });

    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <AddClassesForFacultyDialog
        open={true}
        onOpenChange={onOpenChange}
        availableCourses={mockCourses}
        availablePrograms={mockPrograms}
        termInstances={mockTermInstances}
        onSuccess={onSuccess}
      />
    );

    clickSelectByPlaceholder("Select a term...");
    fireEvent.click(await screen.findByRole("option", { name: /2025-2026 — 1st Semester — 1st Term/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    clickSelectByPlaceholder("Select a course...");
    fireEvent.click(await screen.findByRole("option", { name: /cs101 — intro to computing/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    fireEvent.click(screen.getByRole("button", { name: /pick faculty/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /create 1 assignments/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toastMessages.some((t) => t.kind === "success")).toBe(true);
  });
});
