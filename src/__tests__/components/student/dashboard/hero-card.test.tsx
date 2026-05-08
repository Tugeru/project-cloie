import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { HeroCard } from "@/features/portals/components/hero-card";

describe("HeroCard", () => {
  test("renders student information correctly", () => {
    render(<HeroCard name="Andy" contextLabel="BSIT • 4th Year • 2026-2027" />);

    expect(screen.getByText(/Welcome, Andy/i)).toBeDefined();
    expect(screen.getByText(/BSIT • 4th Year • 2026-2027/i)).toBeDefined();
  });

  test("contains a link to my evaluations", () => {
    render(<HeroCard name="Andy" contextLabel="BSIT • 4th Year • 2026-2027" />);

    const link = screen.getByRole("button", { name: /My Evaluations/i });
    expect(link.getAttribute("href")).toBe("/student/evaluations");
  });
});
