import { render, screen, fireEvent } from "@testing-library/react";
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
      name: "Section 1 Name",
      description: "First part",
      questions: [{ id: 1, text: "Question 1" }]
    },
    {
      name: "Section 2 Name",
      description: "Second part",
      questions: [{ id: 2, text: "Question 2" }]
    }
  ];

  test("shows validation error if no answer is selected", () => {
    render(<WizardShell title="Test Eval" sections={mockSections} />);
    
    const nextButton = screen.getByRole("button", { name: /Next Section/i });
    fireEvent.click(nextButton);

    expect(screen.getByText(/Please answer all questions/i)).toBeDefined();
  });

  test("allows proceeding after answer is selected", () => {
    render(<WizardShell title="Test Eval" sections={mockSections} />);
    
    // Select answer 4 for Question 1
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[3]); // Value 4

    const nextButton = screen.getByRole("button", { name: /Next Section/i });
    fireEvent.click(nextButton);

    expect(screen.queryByText(/Please answer all questions/i)).toBeNull();
    // Check for the section header specifically
    expect(screen.getByRole("heading", { name: /Section 2 Name/i })).toBeDefined();
  });
});
