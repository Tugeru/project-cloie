import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TemplateBuilder } from "@/features/instruments/components/template-builder";

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

describe("TemplateBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders without facultyConfig on admin-style pages", () => {
    render(
      <TemplateBuilder
        programLabel="Institutional Baseline"
        onSave={vi.fn().mockResolvedValue({ success: true })}
      />
    );

    expect(screen.getByText("Template Settings")).toBeInTheDocument();
    expect(screen.queryByText("CILO Binding")).not.toBeInTheDocument();
  });

  test("blocks adding duplicate predefined responses within the same question", () => {
    render(
      <TemplateBuilder
        programLabel="BSIT"
        onSave={vi.fn().mockResolvedValue({ success: true })}
        initialData={{
          id: "template-1",
          name: "Guided Tool",
          description: "",
          template_type: "PROGRAM_WIDE",
          is_active: true,
          is_faculty_accessible: false,
          structure: [
            {
              key: "section-1",
              title: "Feedback",
              description: undefined,
              order: 0,
              questions: [
                {
                  key: "question-1",
                  prompt: "Remarks",
                  type: "guided_open_ended",
                  order: 0,
                  required: true,
                  suggestedResponses: ["Alpha"],
                },
              ],
            },
          ],
        }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Add a predefined response/i), {
      target: { value: " Alpha " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(
      screen.getByText("Predefined responses must be unique within a question.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("Alpha")).toHaveLength(1);
  });

  test("loads faculty course cilos and includes bindings in save payload", async () => {
    const onSave = vi.fn().mockResolvedValue({ success: true, data: { id: "template-1" } });

    render(
      <TemplateBuilder
        programLabel="BSIT"
        onSave={onSave}
        toolsHref="/faculty/tools"
        initialData={{
          id: "template-1",
          name: "CILO Tool",
          description: "",
          template_type: "COURSE_BOUND",
          is_active: true,
          is_faculty_accessible: true,
          bound_course_id: "course-1",
          bound_major_id: null,
          bound_program_id: "program-1",
          structure: [
            {
              key: "section-1",
              title: "Outcomes",
              description: undefined,
              order: 0,
              questions: [
                {
                  key: "question-1",
                  prompt: "Evaluate CILO 1",
                  type: "likert",
                  order: 0,
                  required: true,
                  likertDescriptors: [
                    { label: "Poor", value: 1 },
                    { label: "Fair", value: 2 },
                    { label: "Good", value: 3 },
                    { label: "Very Good", value: 4 },
                    { label: "Excellent", value: 5 },
                  ],
                },
              ],
            },
          ],
        }}
        facultyConfig={{
          courseContexts: [
            {
              courseCode: "IT401",
              courseId: "course-1",
              courseTitle: "Capstone 1",
              courseType: "PROGRAM_SPECIFIC",
              majorId: null,
              majorName: null,
              programCode: "BSIT",
              programId: "program-1",
              programName: "Information Technology",
              scopeLabel: "BSIT - Shared Program Course",
            },
          ],
          initialBindings: [
            {
              ciloId: "cilo-1",
              itemKey: "question-1",
              sectionKey: "section-1",
            },
          ],
          loadManagedCilosAction: vi.fn().mockResolvedValue({
            hasSavedCilos: true,
            items: [{ description: "Apply project planning principles", id: "cilo-1" }],
            success: true,
          }),
          validatePublishReadinessAction: vi.fn().mockResolvedValue({
            success: true,
            data: { id: "template-1" },
          }),
        }}
        saveSuccessConfig={{
          redirectTo: "/faculty/tools",
          toastMessage: "Template saved successfully.",
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/saved cilo\(s\) available for binding/i)).toBeInTheDocument();
    });
    expect(screen.getByText("CILO Binding")).toBeInTheDocument();
    expect(
      screen.getByText("IT401 - Capstone 1 (BSIT - Shared Program Course)")
    ).toBeInTheDocument();
    expect(screen.getByText("CILO 1: Apply project planning principles")).toBeInTheDocument();
    expect(screen.queryByText("program-1")).not.toBeInTheDocument();
    expect(screen.queryByText("course-1")).not.toBeInTheDocument();
    expect(screen.queryByText("cilo-1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save template/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    const formData = onSave.mock.calls[0][0] as FormData;
    expect(formData.get("bound_course_id")).toBe("course-1");
    expect(formData.get("bound_program_id")).toBe("program-1");
    expect(formData.get("cilo_question_bindings")).toBe(
      JSON.stringify([
        {
          ciloId: "cilo-1",
          itemKey: "question-1",
          sectionKey: "section-1",
        },
      ])
    );
    expect(pushMock).toHaveBeenCalledWith("/faculty/tools");
  });

  test("redirects program head saves back to tools with a success toast", async () => {
    const onSave = vi.fn().mockResolvedValue({ success: true, data: { id: "template-1" } });

    render(
      <TemplateBuilder
        programLabel="BSBA"
        onSave={onSave}
        saveSuccessConfig={{
          redirectTo: "/program-head/tools",
          toastMessage: "Template saved successfully.",
        }}
        initialData={{
          id: "template-1",
          name: "BSBA Tool",
          description: "",
          template_type: "COURSE_BOUND",
          is_active: true,
          is_faculty_accessible: true,
          structure: [
            {
              key: "section-1",
              title: "Outcomes",
              description: undefined,
              order: 0,
              questions: [
                {
                  key: "question-1",
                  prompt: "Evaluate outcome",
                  type: "likert",
                  order: 0,
                  required: true,
                  likertDescriptors: [
                    { label: "Poor", value: 1 },
                    { label: "Fair", value: 2 },
                    { label: "Good", value: 3 },
                    { label: "Very Good", value: 4 },
                    { label: "Excellent", value: 5 },
                  ],
                },
              ],
            },
          ],
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /save template/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/program-head/tools");
    });
    expect(screen.queryByText("Template saved successfully.")).not.toBeInTheDocument();
  });

  test("does not redirect program head saves on failure and shows the error", async () => {
    const onSave = vi.fn().mockResolvedValue({
      success: false,
      error: "Section title is required.",
    });

    render(
      <TemplateBuilder
        programLabel="BSBA"
        onSave={onSave}
        saveSuccessConfig={{
          redirectTo: "/program-head/tools",
          toastMessage: "Template saved successfully.",
        }}
        initialData={{
          id: "template-1",
          name: "Broken Tool",
          description: "",
          template_type: "COURSE_BOUND",
          is_active: true,
          is_faculty_accessible: true,
          structure: [
            {
              key: "section-1",
              title: "",
              description: undefined,
              order: 0,
              questions: [
                {
                  key: "question-1",
                  prompt: "Evaluate outcome",
                  type: "likert",
                  order: 0,
                  required: true,
                  likertDescriptors: [
                    { label: "Poor", value: 1 },
                    { label: "Fair", value: 2 },
                    { label: "Good", value: 3 },
                    { label: "Very Good", value: 4 },
                    { label: "Excellent", value: 5 },
                  ],
                },
              ],
            },
          ],
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /save template/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText("Section title is required.")).toBeInTheDocument();
    expect(dispatchEventSpy).toHaveBeenCalled();
  });

  test("forces faculty-edited templates to remain course-bound on save", async () => {
    const onSave = vi.fn().mockResolvedValue({ success: true, data: { id: "template-1" } });

    render(
      <TemplateBuilder
        programLabel="BSIT"
        onSave={onSave}
        toolsHref="/faculty/tools"
        initialData={{
          id: "template-1",
          name: "Faculty Tool",
          description: "",
          template_type: "PROGRAM_WIDE",
          is_active: true,
          is_faculty_accessible: true,
          structure: [
            {
              key: "section-1",
              title: "Outcomes",
              description: undefined,
              order: 0,
              questions: [
                {
                  key: "question-1",
                  prompt: "Evaluate CILO 1",
                  type: "likert",
                  order: 0,
                  required: true,
                  likertDescriptors: [
                    { label: "Poor", value: 1 },
                    { label: "Fair", value: 2 },
                    { label: "Good", value: 3 },
                    { label: "Very Good", value: 4 },
                    { label: "Excellent", value: 5 },
                  ],
                },
              ],
            },
          ],
        }}
        facultyConfig={{
          courseContexts: [],
          initialBindings: [],
          loadManagedCilosAction: vi.fn().mockResolvedValue({
            hasSavedCilos: false,
            items: [],
            success: true,
          }),
          validatePublishReadinessAction: vi.fn().mockResolvedValue({
            success: true,
            data: { id: "template-1" },
          }),
        }}
      />
    );

    expect(screen.getByDisplayValue("COURSE_BOUND")).toBeDisabled();
    expect(screen.queryByText("Program-wide Evaluation Tool")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save template/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    const formData = onSave.mock.calls[0][0] as FormData;
    expect(formData.get("template_type")).toBe("COURSE_BOUND");
  });
});
