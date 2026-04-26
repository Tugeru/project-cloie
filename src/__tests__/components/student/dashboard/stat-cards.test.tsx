import { render, screen } from "@testing-library/react";
import { StatCards } from "@/features/users/components/stat-cards";
import { expect, test, describe } from "vitest";

describe("StatCards", () => {
  test("renders all stat values correctly", () => {
    render(<StatCards pending={3} inProgress={1} completed={12} />);

    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("12")).toBeDefined();

    expect(screen.getByText(/Pending/i)).toBeDefined();
    expect(screen.getByText(/In Progress/i)).toBeDefined();
    expect(screen.getByText(/Completed/i)).toBeDefined();
  });
});
