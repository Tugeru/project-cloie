import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ManagementTemplateBuilder } from "@/features/instruments/components/management-template-builder";

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("ManagementTemplateBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders template builder for Secretary with admin/instruments redirect", () => {
    render(
      <ManagementTemplateBuilder
        programLabel="Institutional Baseline"
        onSave={vi.fn().mockResolvedValue({ success: true })}
      />
    );

    expect(screen.getByText("Template Settings")).toBeInTheDocument();
    expect(screen.queryByText("CILO Binding")).not.toBeInTheDocument();
  });

  test("shows success modal and redirects to admin/instruments on save", async () => {
    const { fireEvent } = await import("@testing-library/react");
    
    render(
      <ManagementTemplateBuilder
        programLabel="Institutional Baseline"
        onSave={vi.fn().mockResolvedValue({ success: true })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /save template/i }));

    await vi.waitFor(() => {
      expect(screen.getByText("Template Saved Successfully")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Go to Tools" }));

    expect(pushMock).toHaveBeenCalledWith("/secretary/instruments");
  });
});
