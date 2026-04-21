import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES } from "@/lib/constants/roles";
import {
  buildReviewWordCloudTokens,
  getCourseBoundReviewDetail,
} from "@/modules/analytics-reporting-and-review/services/get-course-bound-review-detail";

const {
  courseBoundEvaluationFindFirstMock,
  resolveAuthSessionMock,
  resolveReviewerProgramScopeMock,
} = vi.hoisted(() => ({
  courseBoundEvaluationFindFirstMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  resolveReviewerProgramScopeMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    courseBoundEvaluation: {
      findFirst: courseBoundEvaluationFindFirstMock,
    },
  },
}));

vi.mock("@/modules/identity-access/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

vi.mock("@/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope", () => ({
  resolveReviewerProgramScope: resolveReviewerProgramScopeMock,
}));

describe("buildReviewWordCloudTokens", () => {
  it("normalizes tokens and removes stopwords", () => {
    expect(
      buildReviewWordCloudTokens([
        "The instructor explained concepts clearly and clearly.",
        "Great activities, excellent feedback!",
      ]),
    ).toEqual([
      { text: "clearly", value: 2 },
      { text: "activities", value: 1 },
      { text: "concepts", value: 1 },
      { text: "excellent", value: 1 },
      { text: "explained", value: 1 },
      { text: "feedback", value: 1 },
      { text: "great", value: 1 },
      { text: "instructor", value: 1 },
    ]);
  });

  it("returns empty tokens for punctuation-only input", () => {
    expect(buildReviewWordCloudTokens(["!!! ... ,,, --- ???"])).toEqual([]);
  });

  it("drops numeric and mixed tokens while keeping valid words", () => {
    expect(buildReviewWordCloudTokens(["2026 capstone2 A+ clarity"])).toEqual([
      { text: "clarity", value: 1 },
    ]);
  });

  it("returns empty tokens for empty and whitespace input", () => {
    expect(buildReviewWordCloudTokens(["", "   ", "\n\t"])).toEqual([]);
  });
});

describe("getCourseBoundReviewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when reviewer scope does not permit program access", async () => {
    resolveAuthSessionMock.mockResolvedValue({ roles: [ROLES.PROGRAM_HEAD], userId: "head-1" });
    resolveReviewerProgramScopeMock.mockResolvedValue(["program-2"]);
    courseBoundEvaluationFindFirstMock.mockResolvedValue(null);

    await expect(getCourseBoundReviewDetail("eval-1")).resolves.toBeNull();

    expect(courseBoundEvaluationFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "eval-1",
          program_id: { in: ["program-2"] },
        }),
      }),
    );
  });

  it("limits faculty detail access to evaluations owned by the reviewer", async () => {
    resolveAuthSessionMock.mockResolvedValue({ roles: [ROLES.FACULTY], userId: "faculty-1" });
    resolveReviewerProgramScopeMock.mockResolvedValue(["program-1"]);
    courseBoundEvaluationFindFirstMock.mockResolvedValue(null);

    await expect(getCourseBoundReviewDetail("eval-1")).resolves.toBeNull();

    expect(courseBoundEvaluationFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          faculty_id: "faculty-1",
          id: "eval-1",
          program_id: { in: ["program-1"] },
        }),
      }),
    );
  });

  it("builds section and question means plus anonymized response cards", async () => {
    resolveAuthSessionMock.mockResolvedValue({ roles: [ROLES.DEAN], userId: "dean-1" });
    resolveReviewerProgramScopeMock.mockResolvedValue(null);
    courseBoundEvaluationFindFirstMock.mockResolvedValue({
      academic_year: "2025-2026",
      assignments: [
        {
          respondent_id: "student-1",
          response: {
            id: "response-1",
            qual_items: [
              { prompt_key: "feedback", section_key: "teaching", text_content: "Very organized lectures" },
            ],
            quant_items: [
              { item_key: "clarity", rating_value: 4, section_key: "teaching" },
              { item_key: "preparedness", rating_value: 2, section_key: "teaching" },
            ],
            submitted_at: new Date("2026-01-04T08:00:00.000Z"),
          },
        },
        {
          respondent_id: "student-2",
          response: {
            id: "response-2",
            qual_items: [
              { prompt_key: "feedback", section_key: "teaching", text_content: "Great pacing" },
            ],
            quant_items: [{ item_key: "clarity", rating_value: 5, section_key: "teaching" }],
            submitted_at: new Date("2026-01-05T08:00:00.000Z"),
          },
        },
      ],
      course: { title: "Capstone 2" },
      deadline_at: new Date("2026-01-10T00:00:00.000Z"),
      id: "eval-1",
      instrument: {
        structure_snapshot: [
          {
            items: [
              { key: "clarity", kind: "quantitative", prompt: "Clarity", scale: [1, 2, 3, 4, 5] },
              { key: "preparedness", kind: "quantitative", prompt: "Preparedness", scale: [1, 2, 3, 4, 5] },
              { key: "feedback", kind: "qualitative", prompt: "Feedback" },
            ],
            key: "teaching",
            title: "Teaching Effectiveness",
          },
        ],
        template: { name: "Post-Term CILO Evaluation Tool" },
      },
      major: null,
      program: { name: "BSIT" },
      semester: "2ND",
      term: "REGULAR",
    });

    await expect(getCourseBoundReviewDetail("eval-1")).resolves.toEqual({
      academicYear: "2025-2026",
      courseTitle: "Capstone 2",
      deadlineAt: new Date("2026-01-10T00:00:00.000Z"),
      evaluationId: "eval-1",
      evaluationTitle: "Post-Term CILO Evaluation Tool",
      overallMean: 3.67,
      programLabel: "BSIT",
      responseCards: [
        {
          overallMean: 3,
          responseId: "response-1",
          respondentLabel: "Respondent R-827493",
          submittedAt: new Date("2026-01-04T08:00:00.000Z"),
        },
        {
          overallMean: 5,
          responseId: "response-2",
          respondentLabel: "Respondent R-827494",
          submittedAt: new Date("2026-01-05T08:00:00.000Z"),
        },
      ],
      responseCount: 2,
      reviewerRole: ROLES.DEAN,
      sections: [
        {
          id: "teaching",
          mean: 3.67,
          name: "Teaching Effectiveness",
          qualitativePromptCount: 1,
          quantitativeQuestionCount: 2,
          questions: [
            { itemKey: "clarity", mean: 4.5, prompt: "Clarity" },
            { itemKey: "preparedness", mean: 2, prompt: "Preparedness" },
          ],
        },
      ],
      semester: "2ND",
      term: "REGULAR",
      wordCloudTokens: [
        { text: "great", value: 1 },
        { text: "lectures", value: 1 },
        { text: "organized", value: 1 },
        { text: "pacing", value: 1 },
      ],
    });
  });

  it("returns null when reviewer scope resolves to empty set", async () => {
    resolveAuthSessionMock.mockResolvedValue({ roles: [ROLES.FACULTY], userId: "faculty-1" });
    resolveReviewerProgramScopeMock.mockResolvedValue([]);

    await expect(getCourseBoundReviewDetail("eval-1")).resolves.toBeNull();
    expect(courseBoundEvaluationFindFirstMock).not.toHaveBeenCalled();
  });

  it("does not apply program filter for dean scope", async () => {
    resolveAuthSessionMock.mockResolvedValue({ roles: [ROLES.DEAN], userId: "dean-1" });
    resolveReviewerProgramScopeMock.mockResolvedValue(null);
    courseBoundEvaluationFindFirstMock.mockResolvedValue(null);

    await expect(getCourseBoundReviewDetail("eval-1")).resolves.toBeNull();
    expect(courseBoundEvaluationFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ program_id: expect.anything() }),
      }),
    );
  });

  it("returns null means for empty quantitative datasets", async () => {
    resolveAuthSessionMock.mockResolvedValue({ roles: [ROLES.DEAN], userId: "dean-1" });
    resolveReviewerProgramScopeMock.mockResolvedValue(null);
    courseBoundEvaluationFindFirstMock.mockResolvedValue({
      academic_year: "2025-2026",
      assignments: [
        {
          response: {
            id: "response-1",
            qual_items: [{ prompt_key: "feedback", section_key: "teaching", text_content: "Insightful" }],
            quant_items: [],
            submitted_at: new Date("2026-01-04T08:00:00.000Z"),
          },
        },
      ],
      course: { title: "Capstone 2" },
      deadline_at: null,
      id: "eval-1",
      instrument: {
        structure_snapshot: [
          {
            items: [
              { key: "clarity", kind: "quantitative", prompt: "Clarity", scale: [1, 2, 3, 4, 5] },
              { key: "feedback", kind: "qualitative", prompt: "Feedback" },
            ],
            key: "teaching",
            title: "Teaching",
          },
        ],
        template: { name: "Post-Term CILO Evaluation Tool" },
      },
      major: null,
      program: { name: "BSIT" },
      semester: "2ND",
      term: "REGULAR",
    });

    await expect(getCourseBoundReviewDetail("eval-1")).resolves.toEqual(
      expect.objectContaining({
        overallMean: null,
        responseCards: [
          expect.objectContaining({
            overallMean: null,
          }),
        ],
        sections: [
          expect.objectContaining({
            mean: null,
            questions: [expect.objectContaining({ mean: null })],
          }),
        ],
      }),
    );
  });
});
