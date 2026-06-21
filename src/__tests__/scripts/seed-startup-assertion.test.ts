import { describe, expect, it } from "vitest";

/**
 * Regression test for the seed startup assertion in seedEvaluations.
 *
 * The assertion at prisma/seed.ts (around line 2364) guards against missing
 * course assignment mappings before attempting to create course-bound evaluations.
 * This test verifies that the assertion logic throws with a descriptive error
 * when a courseCode in newCbDefs is missing from the assignmentMap.
 *
 * We extract and unit-test the assertion logic directly — no Prisma needed.
 */

/**
 * Mirrors the assertion logic from prisma/seed.ts seedEvaluations:
 *   const cbAssignmentId = assignmentMap.get(def.courseCode);
 *   if (!cbAssignmentId) {
 *     throw new Error(`Missing course assignment for ${def.courseCode}`);
 *   }
 */
function assertCourseAssignmentPresent(
  assignmentMap: Map<string, string>,
  courseCode: string
): string {
  const cbAssignmentId = assignmentMap.get(courseCode);
  if (!cbAssignmentId) {
    throw new Error(`Missing course assignment for ${courseCode}`);
  }
  return cbAssignmentId;
}

describe("seed startup assertion — seedEvaluations assignment map guard", () => {
  it("throws with a descriptive error when courseCode is missing from assignmentMap", () => {
    const assignmentMap = new Map<string, string>([
      ["FIN101", "assignment-fin-001"],
      ["EDUC301", "assignment-educ-001"],
    ]);

    expect(() => assertCourseAssignmentPresent(assignmentMap, "IT201")).toThrowError(
      "Missing course assignment for IT201"
    );
  });

  it("throws for any missing courseCode (not just IT201)", () => {
    const emptyMap = new Map<string, string>();

    expect(() => assertCourseAssignmentPresent(emptyMap, "MKT301")).toThrowError(
      "Missing course assignment for MKT301"
    );
  });

  it("returns the assignment id when the courseCode is present", () => {
    const assignmentMap = new Map<string, string>([["IT201", "assignment-it-001"]]);

    const result = assertCourseAssignmentPresent(assignmentMap, "IT201");

    expect(result).toBe("assignment-it-001");
  });

  it("throws when assignmentMap is empty regardless of courseCode", () => {
    const emptyMap = new Map<string, string>();

    expect(() => assertCourseAssignmentPresent(emptyMap, "SW301")).toThrowError(
      "Missing course assignment for SW301"
    );
  });
});
