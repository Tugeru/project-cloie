import { render, screen } from "@testing-library/react";
import { HeroCard } from "@/features/users/components/hero-card";
import { expect, test, describe } from "vitest";

describe("HeroCard", () => {
  test("renders student information correctly", () => {
    render(
      <HeroCard 
        name="Andy" 
        program="BSIT" 
        year="4th Year" 
        section="Section A" 
      />
    );

    expect(screen.getByText(/Good morning, Andy!/i)).toBeDefined();
    expect(screen.getByText(/BSIT • 4th Year • Section A/i)).toBeDefined();
  });

  test("contains a link to my evaluations", () => {
    render(
      <HeroCard 
        name="Andy" 
        program="BSIT" 
        year="4th Year" 
        section="Section A" 
      />
    );

    const link = screen.getByRole("button", { name: /My Evaluations/i });
    expect(link.getAttribute("href")).toBe("/student/evaluations");
  });
});
