import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WizardShell } from "@/components/student/evaluations/wizard-shell";
import { expect, test, describe, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
}));

describe("WizardShell", () => {
  const mockSections = [
    {
      id: "section-1",
      name: "Section 1 Name",
      description: "First part",
      items: [
        { kind: "quantitative" as const, itemKey: "q1", prompt: "Question 1", scale: [1, 2, 3, 4, 5] }
      ]
    },
    {
      id: "section-2",
      name: "Section 2 Name",
      description: "Second part",
      items: [
        { kind: "quantitative" as const, itemKey: "q2", prompt: "Question 2", scale: [1, 2, 3, 4, 5] }
      ]
    }
  ];

  test("renders the wizard shell with sections", () => {
    render(<WizardShell assignmentId="test" title="Test Eval" sections={mockSections} />);

    expect(screen.getByText("Test Eval")).toBeDefined();
    expect(screen.getByText("Section 1 Name")).toBeDefined();
    expect(screen.getByText("Question 1")).toBeDefined();
  });

  test("shows progress indicator", () => {
    render(<WizardShell assignmentId="test" title="Test Eval" sections={mockSections} />);

    expect(screen.getByText(/Section 1 of 2/i)).toBeDefined();
  });

  test("saves forward navigation answers using workflow answer keys", async () => {
    const onSaveDraft = vi.fn().mockResolvedValue({ savedAt: "2026-04-20T10:00:00.000Z", success: true });

    render(
      <WizardShell
        assignmentId="assignment-1"
        title="Test Eval"
        sections={mockSections}
        onSaveDraft={onSaveDraft}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /4/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next Section/i }));

    await waitFor(() => {
      expect(onSaveDraft).toHaveBeenCalledWith({
        answers: {
          "section-1:quantitative:q1": 4,
        },
        assignmentId: "assignment-1",
        sectionKey: "section-1",
      });
    });
  });

  test("saves when navigating to the previous section", async () => {
    const onSaveDraft = vi.fn().mockResolvedValue({ savedAt: "2026-04-20T10:00:00.000Z", success: true });
    const sections = [
      mockSections[0],
      {
        id: "section-2",
        name: "Section 2 Name",
        description: "Second part",
        items: [
          { kind: "qualitative" as const, promptKey: "remarks", prompt: "Remarks" },
        ],
      },
    ];

    render(
      <WizardShell
        assignmentId="assignment-1"
        title="Test Eval"
        sections={sections}
        onSaveDraft={onSaveDraft}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /4/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next Section/i }));

    await screen.findByText("Remarks");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Needs more lab time." } });
    fireEvent.click(screen.getByRole("button", { name: /Previous/i }));

    await waitFor(() => {
      expect(onSaveDraft).toHaveBeenLastCalledWith({
        answers: {
          "section-2:qualitative:remarks": "Needs more lab time.",
        },
        assignmentId: "assignment-1",
        sectionKey: "section-2",
      });
    });
  });
});
