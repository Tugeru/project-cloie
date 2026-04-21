import { describe, expect, it } from "vitest";

import { assertSafeDemoUserReuse } from "../../../scripts/bootstrap-outline-defense-demo";

describe("bootstrap outline defense demo", () => {
  it("rejects reusing an existing account that does not match the demo marker", () => {
    expect(() =>
      assertSafeDemoUserReuse(
        {
          email: "faculty@acd.edu.ph",
          first_name: "Alice",
          last_name: "Santos",
        },
        {
          email: "faculty@acd.edu.ph",
          firstName: "Outline Demo",
          lastName: "Faculty",
        },
      ),
    ).toThrowError(
      "Refusing to reuse existing user faculty@acd.edu.ph because it does not match the outline defense demo marker.",
    );
  });

  it("allows reruns when the existing account already matches the demo marker", () => {
    expect(() =>
      assertSafeDemoUserReuse(
        {
          email: "faculty@acd.edu.ph",
          first_name: "Outline Demo",
          last_name: "Faculty",
        },
        {
          email: "faculty@acd.edu.ph",
          firstName: "Outline Demo",
          lastName: "Faculty",
        },
      ),
    ).not.toThrow();
  });
});
