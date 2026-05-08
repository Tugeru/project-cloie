import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WizardShell } from "@/features/responses/components/wizard-shell";
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
        {
          kind: "quantitative" as const,
          itemKey: "q1",
          prompt: "Question 1",
          scale: [1, 2, 3, 4, 5],
        },
      ],
    },
    {
      id: "section-2",
      name: "Section 2 Name",
      description: "Second part",
      items: [
        {
          kind: "quantitative" as const,
          itemKey: "q2",
          prompt: "Question 2",
          scale: [1, 2, 3, 4, 5],
        },
      ],
    },
  ];

  test("renders the wizard shell with sections", () => {
    render(<WizardShell assignmentId="test" title="Test Eval" sections={mockSections} />);

    expect(screen.getByText("Test Eval")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Section 1 Name" })).toBeDefined();
    expect(screen.getByText("Question 1")).toBeDefined();
  });

  test("shows progress indicator", () => {
    render(<WizardShell assignmentId="test" title="Test Eval" sections={mockSections} />);

    expect(screen.getByText(/Section 1 of 2/i)).toBeDefined();
  });

  test("does not render a save draft button in the evaluation footer", () => {
    render(<WizardShell assignmentId="test" title="Test Eval" sections={mockSections} />);

    expect(screen.queryByRole("button", { name: /save draft/i })).not.toBeInTheDocument();
  });

  test("saves forward navigation answers using workflow answer keys", async () => {
    const onSaveDraft = vi
      .fn()
      .mockResolvedValue({ savedAt: "2026-04-20T10:00:00.000Z", success: true });

    render(
      <WizardShell
        assignmentId="assignment-1"
        title="Test Eval"
        sections={mockSections}
        onSaveDraft={onSaveDraft}
      />
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
    const onSaveDraft = vi
      .fn()
      .mockResolvedValue({ savedAt: "2026-04-20T10:00:00.000Z", success: true });
    const sections = [
      mockSections[0],
      {
        id: "section-2",
        name: "Section 2 Name",
        description: "Second part",
        items: [{ kind: "qualitative" as const, promptKey: "remarks", prompt: "Remarks" }],
      },
    ];

    render(
      <WizardShell
        assignmentId="assignment-1"
        title="Test Eval"
        sections={sections}
        onSaveDraft={onSaveDraft}
      />
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

  test("inserts a suggested response into an empty qualitative answer", () => {
    render(
      <WizardShell
        assignmentId="assignment-1"
        title="Test Eval"
        sections={[
          {
            id: "section-1",
            name: "Qualitative Section",
            description: "Feedback",
            items: [
              {
                kind: "qualitative" as const,
                promptKey: "remarks",
                prompt: "Remarks",
                suggestedResponses: ["It is educational"],
              },
            ],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "It is educational" }));

    expect(screen.getByRole("textbox")).toHaveValue("It is educational");
  });

  test("appends suggested responses to existing qualitative answers with a comma", () => {
    render(
      <WizardShell
        assignmentId="assignment-1"
        title="Test Eval"
        sections={[
          {
            id: "section-1",
            name: "Qualitative Section",
            description: "Feedback",
            items: [
              {
                kind: "qualitative" as const,
                promptKey: "remarks",
                prompt: "Remarks",
                suggestedResponses: ["It is educational"],
              },
            ],
          },
        ]}
        initialAnswers={{
          "section-1:qualitative:remarks": "The course is good",
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "It is educational" }));

    expect(screen.getByRole("textbox")).toHaveValue("The course is good, It is educational");
  });

  test("keeps free typing intact after a suggested response is selected", () => {
    render(
      <WizardShell
        assignmentId="assignment-1"
        title="Test Eval"
        sections={[
          {
            id: "section-1",
            name: "Qualitative Section",
            description: "Feedback",
            items: [
              {
                kind: "qualitative" as const,
                promptKey: "remarks",
                prompt: "Remarks",
                suggestedResponses: ["It is educational"],
              },
            ],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "It is educational" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "It is educational and practical." },
    });

    expect(screen.getByRole("textbox")).toHaveValue("It is educational and practical.");
  });

  test("blocks sidebar navigation to a completed section when current section has unanswered required questions", async () => {
    const threeSections = [
      mockSections[0],
      {
        id: "section-2",
        name: "Section 2 Name",
        description: "Second part",
        items: [
          {
            kind: "quantitative" as const,
            itemKey: "q2",
            prompt: "Question 2",
            scale: [1, 2, 3, 4, 5],
          },
        ],
      },
      {
        id: "section-3",
        name: "Section 3 Name",
        description: "Third part",
        items: [
          {
            kind: "quantitative" as const,
            itemKey: "q3",
            prompt: "Question 3",
            scale: [1, 2, 3, 4, 5],
          },
        ],
      },
    ];

    render(<WizardShell assignmentId="test" title="Test Eval" sections={threeSections} />);

    fireEvent.click(screen.getByRole("radio", { name: /4/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next Section/i }));

    await screen.findByText("Question 2");

    const section1Button = screen.getByRole("button", { name: /Section 1 Name/i });
    fireEvent.click(section1Button);

    expect(screen.getByText("Question 2")).toBeDefined();
    expect(screen.getByText(/Please answer all questions/i)).toBeDefined();
  });

  test("allows sidebar navigation to a completed section when current section is answered", async () => {
    render(<WizardShell assignmentId="test" title="Test Eval" sections={mockSections} />);

    fireEvent.click(screen.getByRole("radio", { name: /4/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next Section/i }));

    await screen.findByText("Question 2");

    fireEvent.click(screen.getByRole("radio", { name: /3/i }));

    const section1Button = screen.getByRole("button", { name: /Section 1 Name/i });
    fireEvent.click(section1Button);

    await screen.findByText("Question 1");
    expect(screen.queryByText(/Please answer all questions/i)).toBeNull();
  });

  test("deduplicates repeated suggested responses and avoids duplicate-key warnings", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <WizardShell
        assignmentId="assignment-1"
        title="Test Eval"
        sections={[
          {
            id: "section-1",
            name: "Qualitative Section",
            description: "Feedback",
            items: [
              {
                kind: "qualitative" as const,
                promptKey: "remarks",
                prompt: "Remarks",
                suggestedResponses: [
                  "test response 1",
                  "test response 2",
                  "test response 2",
                  "test response 2 ",
                ],
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getAllByRole("button", { name: "test response 2" })).toHaveLength(1);
    expect(
      consoleErrorSpy.mock.calls.some(([message]) =>
        String(message).includes("Encountered two children with the same key")
      )
    ).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
