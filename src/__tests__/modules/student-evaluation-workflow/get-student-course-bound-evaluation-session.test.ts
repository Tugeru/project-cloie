import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getStudentCourseBoundEvaluationSession,
  mapSavedAnswerItems,
  mapStructureSnapshotToSections,
} from "@/features/responses/services/get-student-course-bound-evaluation-session";

const { findFirstMock, resolveAuthSessionMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    evaluationAssignment: {
      findFirst: findFirstMock,
    },
  },
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

describe("mapStructureSnapshotToSections", () => {
  it("maps snapshot sections into workflow sections without depending on item payloads", () => {
    expect(
      mapStructureSnapshotToSections([
        {
          key: "section-a",
          title: "Section A",
        },
        {
          ignored: true,
          key: "section-b",
          title: "Section B",
        },
        {
          key: "missing-title",
        },
      ]),
    ).toEqual([
      { id: "section-a", name: "Section A", description: "", items: [] },
      { id: "section-b", name: "Section B", description: "", items: [] },
    ]);
  });

  it("maps legacy quantitative and qualitative arrays into workflow items", () => {
    expect(
      mapStructureSnapshotToSections([
        {
          key: "section-a",
          qualitative_prompts: [{ key: "remarks", prompt: "Remarks" }],
          quantitative_items: [{ key: "q1", prompt: "Question 1" }],
          title: "Section A",
        },
      ]),
    ).toEqual([
      {
        description: "",
        id: "section-a",
        items: [
          { kind: "quantitative", itemKey: "q1", prompt: "Question 1", scale: [] },
          { kind: "qualitative", prompt: "Remarks", promptKey: "remarks" },
        ],
        name: "Section A",
      },
    ]);
  });
});

describe("mapSavedAnswerItems", () => {
  it("flattens quantitative and qualitative response items into explicit answer keys", () => {
    expect(
      mapSavedAnswerItems({
        qualitativeItems: [
          {
            prompt_key: "remarks",
            section_key: "section-b",
            text_content: "More hands-on activities would help.",
          },
        ],
        quantitativeItems: [
          {
            item_key: "q1",
            rating_value: 4,
            section_key: "section-a",
          },
          {
            item_key: "q2",
            rating_value: 5,
            section_key: "section-a",
          },
        ],
      }),
    ).toEqual({
      "section-b:qualitative:remarks": "More hands-on activities would help.",
      "section-a:quantitative:q1": 4,
      "section-a:quantitative:q2": 5,
    });
  });
});

describe("getStudentCourseBoundEvaluationSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("returns null when the course-bound evaluation is not currently available", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-1" });
    findFirstMock.mockResolvedValue({
      course_bound_id: "course-bound-1",
      id: "assignment-1",
      course_bound: {
        activation_at: new Date("2026-05-15T00:00:00.000Z"),
        course: { title: "Capstone 1" },
        deadline_at: new Date("2026-05-20T00:00:00.000Z"),
        instrument: {
          structure_snapshot: [
            {
              items: [
                { key: "q1", kind: "quantitative", prompt: "Question 1", scale: [1, 2, 3, 4, 5] },
              ],
              key: "section-a",
              title: "Section A",
            },
          ],
          template: { name: "Post-Term CILO Evaluation Tool" },
        },
        program: { name: "BSIT" },
        status: "SCHEDULED",
      },
      response: null,
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T00:00:00.000Z"));

    await expect(getStudentCourseBoundEvaluationSession("assignment-1")).resolves.toBeNull();

    vi.useRealTimers();
  });

  it("loads a course-bound session with saved answers", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-1" });
    findFirstMock.mockResolvedValue({
      course_bound_id: "course-bound-1",
      id: "assignment-1",
      course_bound: {
        activation_at: new Date("2026-04-01T00:00:00.000Z"),
        course: { title: "Capstone 1" },
        deadline_at: new Date("2026-05-20T00:00:00.000Z"),
        instrument: {
          structure_snapshot: [
            {
              description: "Rate the items.",
              items: [
                { key: "q1", kind: "quantitative", prompt: "Question 1", scale: [1, 2, 3, 4, 5] },
              ],
              key: "section-a",
              title: "Section A",
            },
          ],
          template: { name: "Post-Term CILO Evaluation Tool" },
        },
        program: { name: "BSIT" },
        status: "ACTIVE",
      },
      response: {
        id: "response-1",
        qual_items: [],
        quant_items: [
          { item_key: "q1", rating_value: 4, section_key: "section-a" },
        ],
        status: "IN_PROGRESS",
        submitted_at: null,
      },
    });

    await expect(getStudentCourseBoundEvaluationSession("assignment-1")).resolves.toEqual(
      expect.objectContaining({
        assignmentId: "assignment-1",
        courseTitle: "Capstone 1",
        evaluationTitle: "Post-Term CILO Evaluation Tool",
        savedAnswers: {
          "section-a:quantitative:q1": 4,
        },
      }),
    );
  });

  it("loads scheduled evaluations once their activation time has passed", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-1" });
    findFirstMock.mockResolvedValue({
      course_bound_id: "course-bound-1",
      id: "assignment-1",
      course_bound: {
        activation_at: new Date("2026-05-15T00:00:00.000Z"),
        course: { title: "Capstone 1" },
        deadline_at: new Date("2026-05-20T00:00:00.000Z"),
        instrument: {
          structure_snapshot: [
            {
              items: [
                { key: "q1", kind: "quantitative", prompt: "Question 1", scale: [1, 2, 3, 4, 5] },
              ],
              key: "section-a",
              title: "Section A",
            },
          ],
          template: { name: "Post-Term CILO Evaluation Tool" },
        },
        program: { name: "BSIT" },
        status: "SCHEDULED",
      },
      response: null,
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-16T00:00:00.000Z"));

    await expect(getStudentCourseBoundEvaluationSession("assignment-1")).resolves.toEqual(
      expect.objectContaining({
        assignmentId: "assignment-1",
        courseTitle: "Capstone 1",
        evaluationTitle: "Post-Term CILO Evaluation Tool",
      }),
    );

    vi.useRealTimers();
  });
});
