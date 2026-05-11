# Student Course-Bound Evaluation Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the student evaluation mocks with a real course-bound assignment workflow that supports draft autosave, hard final submission, submitted history, and read-only answer review.

**Architecture:** Build a small `student-evaluation-workflow` module that owns assignment access, draft persistence, submit transitions, and view-model shaping over the existing Prisma response schema. Student pages and the existing evaluation UI should consume workflow DTOs and server actions instead of raw mock arrays or inline form structures.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma, Supabase Auth, PostgreSQL, Vitest, React Testing Library

---

## File Map

- Create: `src/modules/student-evaluation-workflow/types.ts`
  Purpose: shared DTOs and input/output contracts for the student workflow layer.
- Create: `src/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations.ts`
  Purpose: load active/submitted assigned evaluations for dashboard and list pages.
- Create: `src/modules/student-evaluation-workflow/services/get-student-course-bound-evaluation-session.ts`
  Purpose: load one assignment-bound draft/edit session with structure snapshot and saved answers.
- Create: `src/modules/student-evaluation-workflow/services/save-student-course-bound-draft.ts`
  Purpose: create or resume a draft response and upsert the current section answers.
- Create: `src/modules/student-evaluation-workflow/services/submit-student-course-bound-response.ts`
  Purpose: finalize a response, lock it, and stamp `submitted_at`.
- Create: `src/modules/student-evaluation-workflow/services/get-student-submitted-response-review.ts`
  Purpose: shape a read-only submitted response detail DTO for the dedicated review page.
- Create: `src/lib/actions/student-evaluation-actions.ts`
  Purpose: server actions for autosave and final submit that call the workflow services.
- Modify: `src/app/(app)/student/dashboard/page.tsx`
  Purpose: replace hardcoded active evaluations with workflow-backed data.
- Modify: `src/app/(app)/student/evaluations/page.tsx`
  Purpose: replace mock active/submitted tabs with workflow-backed lists.
- Modify: `src/app/(app)/student/evaluations/[id]/page.tsx`
  Purpose: load the real assignment session and pass it into the evaluation UI.
- Create: `src/app/(app)/student/history/[responseId]/page.tsx`
  Purpose: dedicated read-only submitted answer review page.
- Modify: `src/app/(app)/student/history/page.tsx`
  Purpose: replace mock submissions with real submitted response rows linking to the review page.
- Modify: `src/components/student/dashboard/evaluation-list-card.tsx`
  Purpose: support real assignment links and workflow-derived statuses.
- Modify: `src/components/student/evaluations/wizard-shell.tsx`
  Purpose: consume real sections/answers, perform autosave on section change, and submit via server action.
- Modify: `src/components/student/evaluations/review-modal.tsx`
  Purpose: render real answer summaries and submit/loading/error states.
- Create: `src/components/student/evaluations/submitted-response-review.tsx`
  Purpose: render the dedicated read-only submitted review by section.
- Create: `src/__tests__/modules/student-evaluation-workflow/list-student-course-bound-evaluations.test.ts`
  Purpose: cover active/submitted list shaping and ownership filtering.
- Create: `src/__tests__/modules/student-evaluation-workflow/get-student-course-bound-evaluation-session.test.ts`
  Purpose: cover assignment access, draft resume, and snapshot shaping.
- Create: `src/__tests__/modules/student-evaluation-workflow/save-student-course-bound-draft.test.ts`
  Purpose: cover draft creation, item upserts, and duplicate prevention.
- Create: `src/__tests__/modules/student-evaluation-workflow/submit-student-course-bound-response.test.ts`
  Purpose: cover hard final submission and status transitions.
- Create: `src/__tests__/modules/student-evaluation-workflow/get-student-submitted-response-review.test.ts`
  Purpose: cover read-only review shaping and unauthorized access rejection.
- Modify: `src/__tests__/components/student/evaluations/wizard-shell.test.tsx`
  Purpose: update UI tests from mock-only behavior to autosave/submit interaction boundaries.
- Modify: `src/__tests__/components/student/dashboard/evaluation-list-card.test.tsx`
  Purpose: cover real link rendering and workflow status output.
- Create: `src/__tests__/app/student-evaluation-pages.test.tsx`
  Purpose: verify dashboard/list/history/detail pages use workflow DTOs instead of mocks.

## Task 1: Define Workflow Contracts And List Views

**Files:**
- Create: `src/modules/student-evaluation-workflow/types.ts`
- Create: `src/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations.ts`
- Create: `src/__tests__/modules/student-evaluation-workflow/list-student-course-bound-evaluations.test.ts`

- [ ] **Step 1: Write the failing workflow list tests**

```ts
import { describe, expect, it } from "vitest";
import {
  buildStudentEvaluationListItem,
  deriveStudentEvaluationStatus,
} from "@/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations";

describe("listStudentCourseBoundEvaluations helpers", () => {
  it("derives NOT_STARTED when an assignment has no response", () => {
    expect(
      deriveStudentEvaluationStatus({
        deadlineAt: new Date("2026-05-20T00:00:00.000Z"),
        now: new Date("2026-05-01T00:00:00.000Z"),
        response: null,
      })
    ).toEqual({ status: "NOT_STARTED", progress: null });
  });

  it("derives IN_PROGRESS when an assignment has a draft response", () => {
    expect(
      deriveStudentEvaluationStatus({
        deadlineAt: new Date("2026-05-20T00:00:00.000Z"),
        now: new Date("2026-05-01T00:00:00.000Z"),
        response: { status: "IN_PROGRESS", answeredItems: 3, totalItems: 6 },
      })
    ).toEqual({ status: "IN_PROGRESS", progress: 50 });
  });

  it("derives DUE_SOON for an unsubmitted assignment near its deadline", () => {
    expect(
      deriveStudentEvaluationStatus({
        deadlineAt: new Date("2026-05-03T00:00:00.000Z"),
        now: new Date("2026-05-01T00:00:00.000Z"),
        response: null,
      })
    ).toEqual({ status: "DUE_SOON", progress: null });
  });

  it("builds a list item from assignment snapshots and response state", () => {
    expect(
      buildStudentEvaluationListItem({
        assignmentId: "assignment-1",
        evaluationTitle: "Post-Term CILO Evaluation Tool",
        courseLabel: "ITE 18 - Capstone 1",
        programLabel: "BSIT - 4th Year",
        deadlineLabel: "May 20, 2026",
        detailHref: "/student/evaluations/assignment-1",
        status: { status: "IN_PROGRESS", progress: 50 },
      })
    ).toEqual({
      assignmentId: "assignment-1",
      title: "Post-Term CILO Evaluation Tool",
      course: "ITE 18 - Capstone 1",
      program: "BSIT - 4th Year",
      deadline: "May 20, 2026",
      href: "/student/evaluations/assignment-1",
      status: "IN_PROGRESS",
      progress: 50,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/student-evaluation-workflow/list-student-course-bound-evaluations.test.ts
```

Expected: FAIL because the workflow list service does not exist yet.

- [ ] **Step 3: Create the workflow types and minimal list service**

Create `src/modules/student-evaluation-workflow/types.ts`:

```ts
export type StudentEvaluationListStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "DUE_SOON"
  | "SUBMITTED";

export type StudentEvaluationListItem = {
  assignmentId: string;
  title: string;
  course: string;
  program: string;
  deadline: string;
  href: string;
  status: StudentEvaluationListStatus;
  progress: number | null;
};

export type StudentEvaluationSection = {
  key: string;
  name: string;
  description: string;
  items: Array<
    | { kind: "quantitative"; itemKey: string; prompt: string; scale: number[] }
    | { kind: "qualitative"; promptKey: string; prompt: string }
  >;
};

export type StudentEvaluationSession = {
  assignmentId: string;
  responseId: string | null;
  title: string;
  course: string;
  deadline: string | null;
  sections: StudentEvaluationSection[];
  savedAnswers: Record<string, number | string>;
  submittedAt: string | null;
};

export type SubmittedResponseReview = {
  responseId: string;
  title: string;
  course: string;
  submittedAt: string;
  sections: Array<{
    key: string;
    name: string;
    answers: Array<{ prompt: string; value: string }>;
  }>;
};
```

Create `src/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations.ts`:

```ts
import type { StudentEvaluationListItem } from "@/modules/student-evaluation-workflow/types";

type ResponseProgress = {
  status: "IN_PROGRESS" | "SUBMITTED";
  answeredItems: number;
  totalItems: number;
};

export function deriveStudentEvaluationStatus(input: {
  deadlineAt: Date | null;
  now: Date;
  response: ResponseProgress | null;
}) {
  if (input.response?.status === "SUBMITTED") {
    return { status: "SUBMITTED" as const, progress: 100 };
  }

  if (input.response?.status === "IN_PROGRESS") {
    const progress = input.response.totalItems === 0
      ? 0
      : Math.round((input.response.answeredItems / input.response.totalItems) * 100);

    return { status: "IN_PROGRESS" as const, progress };
  }

  if (input.deadlineAt) {
    const remainingDays = Math.ceil((input.deadlineAt.getTime() - input.now.getTime()) / 86_400_000);

    if (remainingDays <= 3) {
      return { status: "DUE_SOON" as const, progress: null };
    }
  }

  return { status: "NOT_STARTED" as const, progress: null };
}

export function buildStudentEvaluationListItem(input: {
  assignmentId: string;
  evaluationTitle: string;
  courseLabel: string;
  programLabel: string;
  deadlineLabel: string;
  detailHref: string;
  status: ReturnType<typeof deriveStudentEvaluationStatus>;
}): StudentEvaluationListItem {
  return {
    assignmentId: input.assignmentId,
    title: input.evaluationTitle,
    course: input.courseLabel,
    program: input.programLabel,
    deadline: input.deadlineLabel,
    href: input.detailHref,
    status: input.status.status,
    progress: input.status.progress,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/student-evaluation-workflow/list-student-course-bound-evaluations.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/student-evaluation-workflow/types.ts src/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations.ts src/__tests__/modules/student-evaluation-workflow/list-student-course-bound-evaluations.test.ts
git commit -m "feat: define student evaluation workflow contracts"
```

## Task 2: Build Draft Session Loading And Persistence Services

**Files:**
- Create: `src/modules/student-evaluation-workflow/services/get-student-course-bound-evaluation-session.ts`
- Create: `src/modules/student-evaluation-workflow/services/save-student-course-bound-draft.ts`
- Create: `src/__tests__/modules/student-evaluation-workflow/get-student-course-bound-evaluation-session.test.ts`
- Create: `src/__tests__/modules/student-evaluation-workflow/save-student-course-bound-draft.test.ts`

- [ ] **Step 1: Write the failing session-loading tests**

```ts
import { describe, expect, it } from "vitest";
import {
  mapStructureSnapshotToSections,
  mapSavedAnswerItems,
} from "@/modules/student-evaluation-workflow/services/get-student-course-bound-evaluation-session";

describe("getStudentCourseBoundEvaluationSession helpers", () => {
  it("maps a structure snapshot into wizard sections", () => {
    expect(
      mapStructureSnapshotToSections({
        sections: [
          {
            key: "section-b",
            name: "Section B",
            description: "Rate each CILO.",
            items: [
              { kind: "quantitative", item_key: "cilo_1", prompt: "CILO 1", scale: [1, 2, 3, 4, 5] },
            ],
          },
        ],
      })
    ).toEqual([
      {
        key: "section-b",
        name: "Section B",
        description: "Rate each CILO.",
        items: [
          { kind: "quantitative", itemKey: "cilo_1", prompt: "CILO 1", scale: [1, 2, 3, 4, 5] },
        ],
      },
    ]);
  });

  it("maps saved quantitative and qualitative items into a flat answer dictionary", () => {
    expect(
      mapSavedAnswerItems({
        quantItems: [{ section_key: "section-b", item_key: "cilo_1", rating_value: 4 }],
        qualItems: [{ section_key: "section-c", prompt_key: "comment_1", text_content: "Strongly agree" }],
      })
    ).toEqual({
      "section-b:cilo_1": 4,
      "section-c:comment_1": "Strongly agree",
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/student-evaluation-workflow/get-student-course-bound-evaluation-session.test.ts
```

Expected: FAIL because the session service does not exist yet.

- [ ] **Step 3: Write the failing draft-save tests**

```ts
import { describe, expect, it } from "vitest";
import {
  buildQuantitativeUpserts,
  buildQualitativeUpserts,
} from "@/modules/student-evaluation-workflow/services/save-student-course-bound-draft";

describe("saveStudentCourseBoundDraft helpers", () => {
  it("builds quantitative upserts only for scalar answers in the current section", () => {
    expect(
      buildQuantitativeUpserts({
        responseId: "response-1",
        sectionKey: "section-b",
        answers: {
          "section-b:cilo_1": 5,
          "section-b:cilo_2": 4,
          "section-c:comment_1": "Ignored here",
        },
      })
    ).toEqual([
      { response_id: "response-1", section_key: "section-b", item_key: "cilo_1", rating_value: 5 },
      { response_id: "response-1", section_key: "section-b", item_key: "cilo_2", rating_value: 4 },
    ]);
  });

  it("builds qualitative upserts only for text answers in the current section", () => {
    expect(
      buildQualitativeUpserts({
        responseId: "response-1",
        sectionKey: "section-c",
        answers: {
          "section-b:cilo_1": 5,
          "section-c:comment_1": "Useful lab resources",
        },
      })
    ).toEqual([
      {
        response_id: "response-1",
        section_key: "section-c",
        prompt_key: "comment_1",
        text_content: "Useful lab resources",
      },
    ]);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/student-evaluation-workflow/save-student-course-bound-draft.test.ts
```

Expected: FAIL because the draft-save service does not exist yet.

- [ ] **Step 5: Implement the minimal session and draft helpers**

Create `src/modules/student-evaluation-workflow/services/get-student-course-bound-evaluation-session.ts`:

```ts
import type { StudentEvaluationSection } from "@/modules/student-evaluation-workflow/types";

type SnapshotInput = {
  sections: Array<{
    key: string;
    name: string;
    description: string;
    items: Array<
      | { kind: "quantitative"; item_key: string; prompt: string; scale: number[] }
      | { kind: "qualitative"; prompt_key: string; prompt: string }
    >;
  }>;
};

export function mapStructureSnapshotToSections(snapshot: SnapshotInput): StudentEvaluationSection[] {
  return snapshot.sections.map((section) => ({
    key: section.key,
    name: section.name,
    description: section.description,
    items: section.items.map((item) =>
      item.kind === "quantitative"
        ? { kind: "quantitative", itemKey: item.item_key, prompt: item.prompt, scale: item.scale }
        : { kind: "qualitative", promptKey: item.prompt_key, prompt: item.prompt }
    ),
  }));
}

export function mapSavedAnswerItems(input: {
  quantItems: Array<{ section_key: string; item_key: string; rating_value: number }>;
  qualItems: Array<{ section_key: string; prompt_key: string; text_content: string }>;
}) {
  return {
    ...Object.fromEntries(
      input.quantItems.map((item) => [`${item.section_key}:${item.item_key}`, item.rating_value])
    ),
    ...Object.fromEntries(
      input.qualItems.map((item) => [`${item.section_key}:${item.prompt_key}`, item.text_content])
    ),
  };
}
```

Create `src/modules/student-evaluation-workflow/services/save-student-course-bound-draft.ts`:

```ts
export function buildQuantitativeUpserts(input: {
  responseId: string;
  sectionKey: string;
  answers: Record<string, number | string>;
}) {
  return Object.entries(input.answers)
    .filter(([key, value]) => key.startsWith(`${input.sectionKey}:`) && typeof value === "number")
    .map(([key, value]) => ({
      response_id: input.responseId,
      section_key: input.sectionKey,
      item_key: key.split(":")[1],
      rating_value: value as number,
    }));
}

export function buildQualitativeUpserts(input: {
  responseId: string;
  sectionKey: string;
  answers: Record<string, number | string>;
}) {
  return Object.entries(input.answers)
    .filter(([key, value]) => key.startsWith(`${input.sectionKey}:`) && typeof value === "string")
    .map(([key, value]) => ({
      response_id: input.responseId,
      section_key: input.sectionKey,
      prompt_key: key.split(":")[1],
      text_content: value as string,
    }));
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/student-evaluation-workflow/get-student-course-bound-evaluation-session.test.ts src/__tests__/modules/student-evaluation-workflow/save-student-course-bound-draft.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/student-evaluation-workflow/services/get-student-course-bound-evaluation-session.ts src/modules/student-evaluation-workflow/services/save-student-course-bound-draft.ts src/__tests__/modules/student-evaluation-workflow/get-student-course-bound-evaluation-session.test.ts src/__tests__/modules/student-evaluation-workflow/save-student-course-bound-draft.test.ts
git commit -m "feat: add student evaluation draft helpers"
```

## Task 3: Final Submission And Read-Only Review Shaping

**Files:**
- Create: `src/modules/student-evaluation-workflow/services/submit-student-course-bound-response.ts`
- Create: `src/modules/student-evaluation-workflow/services/get-student-submitted-response-review.ts`
- Create: `src/__tests__/modules/student-evaluation-workflow/submit-student-course-bound-response.test.ts`
- Create: `src/__tests__/modules/student-evaluation-workflow/get-student-submitted-response-review.test.ts`

- [ ] **Step 1: Write the failing submit tests**

```ts
import { describe, expect, it } from "vitest";
import {
  assertSubmissionIsAllowed,
  buildSubmittedResponsePatch,
} from "@/modules/student-evaluation-workflow/services/submit-student-course-bound-response";

describe("submitStudentCourseBoundResponse helpers", () => {
  it("rejects submission when required answers are missing", () => {
    expect(() =>
      assertSubmissionIsAllowed({
        requiredAnswerKeys: ["section-b:cilo_1", "section-b:cilo_2"],
        answers: { "section-b:cilo_1": 5 },
      })
    ).toThrow("All required questions must be answered before submission.");
  });

  it("builds the submitted response patch", () => {
    const submittedAt = new Date("2026-05-20T10:00:00.000Z");

    expect(buildSubmittedResponsePatch(submittedAt)).toEqual({
      status: "SUBMITTED",
      submitted_at: submittedAt,
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/student-evaluation-workflow/submit-student-course-bound-response.test.ts
```

Expected: FAIL because the submit service does not exist yet.

- [ ] **Step 3: Write the failing read-only review tests**

```ts
import { describe, expect, it } from "vitest";
import { buildSubmittedResponseSections } from "@/modules/student-evaluation-workflow/services/get-student-submitted-response-review";

describe("getStudentSubmittedResponseReview helpers", () => {
  it("builds read-only sections from the structure snapshot and saved answers", () => {
    expect(
      buildSubmittedResponseSections({
        sections: [
          {
            key: "section-b",
            name: "Section B",
            items: [
              { kind: "quantitative", item_key: "cilo_1", prompt: "CILO 1" },
              { kind: "qualitative", prompt_key: "comment_1", prompt: "Comment" },
            ],
          },
        ],
        answers: {
          "section-b:cilo_1": 5,
          "section-b:comment_1": "Very effective",
        },
      })
    ).toEqual([
      {
        key: "section-b",
        name: "Section B",
        answers: [
          { prompt: "CILO 1", value: "5" },
          { prompt: "Comment", value: "Very effective" },
        ],
      },
    ]);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/student-evaluation-workflow/get-student-submitted-response-review.test.ts
```

Expected: FAIL because the review service does not exist yet.

- [ ] **Step 5: Implement the minimal submit and review helpers**

Create `src/modules/student-evaluation-workflow/services/submit-student-course-bound-response.ts`:

```ts
export function assertSubmissionIsAllowed(input: {
  requiredAnswerKeys: string[];
  answers: Record<string, number | string>;
}) {
  const missing = input.requiredAnswerKeys.filter((key) => input.answers[key] === undefined || input.answers[key] === "");

  if (missing.length > 0) {
    throw new Error("All required questions must be answered before submission.");
  }
}

export function buildSubmittedResponsePatch(submittedAt: Date) {
  return {
    status: "SUBMITTED" as const,
    submitted_at: submittedAt,
  };
}
```

Create `src/modules/student-evaluation-workflow/services/get-student-submitted-response-review.ts`:

```ts
export function buildSubmittedResponseSections(input: {
  sections: Array<{
    key: string;
    name: string;
    items: Array<
      | { kind: "quantitative"; item_key: string; prompt: string }
      | { kind: "qualitative"; prompt_key: string; prompt: string }
    >;
  }>;
  answers: Record<string, number | string>;
}) {
  return input.sections.map((section) => ({
    key: section.key,
    name: section.name,
    answers: section.items.map((item) => {
      const answerKey = item.kind === "quantitative"
        ? `${section.key}:${item.item_key}`
        : `${section.key}:${item.prompt_key}`;

      return {
        prompt: item.prompt,
        value: String(input.answers[answerKey] ?? "—"),
      };
    }),
  }));
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/student-evaluation-workflow/submit-student-course-bound-response.test.ts src/__tests__/modules/student-evaluation-workflow/get-student-submitted-response-review.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/student-evaluation-workflow/services/submit-student-course-bound-response.ts src/modules/student-evaluation-workflow/services/get-student-submitted-response-review.ts src/__tests__/modules/student-evaluation-workflow/submit-student-course-bound-response.test.ts src/__tests__/modules/student-evaluation-workflow/get-student-submitted-response-review.test.ts
git commit -m "feat: add student evaluation submit and review helpers"
```

## Task 4: Add Server Actions For Draft Save And Final Submit

**Files:**
- Create: `src/lib/actions/student-evaluation-actions.ts`
- Test: `src/__tests__/app/student-evaluation-pages.test.tsx`

- [ ] **Step 1: Write the failing page/action boundary test**

```ts
import { describe, expect, it, vi } from "vitest";
import { saveStudentCourseBoundDraftAction, submitStudentCourseBoundResponseAction } from "@/lib/actions/student-evaluation-actions";

vi.mock("@/modules/student-evaluation-workflow/services/save-student-course-bound-draft", () => ({
  saveStudentCourseBoundDraft: vi.fn().mockResolvedValue({ ok: true, savedAt: "2026-05-01T10:00:00.000Z" }),
}));

vi.mock("@/modules/student-evaluation-workflow/services/submit-student-course-bound-response", () => ({
  submitStudentCourseBoundResponse: vi.fn().mockResolvedValue({ ok: true, responseId: "response-1" }),
}));

describe("student evaluation actions", () => {
  it("returns a success payload from the save draft action", async () => {
    await expect(
      saveStudentCourseBoundDraftAction({
        assignmentId: "assignment-1",
        sectionKey: "section-b",
        answers: { "section-b:cilo_1": 5 },
      })
    ).resolves.toEqual({ ok: true, savedAt: "2026-05-01T10:00:00.000Z" });
  });

  it("returns a success payload from the submit action", async () => {
    await expect(
      submitStudentCourseBoundResponseAction({
        assignmentId: "assignment-1",
        answers: { "section-b:cilo_1": 5 },
      })
    ).resolves.toEqual({ ok: true, responseId: "response-1" });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/app/student-evaluation-pages.test.tsx
```

Expected: FAIL because the action file does not exist yet.

- [ ] **Step 3: Implement the minimal server actions**

Create `src/lib/actions/student-evaluation-actions.ts`:

```ts
"use server";

import { saveStudentCourseBoundDraft } from "@/modules/student-evaluation-workflow/services/save-student-course-bound-draft";
import { submitStudentCourseBoundResponse } from "@/modules/student-evaluation-workflow/services/submit-student-course-bound-response";

export async function saveStudentCourseBoundDraftAction(input: {
  assignmentId: string;
  sectionKey: string;
  answers: Record<string, number | string>;
}) {
  return saveStudentCourseBoundDraft(input);
}

export async function submitStudentCourseBoundResponseAction(input: {
  assignmentId: string;
  answers: Record<string, number | string>;
}) {
  return submitStudentCourseBoundResponse(input);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm exec vitest run src/__tests__/app/student-evaluation-pages.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/student-evaluation-actions.ts src/__tests__/app/student-evaluation-pages.test.tsx
git commit -m "feat: add student evaluation server actions"
```

## Task 5: Wire Dashboard And Evaluation Lists To Real Workflow Data

**Files:**
- Modify: `src/app/(app)/student/dashboard/page.tsx`
- Modify: `src/app/(app)/student/evaluations/page.tsx`
- Modify: `src/components/student/dashboard/evaluation-list-card.tsx`
- Modify: `src/__tests__/components/student/dashboard/evaluation-list-card.test.tsx`
- Modify: `src/__tests__/app/student-evaluation-pages.test.tsx`

- [ ] **Step 1: Write the failing dashboard/list page test**

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StudentDashboardPage from "@/app/(app)/student/dashboard/page";
import StudentEvaluationsPage from "@/app/(app)/student/evaluations/page";

vi.mock("@/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations", () => ({
  listStudentCourseBoundEvaluations: vi.fn().mockResolvedValue({
    active: [
      {
        assignmentId: "assignment-1",
        title: "Post-Term CILO Evaluation Tool",
        course: "ITE 18 - Capstone 1",
        program: "BSIT - 4th Year",
        deadline: "May 20, 2026",
        href: "/student/evaluations/assignment-1",
        status: "IN_PROGRESS",
        progress: 50,
      },
    ],
    submitted: [
      {
        assignmentId: "assignment-2",
        title: "Midterm CILO Evaluation",
        course: "ITE 12",
        program: "BSIT - 3rd Year",
        deadline: "Apr 20, 2026",
        href: "/student/history/response-1",
        status: "SUBMITTED",
        progress: 100,
      },
    ],
  }),
}));

describe("student evaluation pages", () => {
  it("renders real active evaluation cards on the dashboard", async () => {
    render(await StudentDashboardPage());

    expect(screen.getByText("Post-Term CILO Evaluation Tool")).toBeDefined();
    expect(screen.getByText(/50% Complete/i)).toBeDefined();
  });

  it("renders active and submitted tabs from workflow data", async () => {
    render(await StudentEvaluationsPage());

    expect(screen.getByText("Post-Term CILO Evaluation Tool")).toBeDefined();
    expect(screen.getByText("Midterm CILO Evaluation")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/app/student-evaluation-pages.test.tsx src/__tests__/components/student/dashboard/evaluation-list-card.test.tsx
```

Expected: FAIL because the pages still use mock arrays and the card does not yet render real links.

- [ ] **Step 3: Implement the minimal real list wiring**

Update `src/components/student/dashboard/evaluation-list-card.tsx` to accept an `href` prop and wrap the card CTA/title path with a `Link`.

Use this prop shape:

```ts
type EvaluationListCardProps = {
  title: string;
  course: string;
  program: string;
  deadline: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DUE_SOON" | "SUBMITTED";
  progress?: number | null;
  href?: string;
};
```

Update `src/app/(app)/student/dashboard/page.tsx` to call the workflow service:

```ts
import { listStudentCourseBoundEvaluations } from "@/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations";

export default async function StudentDashboardPage() {
  const { active } = await listStudentCourseBoundEvaluations();

  return (
    <div className="animate-in fade-in duration-500">
      <HeroCard name="Andy" program="BSIT" year="4th Year" section="Section A" />
      <StatCards pending={active.length} inProgress={active.filter((item) => item.status === "IN_PROGRESS").length} completed={0} />
      <section className="mt-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-extrabold font-heading">Active Evaluations</h3>
            <p className="text-sm text-text-muted font-medium">Prioritize forms closing soon</p>
          </div>
          <Link href="/student/evaluations" className="text-primary text-sm font-bold hover:underline">View All</Link>
        </div>

        <div className="grid gap-4">
          {active.map((evaluation) => (
            <EvaluationListCard key={evaluation.assignmentId} {...evaluation} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

Update `src/app/(app)/student/evaluations/page.tsx` to call the same workflow service and render `active` and `submitted` arrays in their respective tab content.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm exec vitest run src/__tests__/app/student-evaluation-pages.test.tsx src/__tests__/components/student/dashboard/evaluation-list-card.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/student/dashboard/page.tsx src/app/(app)/student/evaluations/page.tsx src/components/student/dashboard/evaluation-list-card.tsx src/__tests__/components/student/dashboard/evaluation-list-card.test.tsx src/__tests__/app/student-evaluation-pages.test.tsx
git commit -m "feat: load student evaluation lists from workflow data"
```

## Task 6: Replace The Mock Wizard With A Real Draft Session

**Files:**
- Modify: `src/app/(app)/student/evaluations/[id]/page.tsx`
- Modify: `src/components/student/evaluations/wizard-shell.tsx`
- Modify: `src/components/student/evaluations/review-modal.tsx`
- Modify: `src/__tests__/components/student/evaluations/wizard-shell.test.tsx`
- Modify: `src/__tests__/app/student-evaluation-pages.test.tsx`

- [ ] **Step 1: Write the failing real-session wizard test**

```ts
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WizardShell } from "@/components/student/evaluations/wizard-shell";

const saveDraftMock = vi.fn().mockResolvedValue({ ok: true, savedAt: "2026-05-01T10:00:00.000Z" });
const submitMock = vi.fn().mockResolvedValue({ ok: true, responseId: "response-1" });

describe("WizardShell", () => {
  it("saves the current section before moving to the next section", async () => {
    render(
      <WizardShell
        assignmentId="assignment-1"
        title="Test Eval"
        sections={[
          {
            key: "section-b",
            name: "Section B",
            description: "Rate each item.",
            items: [{ kind: "quantitative", itemKey: "cilo_1", prompt: "CILO 1", scale: [1, 2, 3, 4, 5] }],
          },
          {
            key: "section-c",
            name: "Section C",
            description: "Comment.",
            items: [{ kind: "qualitative", promptKey: "comment_1", prompt: "Comment" }],
          },
        ]}
        initialAnswers={{}}
        onSaveDraft={saveDraftMock}
        onSubmitResponse={submitMock}
      />
    );

    fireEvent.click(screen.getByRole("radio", { name: /5/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next Section/i }));

    expect(saveDraftMock).toHaveBeenCalledWith({
      assignmentId: "assignment-1",
      sectionKey: "section-b",
      answers: { "section-b:cilo_1": 5 },
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run src/__tests__/components/student/evaluations/wizard-shell.test.tsx
```

Expected: FAIL because `WizardShell` does not accept real session props or save callbacks yet.

- [ ] **Step 3: Implement the minimal real wizard session props**

Update `src/components/student/evaluations/wizard-shell.tsx` to use these prop shapes:

```ts
type WizardShellProps = {
  assignmentId: string;
  title: string;
  sections: StudentEvaluationSection[];
  initialAnswers: Record<string, number | string>;
  onSaveDraft: (input: {
    assignmentId: string;
    sectionKey: string;
    answers: Record<string, number | string>;
  }) => Promise<{ ok: boolean; savedAt?: string; error?: string }>;
  onSubmitResponse: (input: {
    assignmentId: string;
    answers: Record<string, number | string>;
  }) => Promise<{ ok: boolean; responseId?: string; error?: string }>;
};
```

Implementation requirements:

- replace numeric `Question` IDs with `section:key` answer keys
- initialize from `initialAnswers`
- on section change, call `onSaveDraft`
- keep the visible “draft saved” indicator driven by actual result state
- pass a real submit handler into `ReviewModal`
- do not show the success screen unless submit succeeds

Update `src/app/(app)/student/evaluations/[id]/page.tsx` to load a real session and pass `saveStudentCourseBoundDraftAction` and `submitStudentCourseBoundResponseAction` into `WizardShell`.

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
pnpm exec vitest run src/__tests__/components/student/evaluations/wizard-shell.test.tsx src/__tests__/app/student-evaluation-pages.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/student/evaluations/[id]/page.tsx src/components/student/evaluations/wizard-shell.tsx src/components/student/evaluations/review-modal.tsx src/__tests__/components/student/evaluations/wizard-shell.test.tsx src/__tests__/app/student-evaluation-pages.test.tsx
git commit -m "feat: connect wizard shell to real student evaluation sessions"
```

## Task 7: Add Submitted History And Dedicated Read-Only Review Page

**Files:**
- Modify: `src/app/(app)/student/history/page.tsx`
- Create: `src/app/(app)/student/history/[responseId]/page.tsx`
- Create: `src/components/student/evaluations/submitted-response-review.tsx`
- Modify: `src/__tests__/app/student-evaluation-pages.test.tsx`

- [ ] **Step 1: Write the failing submitted-history test**

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StudentHistoryPage from "@/app/(app)/student/history/page";
import StudentSubmittedResponseReviewPage from "@/app/(app)/student/history/[responseId]/page";

vi.mock("@/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations", () => ({
  listStudentCourseBoundEvaluations: vi.fn().mockResolvedValue({
    active: [],
    submitted: [
      {
        assignmentId: "assignment-2",
        title: "Midterm CILO Evaluation",
        course: "ITE 12",
        program: "BSIT - 3rd Year",
        deadline: "Apr 20, 2026",
        href: "/student/history/response-1",
        status: "SUBMITTED",
        progress: 100,
      },
    ],
  }),
}));

vi.mock("@/modules/student-evaluation-workflow/services/get-student-submitted-response-review", () => ({
  getStudentSubmittedResponseReview: vi.fn().mockResolvedValue({
    responseId: "response-1",
    title: "Midterm CILO Evaluation",
    course: "ITE 12",
    submittedAt: "2026-05-20T10:00:00.000Z",
    sections: [
      {
        key: "section-b",
        name: "Section B",
        answers: [{ prompt: "CILO 1", value: "5" }],
      },
    ],
  }),
}));

describe("submitted evaluation history", () => {
  it("renders submitted responses in history", async () => {
    render(await StudentHistoryPage());

    expect(screen.getByText("Midterm CILO Evaluation")).toBeDefined();
    expect(screen.getByRole("link", { name: /View Answers/i })).toBeDefined();
  });

  it("renders a dedicated read-only review page", async () => {
    render(await StudentSubmittedResponseReviewPage({ params: Promise.resolve({ responseId: "response-1" }) }));

    expect(screen.getByText("Midterm CILO Evaluation")).toBeDefined();
    expect(screen.getByText("CILO 1")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/app/student-evaluation-pages.test.tsx
```

Expected: FAIL because history still uses mock submissions and no dedicated review page exists.

- [ ] **Step 3: Implement the minimal submitted-history flow**

Create `src/components/student/evaluations/submitted-response-review.tsx`:

```tsx
import type { SubmittedResponseReview } from "@/modules/student-evaluation-workflow/types";

export function SubmittedResponseReview({ review }: { review: SubmittedResponseReview }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black font-heading">{review.title}</h1>
        <p className="text-sm text-text-muted">{review.course}</p>
      </div>

      {review.sections.map((section) => (
        <section key={section.key} className="space-y-4">
          <h2 className="text-lg font-bold">{section.name}</h2>
          <div className="space-y-3">
            {section.answers.map((answer) => (
              <div key={`${section.key}:${answer.prompt}`} className="rounded-xl border border-border p-4">
                <p className="text-sm text-text-secondary">{answer.prompt}</p>
                <p className="mt-2 font-bold text-text-primary">{answer.value}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

Update `src/app/(app)/student/history/page.tsx` to replace `submissions` with the workflow service `submitted` array and link `View Answers` buttons to the DTO `href`.

Create `src/app/(app)/student/history/[responseId]/page.tsx`:

```tsx
import { SubmittedResponseReview } from "@/components/student/evaluations/submitted-response-review";
import { getStudentSubmittedResponseReview } from "@/modules/student-evaluation-workflow/services/get-student-submitted-response-review";

export default async function StudentSubmittedResponseReviewPage({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = await params;
  const review = await getStudentSubmittedResponseReview(responseId);

  return <SubmittedResponseReview review={review} />;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm exec vitest run src/__tests__/app/student-evaluation-pages.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/student/history/page.tsx src/app/(app)/student/history/[responseId]/page.tsx src/components/student/evaluations/submitted-response-review.tsx src/__tests__/app/student-evaluation-pages.test.tsx
git commit -m "feat: add submitted evaluation history review"
```

## Task 8: Finish The Concrete Prisma-Backed Workflow And Run Full Verification

**Files:**
- Modify: `src/modules/student-evaluation-workflow/services/list-student-course-bound-evaluations.ts`
- Modify: `src/modules/student-evaluation-workflow/services/get-student-course-bound-evaluation-session.ts`
- Modify: `src/modules/student-evaluation-workflow/services/save-student-course-bound-draft.ts`
- Modify: `src/modules/student-evaluation-workflow/services/submit-student-course-bound-response.ts`
- Modify: `src/modules/student-evaluation-workflow/services/get-student-submitted-response-review.ts`
- Test: all workflow/page/component tests above

- [ ] **Step 1: Replace the temporary helper-only implementations with real Prisma-backed services**

Implement these exports with real data access:

```ts
export async function listStudentCourseBoundEvaluations(): Promise<{
  active: StudentEvaluationListItem[];
  submitted: StudentEvaluationListItem[];
}>;

export async function getStudentCourseBoundEvaluationSession(assignmentId: string): Promise<StudentEvaluationSession>;

export async function saveStudentCourseBoundDraft(input: {
  assignmentId: string;
  sectionKey: string;
  answers: Record<string, number | string>;
}): Promise<{ ok: boolean; savedAt?: string; error?: string }>;

export async function submitStudentCourseBoundResponse(input: {
  assignmentId: string;
  answers: Record<string, number | string>;
}): Promise<{ ok: boolean; responseId?: string; error?: string }>;

export async function getStudentSubmittedResponseReview(responseId: string): Promise<SubmittedResponseReview>;
```

Implementation requirements:

- enforce respondent ownership using the authenticated session user
- admit only course-bound assignments in this slice
- use `instrument_versions.structure_snapshot` for sections and prompts
- create or reuse one `IN_PROGRESS` response per assignment
- upsert current-section quantitative and qualitative items into the normalized tables
- set `submitted_at` on final submit and return the submitted response id
- ensure submitted responses appear in history and not in active lists
- reject unauthorized access with safe not-found style behavior

- [ ] **Step 2: Run the full targeted verification suite**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/student-evaluation-workflow/list-student-course-bound-evaluations.test.ts src/__tests__/modules/student-evaluation-workflow/get-student-course-bound-evaluation-session.test.ts src/__tests__/modules/student-evaluation-workflow/save-student-course-bound-draft.test.ts src/__tests__/modules/student-evaluation-workflow/submit-student-course-bound-response.test.ts src/__tests__/modules/student-evaluation-workflow/get-student-submitted-response-review.test.ts src/__tests__/components/student/evaluations/wizard-shell.test.tsx src/__tests__/components/student/dashboard/evaluation-list-card.test.tsx src/__tests__/app/student-evaluation-pages.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run repo-level verification**

Run:

```bash
pnpm test && pnpm lint
```

Expected:
- `pnpm test` PASS
- `pnpm lint` completes without new errors; pre-existing warnings may remain and should be reported separately if unchanged

- [ ] **Step 4: Commit**

```bash
git add src/modules/student-evaluation-workflow src/lib/actions/student-evaluation-actions.ts src/app/(app)/student/dashboard/page.tsx src/app/(app)/student/evaluations/page.tsx src/app/(app)/student/evaluations/[id]/page.tsx src/app/(app)/student/history/page.tsx src/app/(app)/student/history/[responseId]/page.tsx src/components/student/dashboard/evaluation-list-card.tsx src/components/student/evaluations/wizard-shell.tsx src/components/student/evaluations/review-modal.tsx src/components/student/evaluations/submitted-response-review.tsx src/__tests__/modules/student-evaluation-workflow src/__tests__/components/student/evaluations/wizard-shell.test.tsx src/__tests__/components/student/dashboard/evaluation-list-card.test.tsx src/__tests__/app/student-evaluation-pages.test.tsx
git commit -m "feat: implement student course-bound evaluation workflow"
```

## Self-Review

- Spec coverage:
  - Real dashboard/list/history/detail wiring is covered by Tasks 5 through 8.
  - Draft creation, autosave on section change, and hard final submission are covered by Tasks 2, 3, 4, 6, and 8.
  - Dedicated read-only submitted review is covered by Tasks 3, 7, and 8.
  - Ownership, invalid access, and workflow shaping are covered by the workflow service tasks and tests in Tasks 1 through 3 and 8.
- Placeholder scan:
  - Every task has explicit file paths, commands, and code blocks for the introduced interfaces and helper behavior.
  - No TBD/TODO placeholders remain in the plan.
- Type consistency:
  - Shared workflow DTOs are defined first in Task 1 and reused consistently in later tasks.
  - `assignmentId`, `responseId`, `StudentEvaluationSection`, and `SubmittedResponseReview` names are used consistently across the plan.
