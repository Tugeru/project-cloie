# Outline-Defense Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the outline-defense working prototype as one real Post-Term CILO vertical slice: faculty publishes a course-bound evaluation, students submit it, and faculty/program-head/dean users review scoped analytics and anonymized individual responses.

**Architecture:** Extend the current modular Next.js app with three focused capability owners: `academic-catalog-and-context` for reviewer scope, `deployments-and-targeting` for course-bound publishing and assignment generation, and `analytics-reporting-and-review` for mean-based charts, word-cloud data, and anonymized response drill-down. Keep Prisma as the app-schema source, use the tracked Supabase CLI migration workflow for hosted database changes, and reuse the existing student response workflow instead of replacing it.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Prisma, PostgreSQL on Supabase, Supabase Auth, Supabase CLI, Vitest, Recharts, wink-nlp, wink-eng-lite-web-model, stopword, @isoterik/react-word-cloud, Chrome DevTools MCP

---

## File Structure And Responsibilities

### Create

- `src/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope.ts`
  Resolve faculty and program-head program scope from new affiliation tables while treating dean as college-wide.

- `src/modules/deployments-and-targeting/types.ts`
  Shared DTOs for course publication inputs, faculty course context rows, and publication results.

- `src/modules/deployments-and-targeting/services/list-faculty-course-contexts.ts`
  Return only course contexts the signed-in faculty member is allowed to publish against.

- `src/modules/deployments-and-targeting/services/publish-course-bound-evaluation.ts`
  Create course-bound evaluations, persist CILO snapshots, save targeting rows, and create student assignments.

- `src/modules/analytics-reporting-and-review/types.ts`
  Shared DTOs for reviewer list rows, chart series, word-cloud entries, anonymized response cards, and response detail.

- `src/modules/analytics-reporting-and-review/services/list-course-bound-review-items.ts`
  List published course-bound evaluations filtered by reviewer role and scope.

- `src/modules/analytics-reporting-and-review/services/get-course-bound-review-detail.ts`
  Build the tabbed published-form detail payload: overview metrics, section means, question means, word cloud data, and anonymized response cards.

- `src/modules/analytics-reporting-and-review/services/get-course-bound-response-review.ts`
  Return one anonymized individual response detail page after applying reviewer scope checks.

- `src/lib/actions/course-bound-evaluation-actions.ts`
  Server actions for publishing course-bound evaluations.

- `src/components/faculty/publish-course-bound-evaluation-form.tsx`
  Faculty-only publish form for course context, CILO entry, dates, and target scope.

- `src/components/course-bound-review/published-course-bound-list.tsx`
  Shared table/card list used by faculty, program-head, and dean review index pages.

- `src/components/course-bound-review/course-bound-review-tabs.tsx`
  Shared tabbed detail UI for `Overview`, `Section Analytics`, `Responses`, and `Word Cloud`.

- `src/components/course-bound-review/mean-bar-chart.tsx`
  Shared `Recharts` bar chart for section means and question means.

- `src/components/course-bound-review/qualitative-word-cloud.tsx`
  Shared `@isoterik/react-word-cloud` wrapper using pre-shaped word frequency data.

- `src/components/course-bound-review/anonymized-response-cards.tsx`
  Shared response card grid with deterministic anonymized labels and `View Response` links.

- `src/components/course-bound-review/anonymized-response-detail.tsx`
  Shared read-only page body for one anonymized response.

- `src/app/(app)/faculty/cilo-evaluations/page.tsx`
  Faculty index page for published CILO forms.

- `src/app/(app)/faculty/cilo-evaluations/new/page.tsx`
  Faculty page for publishing a new course-bound CILO form.

- `src/app/(app)/faculty/cilo-evaluations/[evaluationId]/page.tsx`
  Faculty published-form detail page.

- `src/app/(app)/faculty/cilo-evaluations/[evaluationId]/responses/[responseId]/page.tsx`
  Faculty anonymized individual response page.

- `src/app/(app)/program-head/cilo-reviews/page.tsx`
  Program-head published-form review index page.

- `src/app/(app)/program-head/cilo-reviews/[evaluationId]/page.tsx`
  Program-head published-form detail page.

- `src/app/(app)/program-head/cilo-reviews/[evaluationId]/responses/[responseId]/page.tsx`
  Program-head anonymized individual response page.

- `src/app/(app)/dean/cilo-reviews/page.tsx`
  Dean published-form review index page with college-wide filtering.

- `src/app/(app)/dean/cilo-reviews/[evaluationId]/page.tsx`
  Dean published-form detail page.

- `src/app/(app)/dean/cilo-reviews/[evaluationId]/responses/[responseId]/page.tsx`
  Dean anonymized individual response page.

- `src/__tests__/modules/academic-catalog-and-context/resolve-reviewer-program-scope.test.ts`
  Lock faculty/program-head/dean scope resolution.

- `src/__tests__/modules/deployments-and-targeting/list-faculty-course-contexts.test.ts`
  Lock faculty course context filtering.

- `src/__tests__/modules/deployments-and-targeting/publish-course-bound-evaluation.test.ts`
  Lock publication behavior, target persistence, and assignment creation.

- `src/__tests__/modules/analytics-reporting-and-review/list-course-bound-review-items.test.ts`
  Lock reviewer-scoped list filtering.

- `src/__tests__/modules/analytics-reporting-and-review/get-course-bound-review-detail.test.ts`
  Lock mean aggregation, chart shaping, word-cloud shaping, and anonymized response-card output.

- `src/__tests__/modules/analytics-reporting-and-review/get-course-bound-response-review.test.ts`
  Lock reviewer access checks and anonymized individual response detail.

- `src/__tests__/components/faculty/publish-course-bound-evaluation-form.test.tsx`
  Lock the faculty publish form submission payload and client validation behavior.

- `src/__tests__/components/course-bound-review/course-bound-review-tabs.test.tsx`
  Lock the shared tabbed review experience.

- `src/__tests__/app/reviewer-course-bound-pages.test.tsx`
  Verify faculty/program-head/dean pages call the correct services and render the shared review surfaces.

- `scripts/bootstrap-outline-defense-demo.ts`
  Idempotent setup for demo users, role assignments, faculty affiliations, program-head assignment, and student academic context after the real users have signed in once.

- `supabase/migrations/20260421103000_add_outline_defense_scope_and_targets.sql`
  Hosted database migration adding reviewer-scope tables, course-bound target rows, and one-response-per-assignment enforcement.

### Modify

- `prisma/schema.prisma`
  Add reviewer-scope models, target rows, and a unique `Response.assignment_id` rule.

- `prisma/seed.ts`
  Seed demo-safe catalog data needed for this slice: course, template, and instrument version.

- `package.json`
  Add `recharts`, `wink-nlp`, `wink-eng-lite-web-model`, `stopword`, and `@isoterik/react-word-cloud`.

- `pnpm-lock.yaml`
  Lock the new dependencies.

- `src/types/supabase-database.ts`
  Regenerate linked-project types after the migration is applied.

- `src/lib/constants/navigation.ts`
  Add faculty, program-head, and dean navigation entries for publishing and review pages.

- `src/components/layout/sidebar.tsx`
  Use role-aware navigation instead of the current student/default-only split.

- `src/components/layout/mobile-nav.tsx`
  Use role-aware mobile navigation for faculty/program-head/dean entry points.

- `src/app/(app)/faculty/dashboard/page.tsx`
  Replace the stub with links into the publication and analytics surfaces.

- `src/app/(app)/program-head/dashboard/page.tsx`
  Replace the stub with a link into program-scoped CILO reviews.

- `src/app/(app)/dean/dashboard/page.tsx`
  Replace the stub with a link into dean CILO reviews.

## Task 1: Add Reviewer Scope Models, Course-Bound Targets, And Demo Bootstrap

**Files:**
- Create: `src/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope.ts`
- Create: `src/__tests__/modules/academic-catalog-and-context/resolve-reviewer-program-scope.test.ts`
- Create: `scripts/bootstrap-outline-defense-demo.ts`
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Create: `supabase/migrations/20260421103000_add_outline_defense_scope_and_targets.sql`
- Modify: `src/types/supabase-database.ts`

- [ ] **Step 1: Write the failing reviewer-scope tests**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { resolveReviewerProgramScope } from "@/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

describe("resolveReviewerProgramScope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns faculty-affiliated programs for faculty reviewers", async () => {
    findUniqueMock.mockResolvedValue({
      faculty_program_affiliations: [{ program_id: "program-bsit" }],
      program_head_assignments: [],
    });

    await expect(
      resolveReviewerProgramScope({ reviewerRole: ROLES.FACULTY, userId: "faculty-1" }),
    ).resolves.toEqual(["program-bsit"]);
  });

  it("returns assigned programs for program heads", async () => {
    findUniqueMock.mockResolvedValue({
      faculty_program_affiliations: [],
      program_head_assignments: [{ program_id: "program-bsit" }],
    });

    await expect(
      resolveReviewerProgramScope({ reviewerRole: ROLES.PROGRAM_HEAD, userId: "head-1" }),
    ).resolves.toEqual(["program-bsit"]);
  });

  it("treats the dean as college-wide", async () => {
    await expect(
      resolveReviewerProgramScope({ reviewerRole: ROLES.DEAN, userId: "dean-1" }),
    ).resolves.toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/academic-catalog-and-context/resolve-reviewer-program-scope.test.ts
```

Expected: FAIL with a module-resolution error because `resolve-reviewer-program-scope.ts` does not exist yet.

- [ ] **Step 3: Add the Prisma models and one-response-per-assignment rule**

Update `prisma/schema.prisma` with these additions:

```prisma
model User {
  id                           String                     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email                        String                     @unique
  first_name                   String
  last_name                    String
  avatar_url                   String?
  is_active                    Boolean                    @default(true)
  created_at                   DateTime                   @default(now())
  updated_at                   DateTime                   @updatedAt

  roles                        UserRole[]
  student_profile              StudentAcademicProfile?
  course_evaluations           CourseBoundEvaluation[]
  evaluation_assignments       EvaluationAssignment[]
  responses                    Response[]
  created_cilos                CILO[]
  faculty_program_affiliations FacultyProgramAffiliation[]
  program_head_assignments     ProgramHeadAssignment[]

  @@map("users")
}

model FacultyProgramAffiliation {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  faculty_id String   @db.Uuid
  program_id String   @db.Uuid
  created_at DateTime @default(now())

  faculty    User     @relation(fields: [faculty_id], references: [id], onDelete: Cascade)
  program    Program  @relation(fields: [program_id], references: [id], onDelete: Cascade)

  @@unique([faculty_id, program_id])
  @@map("faculty_program_affiliations")
}

model ProgramHeadAssignment {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  program_head_id  String   @db.Uuid
  program_id       String   @db.Uuid
  created_at       DateTime @default(now())

  program_head     User     @relation(fields: [program_head_id], references: [id], onDelete: Cascade)
  program          Program  @relation(fields: [program_id], references: [id], onDelete: Cascade)

  @@unique([program_head_id, program_id])
  @@map("program_head_assignments")
}

model CourseBoundEvaluationTarget {
  id               String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  evaluation_id    String     @db.Uuid
  program_id       String     @db.Uuid
  major_id         String?    @db.Uuid
  year_level_id    String     @db.Uuid
  section_id       String?    @db.Uuid
  created_at       DateTime   @default(now())

  evaluation       CourseBoundEvaluation @relation(fields: [evaluation_id], references: [id], onDelete: Cascade)
  program          Program               @relation(fields: [program_id], references: [id], onDelete: Cascade)
  major            Major?                @relation(fields: [major_id], references: [id], onDelete: SetNull)
  year_level       YearLevel             @relation(fields: [year_level_id], references: [id], onDelete: Restrict)
  section          Section?              @relation(fields: [section_id], references: [id], onDelete: SetNull)

  @@map("course_bound_evaluation_targets")
}

model CourseBoundEvaluation {
  id                    String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  instrument_version_id String   @db.Uuid
  course_id             String   @db.Uuid
  program_id            String   @db.Uuid
  major_id              String?  @db.Uuid
  semester              String
  term                  String
  academic_year         String
  faculty_id            String   @db.Uuid
  cilos_snapshot        Json
  course_info_snapshot  Json
  activation_at         DateTime?
  deadline_at           DateTime?
  status                String
  published_at          DateTime?
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  instrument            InstrumentVersion           @relation(fields: [instrument_version_id], references: [id], onDelete: Restrict)
  course                Course                      @relation(fields: [course_id], references: [id], onDelete: Restrict)
  program               Program                     @relation(fields: [program_id], references: [id], onDelete: Restrict)
  major                 Major?                      @relation(fields: [major_id], references: [id], onDelete: SetNull)
  faculty               User                        @relation(fields: [faculty_id], references: [id], onDelete: Restrict)
  assignments           EvaluationAssignment[]      @relation("CourseBoundAssignments")
  targets               CourseBoundEvaluationTarget[]

  @@map("course_bound_evaluations")
}

model Response {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assignment_id   String   @db.Uuid
  respondent_id   String   @db.Uuid
  deployment_type String
  deployment_id   String   @db.Uuid
  status          String
  submitted_at    DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  assignment      EvaluationAssignment         @relation(fields: [assignment_id], references: [id], onDelete: Cascade)
  respondent      User                         @relation(fields: [respondent_id], references: [id], onDelete: Restrict)
  quant_items     QuantitativeResponseItem[]
  qual_items      QualitativeResponseItem[]

  @@unique([assignment_id])
  @@map("responses")
}
```

- [ ] **Step 4: Generate the tracked Supabase migration and Prisma client updates**

Run:

```bash
pnpm supabase:migration:diff add_outline_defense_scope_and_targets --timestamp 20260421103000
pnpm exec prisma generate
pnpm supabase:push:dry-run
pnpm supabase:push
pnpm supabase:types
```

Expected:

- `Created migration at supabase/migrations/20260421103000_add_outline_defense_scope_and_targets.sql`
- `prisma generate` succeeds
- dry run shows only the new reviewer-scope, target, and uniqueness changes
- linked push succeeds
- `src/types/supabase-database.ts` is regenerated

- [ ] **Step 5: Implement reviewer scope resolution, catalog seeding, and demo bootstrap**

Create `src/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope.ts`:

```ts
import { ROLES, type Role } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";

export async function resolveReviewerProgramScope(input: {
  reviewerRole: Role;
  userId: string;
}): Promise<string[] | null> {
  if (input.reviewerRole === ROLES.DEAN) {
    return null;
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      faculty_program_affiliations: { select: { program_id: true } },
      program_head_assignments: { select: { program_id: true } },
    },
  });

  if (!reviewer) {
    return [];
  }

  if (input.reviewerRole === ROLES.FACULTY) {
    return reviewer.faculty_program_affiliations.map((item) => item.program_id);
  }

  if (input.reviewerRole === ROLES.PROGRAM_HEAD) {
    return reviewer.program_head_assignments.map((item) => item.program_id);
  }

  return [];
}
```

Update `prisma/seed.ts` so it also upserts one demo course and the baseline CILO template/version:

```ts
const ciloTemplate = await prisma.instrumentTemplate.upsert({
  where: { code: "CILO_EVAL" },
  update: {
    name: "Post-Term CILO Evaluation Tool",
    structure: [
      {
        key: "teaching-effectiveness",
        title: "Teaching Effectiveness",
        description: "Rate the teaching-related items.",
        items: [
          { kind: "quantitative", key: "teaching-1", prompt: "The instructor explained concepts clearly.", scale: [1, 2, 3, 4] },
          { kind: "qualitative", key: "teaching-remarks", prompt: "Share one suggestion for improving instruction." },
        ],
      },
    ],
  },
  create: {
    code: "CILO_EVAL",
    name: "Post-Term CILO Evaluation Tool",
    description: "Baseline institutional Post-Term CILO instrument.",
    structure: [
      {
        key: "teaching-effectiveness",
        title: "Teaching Effectiveness",
        description: "Rate the teaching-related items.",
        items: [
          { kind: "quantitative", key: "teaching-1", prompt: "The instructor explained concepts clearly.", scale: [1, 2, 3, 4] },
          { kind: "qualitative", key: "teaching-remarks", prompt: "Share one suggestion for improving instruction." },
        ],
      },
    ],
  },
});

await prisma.instrumentVersion.upsert({
  where: { template_id_version_number: { template_id: ciloTemplate.id, version_number: 1 } },
  update: { structure_snapshot: ciloTemplate.structure },
  create: {
    template_id: ciloTemplate.id,
    version_number: 1,
    structure_snapshot: ciloTemplate.structure,
  },
});
```

Create `scripts/bootstrap-outline-defense-demo.ts`:

```ts
import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

const requiredEmails = [
  process.env.OUTLINE_FACULTY_EMAIL,
  process.env.OUTLINE_PROGRAM_HEAD_EMAIL,
  process.env.OUTLINE_DEAN_EMAIL,
  process.env.OUTLINE_STUDENT_EMAIL,
];

if (requiredEmails.some((value) => !value)) {
  throw new Error("Set OUTLINE_FACULTY_EMAIL, OUTLINE_PROGRAM_HEAD_EMAIL, OUTLINE_DEAN_EMAIL, and OUTLINE_STUDENT_EMAIL.");
}

async function main() {
  const [faculty, head, dean, student, bsit, fourthYear] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: process.env.OUTLINE_FACULTY_EMAIL! } }),
    prisma.user.findUniqueOrThrow({ where: { email: process.env.OUTLINE_PROGRAM_HEAD_EMAIL! } }),
    prisma.user.findUniqueOrThrow({ where: { email: process.env.OUTLINE_DEAN_EMAIL! } }),
    prisma.user.findUniqueOrThrow({ where: { email: process.env.OUTLINE_STUDENT_EMAIL! } }),
    prisma.program.findUniqueOrThrow({ where: { code: "BSIT" } }),
    prisma.yearLevel.findUniqueOrThrow({ where: { name: "4th Year" } }),
  ]);

  const [facultyRole, headRole, deanRole, studentRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: "FACULTY" } }),
    prisma.role.findUniqueOrThrow({ where: { name: "PROGRAM_HEAD" } }),
    prisma.role.findUniqueOrThrow({ where: { name: "DEAN" } }),
    prisma.role.findUniqueOrThrow({ where: { name: "STUDENT" } }),
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.userRole.upsert({
      where: { user_id_role_id: { user_id: faculty.id, role_id: facultyRole.id } },
      update: {},
      create: { user_id: faculty.id, role_id: facultyRole.id },
    });

    await tx.userRole.upsert({
      where: { user_id_role_id: { user_id: head.id, role_id: headRole.id } },
      update: {},
      create: { user_id: head.id, role_id: headRole.id },
    });

    await tx.userRole.upsert({
      where: { user_id_role_id: { user_id: dean.id, role_id: deanRole.id } },
      update: {},
      create: { user_id: dean.id, role_id: deanRole.id },
    });

    await tx.userRole.upsert({
      where: { user_id_role_id: { user_id: student.id, role_id: studentRole.id } },
      update: {},
      create: { user_id: student.id, role_id: studentRole.id },
    });

    await tx.facultyProgramAffiliation.upsert({
      where: { faculty_id_program_id: { faculty_id: faculty.id, program_id: bsit.id } },
      update: {},
      create: { faculty_id: faculty.id, program_id: bsit.id },
    });

    await tx.programHeadAssignment.upsert({
      where: { program_head_id_program_id: { program_head_id: head.id, program_id: bsit.id } },
      update: {},
      create: { program_head_id: head.id, program_id: bsit.id },
    });

    await tx.studentAcademicProfile.upsert({
      where: { user_id: student.id },
      update: { program_id: bsit.id, year_level_id: fourthYear.id, academic_year: "2026-2027" },
      create: { user_id: student.id, program_id: bsit.id, year_level_id: fourthYear.id, academic_year: "2026-2027" },
    });
  });
}

main().finally(async () => prisma.$disconnect());
```

- [ ] **Step 6: Run the focused checks and bootstrap the demo users**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/academic-catalog-and-context/resolve-reviewer-program-scope.test.ts
pnpm db:seed
OUTLINE_FACULTY_EMAIL=faculty@acd.edu.ph OUTLINE_PROGRAM_HEAD_EMAIL=programhead@acd.edu.ph OUTLINE_DEAN_EMAIL=dean@acd.edu.ph OUTLINE_STUDENT_EMAIL=student@acd.edu.ph pnpm exec tsx scripts/bootstrap-outline-defense-demo.ts
```

Expected:

- the reviewer-scope test passes
- seed completes without duplicate-key errors
- bootstrap exits successfully after assigning roles and scope rows to the real signed-in users

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts scripts/bootstrap-outline-defense-demo.ts src/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope.ts src/__tests__/modules/academic-catalog-and-context/resolve-reviewer-program-scope.test.ts supabase/migrations/20260421103000_add_outline_defense_scope_and_targets.sql src/types/supabase-database.ts
git commit -m "feat: add reviewer scope and course-bound targeting foundation"
```

## Task 2: Implement Faculty Course Context Loading And Course-Bound Publication

**Files:**
- Create: `src/modules/deployments-and-targeting/types.ts`
- Create: `src/modules/deployments-and-targeting/services/list-faculty-course-contexts.ts`
- Create: `src/modules/deployments-and-targeting/services/publish-course-bound-evaluation.ts`
- Create: `src/lib/actions/course-bound-evaluation-actions.ts`
- Create: `src/__tests__/modules/deployments-and-targeting/list-faculty-course-contexts.test.ts`
- Create: `src/__tests__/modules/deployments-and-targeting/publish-course-bound-evaluation.test.ts`

- [ ] **Step 1: Write the failing publication tests**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listFacultyCourseContexts } from "@/modules/deployments-and-targeting/services/list-faculty-course-contexts";
import { publishCourseBoundEvaluation } from "@/modules/deployments-and-targeting/services/publish-course-bound-evaluation";

const mocks = vi.hoisted(() => ({
  resolveAuthSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/modules/identity-access/services/resolve-auth-session", () => ({
  resolveAuthSession: mocks.resolveAuthSessionMock,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    facultyProgramAffiliation: { findMany: mocks.findManyMock },
    $transaction: mocks.transactionMock,
  },
}));

describe("listFacultyCourseContexts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only the signed-in faculty member's affiliated course contexts", async () => {
    mocks.resolveAuthSessionMock.mockResolvedValue({ userId: "faculty-1", roles: ["FACULTY"] });
    mocks.findManyMock.mockResolvedValue([
      {
        program: {
          courses: [
            { id: "course-1", code: "ITE 18", title: "Capstone 1", program: { code: "BSIT", name: "Bachelor of Science in Information Technology" } },
          ],
        },
      },
    ]);

    await expect(listFacultyCourseContexts()).resolves.toEqual([
      {
        courseId: "course-1",
        courseLabel: "ITE 18 - Capstone 1",
        programCode: "BSIT",
        programId: expect.any(String),
      },
    ]);
  });
});

describe("publishCourseBoundEvaluation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a published evaluation, target rows, and student assignments", async () => {
    mocks.resolveAuthSessionMock.mockResolvedValue({ userId: "faculty-1", roles: ["FACULTY"] });
    mocks.transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
      const tx = {
        course: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "course-1", code: "ITE 18", title: "Capstone 1", program_id: "program-bsit" }) },
        instrumentTemplate: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "template-1" }) },
        instrumentVersion: { findFirstOrThrow: vi.fn().mockResolvedValue({ id: "version-1", structure_snapshot: [] }) },
        cILO: { deleteMany: vi.fn(), createMany: vi.fn() },
        courseBoundEvaluation: { create: vi.fn().mockResolvedValue({ id: "evaluation-1" }) },
        courseBoundEvaluationTarget: { createMany: vi.fn() },
        studentAcademicProfile: { findMany: vi.fn().mockResolvedValue([{ user_id: "student-1" }]) },
        evaluationAssignment: { createMany: vi.fn() },
      };

      await callback(tx);

      expect(tx.courseBoundEvaluationTarget.createMany).toHaveBeenCalledWith({
        data: [
          {
            evaluation_id: "evaluation-1",
            major_id: null,
            program_id: "program-bsit",
            section_id: null,
            year_level_id: "year-4",
          },
        ],
      });

      expect(tx.evaluationAssignment.createMany).toHaveBeenCalledWith({
        data: [{ course_bound_id: "evaluation-1", respondent_id: "student-1" }],
        skipDuplicates: true,
      });

      return { evaluationId: "evaluation-1", assignmentCount: 1 };
    });

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        activationAt: "2026-04-25T08:00:00.000Z",
        cilos: ["Apply software engineering principles", "Present capstone findings clearly"],
        courseId: "course-1",
        deadlineAt: "2026-05-02T17:00:00.000Z",
        semester: "2nd Semester",
        targetYearLevelIds: ["year-4"],
        term: "Final",
      }),
    ).resolves.toEqual({ assignmentCount: 1, evaluationId: "evaluation-1" });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/deployments-and-targeting/list-faculty-course-contexts.test.ts src/__tests__/modules/deployments-and-targeting/publish-course-bound-evaluation.test.ts
```

Expected: FAIL because the new `deployments-and-targeting` services do not exist yet.

- [ ] **Step 3: Implement the publication DTOs and backend services**

Create `src/modules/deployments-and-targeting/types.ts`:

```ts
export type FacultyCourseContext = {
  courseId: string;
  courseLabel: string;
  programCode: string;
  programId: string;
};

export type PublishCourseBoundEvaluationInput = {
  academicYear: string;
  activationAt: string;
  cilos: string[];
  courseId: string;
  deadlineAt: string;
  semester: string;
  targetYearLevelIds: string[];
  term: string;
};

export type PublishCourseBoundEvaluationResult = {
  assignmentCount: number;
  evaluationId: string;
};
```

Create `src/modules/deployments-and-targeting/services/list-faculty-course-contexts.ts`:

```ts
import { prisma } from "@/lib/db/prisma";
import { ROLES } from "@/lib/constants/roles";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import type { FacultyCourseContext } from "@/modules/deployments-and-targeting/types";

export async function listFacultyCourseContexts(): Promise<FacultyCourseContext[]> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return [];
  }

  const affiliations = await prisma.facultyProgramAffiliation.findMany({
    where: { faculty_id: session.userId },
    include: {
      program: {
        include: {
          courses: true,
        },
      },
    },
  });

  return affiliations.flatMap((affiliation) =>
    affiliation.program.courses.map((course) => ({
      courseId: course.id,
      courseLabel: `${course.code} - ${course.title}`,
      programCode: affiliation.program.code,
      programId: affiliation.program.id,
    })),
  );
}
```

Create `src/modules/deployments-and-targeting/services/publish-course-bound-evaluation.ts`:

```ts
import { prisma } from "@/lib/db/prisma";
import { ROLES } from "@/lib/constants/roles";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import type { PublishCourseBoundEvaluationInput, PublishCourseBoundEvaluationResult } from "@/modules/deployments-and-targeting/types";

function buildStructureSnapshot(baseStructure: any[], cilos: string[]) {
  const ciloSection = {
    key: "cilo-attainment",
    title: "CILO Attainment",
    description: "Rate each course intended learning outcome.",
    items: cilos.map((description, index) => ({
      kind: "quantitative",
      key: `cilo-${index + 1}`,
      prompt: description,
      scale: [1, 2, 3, 4],
    })),
  };

  return [...baseStructure, ciloSection];
}

export async function publishCourseBoundEvaluation(
  input: PublishCourseBoundEvaluationInput,
): Promise<PublishCourseBoundEvaluationResult> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    throw new Error("Only faculty users can publish course-bound evaluations.");
  }

  return prisma.$transaction(async (tx) => {
    const course = await tx.course.findUniqueOrThrow({ where: { id: input.courseId } });
    const template = await tx.instrumentTemplate.findUniqueOrThrow({ where: { code: "CILO_EVAL" } });
    const version = await tx.instrumentVersion.findFirstOrThrow({
      where: { template_id: template.id, is_active: true },
      orderBy: { version_number: "desc" },
    });

    const ciloRows = input.cilos.map((description, index) => ({
      academic_term: `${input.academicYear} ${input.semester}`,
      course_id: input.courseId,
      created_by: session.userId,
      description,
      order: index + 1,
    }));

    await tx.cILO.deleteMany({ where: { course_id: input.courseId, created_by: session.userId } });
    await tx.cILO.createMany({ data: ciloRows });

    const evaluation = await tx.courseBoundEvaluation.create({
      data: {
        academic_year: input.academicYear,
        activation_at: new Date(input.activationAt),
        cilos_snapshot: ciloRows.map(({ description, order }) => ({ description, order })),
        course_id: input.courseId,
        course_info_snapshot: { code: course.code, title: course.title },
        deadline_at: new Date(input.deadlineAt),
        faculty_id: session.userId,
        instrument_version_id: version.id,
        program_id: course.program_id!,
        published_at: new Date(),
        semester: input.semester,
        status: "ACTIVE",
        term: input.term,
      },
    });

    await tx.courseBoundEvaluationTarget.createMany({
      data: input.targetYearLevelIds.map((yearLevelId) => ({
        evaluation_id: evaluation.id,
        major_id: null,
        program_id: course.program_id!,
        section_id: null,
        year_level_id: yearLevelId,
      })),
    });

    const matchingStudents = await tx.studentAcademicProfile.findMany({
      where: {
        program_id: course.program_id!,
        year_level_id: { in: input.targetYearLevelIds },
      },
      select: { user_id: true },
    });

    await tx.evaluationAssignment.createMany({
      data: matchingStudents.map((student) => ({
        course_bound_id: evaluation.id,
        respondent_id: student.user_id,
      })),
      skipDuplicates: true,
    });

    return { assignmentCount: matchingStudents.length, evaluationId: evaluation.id };
  });
}
```

Create `src/lib/actions/course-bound-evaluation-actions.ts`:

```ts
"use server";

import { publishCourseBoundEvaluation, type PublishCourseBoundEvaluationInput } from "@/modules/deployments-and-targeting/services/publish-course-bound-evaluation";

export async function publishCourseBoundEvaluationAction(
  payload: PublishCourseBoundEvaluationInput,
) {
  return publishCourseBoundEvaluation(payload);
}
```

- [ ] **Step 4: Run the targeted service tests**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/deployments-and-targeting/list-faculty-course-contexts.test.ts src/__tests__/modules/deployments-and-targeting/publish-course-bound-evaluation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/deployments-and-targeting/types.ts src/modules/deployments-and-targeting/services/list-faculty-course-contexts.ts src/modules/deployments-and-targeting/services/publish-course-bound-evaluation.ts src/lib/actions/course-bound-evaluation-actions.ts src/__tests__/modules/deployments-and-targeting/list-faculty-course-contexts.test.ts src/__tests__/modules/deployments-and-targeting/publish-course-bound-evaluation.test.ts
git commit -m "feat: add faculty course-bound publication services"
```

## Task 3: Build Faculty Publishing UI And Role-Aware Navigation

**Files:**
- Create: `src/components/faculty/publish-course-bound-evaluation-form.tsx`
- Create: `src/app/(app)/faculty/cilo-evaluations/page.tsx`
- Create: `src/app/(app)/faculty/cilo-evaluations/new/page.tsx`
- Create: `src/__tests__/components/faculty/publish-course-bound-evaluation-form.test.tsx`
- Modify: `src/lib/constants/navigation.ts`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/mobile-nav.tsx`
- Modify: `src/app/(app)/faculty/dashboard/page.tsx`

- [ ] **Step 1: Write the failing faculty publish-form test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublishCourseBoundEvaluationForm } from "@/components/faculty/publish-course-bound-evaluation-form";

describe("PublishCourseBoundEvaluationForm", () => {
  it("submits one payload with trimmed CILO lines and year-level targets", async () => {
    const onPublish = vi.fn().mockResolvedValue({ assignmentCount: 4, evaluationId: "evaluation-1" });

    render(
      <PublishCourseBoundEvaluationForm
        courseContexts={[{ courseId: "course-1", courseLabel: "ITE 18 - Capstone 1", programCode: "BSIT", programId: "program-bsit" }]}
        yearLevels={[{ id: "year-4", name: "4th Year" }]}
        onPublish={onPublish}
      />,
    );

    fireEvent.change(screen.getByLabelText(/course context/i), { target: { value: "course-1" } });
    fireEvent.change(screen.getByLabelText(/academic year/i), { target: { value: "2026-2027" } });
    fireEvent.change(screen.getByLabelText(/semester/i), { target: { value: "2nd Semester" } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: "Final" } });
    fireEvent.change(screen.getByLabelText(/activation/i), { target: { value: "2026-04-25T08:00" } });
    fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: "2026-05-02T17:00" } });
    fireEvent.change(screen.getByLabelText(/cilos/i), {
      target: { value: "Apply software engineering principles\nPresent capstone findings clearly" },
    });
    fireEvent.click(screen.getByLabelText(/4th Year/i));
    fireEvent.click(screen.getByRole("button", { name: /publish evaluation/i }));

    expect(onPublish).toHaveBeenCalledWith({
      academicYear: "2026-2027",
      activationAt: "2026-04-25T08:00",
      cilos: ["Apply software engineering principles", "Present capstone findings clearly"],
      courseId: "course-1",
      deadlineAt: "2026-05-02T17:00",
      semester: "2nd Semester",
      targetYearLevelIds: ["year-4"],
      term: "Final",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run src/__tests__/components/faculty/publish-course-bound-evaluation-form.test.tsx
```

Expected: FAIL because the faculty publish form does not exist yet.

- [ ] **Step 3: Implement the faculty pages and role-aware nav entries**

Create `src/components/faculty/publish-course-bound-evaluation-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FacultyCourseContext, PublishCourseBoundEvaluationInput } from "@/modules/deployments-and-targeting/types";

export function PublishCourseBoundEvaluationForm({
  courseContexts,
  yearLevels,
  onPublish,
}: {
  courseContexts: FacultyCourseContext[];
  yearLevels: Array<{ id: string; name: string }>;
  onPublish: (payload: PublishCourseBoundEvaluationInput) => Promise<{ evaluationId: string }>;
}) {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  return (
    <form
      className="space-y-6"
      action={async (formData) => {
        const cilos = String(formData.get("cilos") ?? "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        await onPublish({
          academicYear: String(formData.get("academicYear") ?? ""),
          activationAt: String(formData.get("activationAt") ?? ""),
          cilos,
          courseId: String(formData.get("courseId") ?? ""),
          deadlineAt: String(formData.get("deadlineAt") ?? ""),
          semester: String(formData.get("semester") ?? ""),
          targetYearLevelIds: selectedYears,
          term: String(formData.get("term") ?? ""),
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="courseId">Course Context</Label>
        <select id="courseId" name="courseId" className="w-full rounded-md border border-border bg-background px-3 py-2">
          {courseContexts.map((course) => (
            <option key={course.courseId} value={course.courseId}>{course.courseLabel}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="academicYear">Academic Year</Label><Input id="academicYear" name="academicYear" /></div>
        <div className="space-y-2"><Label htmlFor="semester">Semester</Label><Input id="semester" name="semester" /></div>
        <div className="space-y-2"><Label htmlFor="term">Term</Label><Input id="term" name="term" /></div>
        <div className="space-y-2"><Label htmlFor="activationAt">Activation</Label><Input id="activationAt" name="activationAt" type="datetime-local" /></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="deadlineAt">Deadline</Label><Input id="deadlineAt" name="deadlineAt" type="datetime-local" /></div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cilos">CILOs</Label>
        <textarea id="cilos" name="cilos" className="min-h-40 w-full rounded-md border border-border bg-background px-3 py-2" />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Target Year Levels</legend>
        {yearLevels.map((yearLevel) => (
          <label key={yearLevel.id} className="flex items-center gap-2 text-sm">
            <input
              aria-label={yearLevel.name}
              type="checkbox"
              checked={selectedYears.includes(yearLevel.id)}
              onChange={() =>
                setSelectedYears((current) =>
                  current.includes(yearLevel.id)
                    ? current.filter((value) => value !== yearLevel.id)
                    : [...current, yearLevel.id],
                )
              }
            />
            {yearLevel.name}
          </label>
        ))}
      </fieldset>

      <Button type="submit">Publish Evaluation</Button>
    </form>
  );
}
```

Create `src/app/(app)/faculty/cilo-evaluations/new/page.tsx`:

```tsx
import { PublishCourseBoundEvaluationForm } from "@/components/faculty/publish-course-bound-evaluation-form";
import { publishCourseBoundEvaluationAction } from "@/lib/actions/course-bound-evaluation-actions";
import { listFacultyCourseContexts } from "@/modules/deployments-and-targeting/services/list-faculty-course-contexts";
import { prisma } from "@/lib/db/prisma";

export default async function NewFacultyCiloEvaluationPage() {
  const [courseContexts, yearLevels] = await Promise.all([
    listFacultyCourseContexts(),
    prisma.yearLevel.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black font-heading">Publish Post-Term CILO Evaluation</h1>
        <p className="text-sm text-text-muted">Create one course-bound form, persist student targets, and publish it immediately.</p>
      </div>
      <PublishCourseBoundEvaluationForm
        courseContexts={courseContexts}
        yearLevels={yearLevels}
        onPublish={publishCourseBoundEvaluationAction}
      />
    </div>
  );
}
```

Create `src/app/(app)/faculty/cilo-evaluations/page.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublishedCourseBoundList } from "@/components/course-bound-review/published-course-bound-list";
import { ROLES } from "@/lib/constants/roles";
import { listCourseBoundReviewItems } from "@/modules/analytics-reporting-and-review/services/list-course-bound-review-items";

export default async function FacultyCiloEvaluationsPage() {
  const items = await listCourseBoundReviewItems({
    reviewerRole: ROLES.FACULTY,
    basePath: "/faculty/cilo-evaluations",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-heading">Published CILO Forms</h1>
          <p className="text-sm text-text-muted">Review every course-bound Post-Term CILO evaluation you published.</p>
        </div>
        <Button asChild>
          <Link href="/faculty/cilo-evaluations/new">Create New</Link>
        </Button>
      </div>
      <PublishedCourseBoundList emptyMessage="No published CILO forms yet." items={items} />
    </div>
  );
}
```

Update `src/app/(app)/faculty/dashboard/page.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyDashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <p className="text-sm text-text-muted">Publish Post-Term CILO evaluations and review the results for your own forms.</p>
      </div>
      <div className="flex gap-3">
        <Button asChild><Link href="/faculty/cilo-evaluations/new">Publish Evaluation</Link></Button>
        <Button asChild variant="outline"><Link href="/faculty/cilo-evaluations">View Published Forms</Link></Button>
      </div>
    </div>
  );
}
```

Update `src/lib/constants/navigation.ts` to add:

```ts
export const FACULTY_NAV: NavItem[] = [
  { name: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
  { name: "CILO Forms", href: "/faculty/cilo-evaluations", icon: FileText },
];

export const PROGRAM_HEAD_NAV: NavItem[] = [
  { name: "Dashboard", href: "/program-head/dashboard", icon: LayoutDashboard },
  { name: "CILO Reviews", href: "/program-head/cilo-reviews", icon: FileText },
];

export const DEAN_NAV: NavItem[] = [
  { name: "Dashboard", href: "/dean/dashboard", icon: LayoutDashboard },
  { name: "CILO Reviews", href: "/dean/cilo-reviews", icon: FileText },
];
```

Add the role helpers to `src/lib/constants/navigation.ts`:

```ts
import { ROLES, type Role } from "@/lib/constants/roles";

export function getPrimaryNavForRoles(roles: Role[]): NavItem[] {
  if (roles.includes(ROLES.DEAN)) {
    return DEAN_NAV;
  }

  if (roles.includes(ROLES.PROGRAM_HEAD)) {
    return PROGRAM_HEAD_NAV;
  }

  if (roles.includes(ROLES.FACULTY)) {
    return FACULTY_NAV;
  }

  if (roles.includes(ROLES.STUDENT) || roles.includes(ROLES.GRADUATING_STUDENT)) {
    return STUDENT_NAV;
  }

  return DEFAULT_NAV;
}

export function getMobileNavForRoles(roles: Role[]): NavItem[] {
  if (roles.includes(ROLES.STUDENT) || roles.includes(ROLES.GRADUATING_STUDENT)) {
    return STUDENT_MOBILE_NAV;
  }

  return getPrimaryNavForRoles(roles);
}
```

Update `src/components/layout/sidebar.tsx` and `src/components/layout/mobile-nav.tsx` to call `getPrimaryNavForRoles(roles)` and `getMobileNavForRoles(roles)` instead of the current student/default split.

- [ ] **Step 4: Run the component test**

Run:

```bash
pnpm exec vitest run src/__tests__/components/faculty/publish-course-bound-evaluation-form.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/faculty/publish-course-bound-evaluation-form.tsx src/app/(app)/faculty/cilo-evaluations/page.tsx src/app/(app)/faculty/cilo-evaluations/new/page.tsx src/__tests__/components/faculty/publish-course-bound-evaluation-form.test.tsx src/lib/constants/navigation.ts src/components/layout/sidebar.tsx src/components/layout/mobile-nav.tsx src/app/(app)/faculty/dashboard/page.tsx
git commit -m "feat: add faculty publishing pages and role navigation"
```

## Task 4: Add Scoped Analytics Services, Mean Aggregation, And Word-Cloud Data Shaping

**Files:**
- Create: `src/modules/analytics-reporting-and-review/types.ts`
- Create: `src/modules/analytics-reporting-and-review/services/list-course-bound-review-items.ts`
- Create: `src/modules/analytics-reporting-and-review/services/get-course-bound-review-detail.ts`
- Create: `src/modules/analytics-reporting-and-review/services/get-course-bound-response-review.ts`
- Create: `src/__tests__/modules/analytics-reporting-and-review/list-course-bound-review-items.test.ts`
- Create: `src/__tests__/modules/analytics-reporting-and-review/get-course-bound-review-detail.test.ts`
- Create: `src/__tests__/modules/analytics-reporting-and-review/get-course-bound-response-review.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Write the failing analytics tests**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { buildWordCloudWords, getCourseBoundReviewDetail } from "@/modules/analytics-reporting-and-review/services/get-course-bound-review-detail";

const mocks = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  resolveReviewerProgramScopeMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    courseBoundEvaluation: {
      findFirst: mocks.findFirstMock,
    },
  },
}));

vi.mock("@/modules/identity-access/services/resolve-auth-session", () => ({
  resolveAuthSession: mocks.resolveAuthSessionMock,
}));

vi.mock("@/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope", () => ({
  resolveReviewerProgramScope: mocks.resolveReviewerProgramScopeMock,
}));

describe("buildWordCloudWords", () => {
  it("normalizes qualitative comments into descending frequency rows", () => {
    expect(
      buildWordCloudWords([
        "Clear explanations and clear feedback.",
        "Helpful feedback for capstone work.",
      ]),
    ).toEqual([
      { text: "clear", value: 2 },
      { text: "feedback", value: 2 },
      { text: "helpful", value: 1 },
      { text: "capstone", value: 1 },
      { text: "work", value: 1 },
    ]);
  });
});

describe("getCourseBoundReviewDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("builds section means, question means, and anonymized response cards for faculty review", async () => {
    mocks.resolveAuthSessionMock.mockResolvedValue({ userId: "faculty-1", roles: [ROLES.FACULTY] });
    mocks.resolveReviewerProgramScopeMock.mockResolvedValue(["program-bsit"]);
    mocks.findFirstMock.mockResolvedValue({
      id: "evaluation-1",
      course: { code: "ITE 18", title: "Capstone 1" },
      program: { code: "BSIT", name: "Bachelor of Science in Information Technology" },
      responses: [
        {
          id: "response-1",
          submitted_at: new Date("2026-04-27T10:00:00.000Z"),
          quant_items: [
            { section_key: "teaching", item_key: "teaching-1", rating_value: 4 },
            { section_key: "cilo-attainment", item_key: "cilo-1", rating_value: 3 },
          ],
          qual_items: [{ section_key: "teaching", prompt_key: "teaching-remarks", text_content: "Clear explanations" }],
        },
        {
          id: "response-2",
          submitted_at: new Date("2026-04-27T11:00:00.000Z"),
          quant_items: [
            { section_key: "teaching", item_key: "teaching-1", rating_value: 2 },
            { section_key: "cilo-attainment", item_key: "cilo-1", rating_value: 4 },
          ],
          qual_items: [{ section_key: "teaching", prompt_key: "teaching-remarks", text_content: "Helpful feedback" }],
        },
      ],
    });

    await expect(
      getCourseBoundReviewDetail({ evaluationId: "evaluation-1", reviewerRole: ROLES.FACULTY }),
    ).resolves.toEqual(
      expect.objectContaining({
        overview: expect.objectContaining({ overallMean: 3.25, responseCount: 2 }),
        responseCards: [
          expect.objectContaining({ label: "Respondent A01" }),
          expect.objectContaining({ label: "Respondent A02" }),
        ],
        sectionMeans: expect.arrayContaining([
          expect.objectContaining({ key: "teaching", mean: 3 }),
          expect.objectContaining({ key: "cilo-attainment", mean: 3.5 }),
        ]),
        wordCloud: expect.arrayContaining([
          expect.objectContaining({ text: "clear", value: 1 }),
          expect.objectContaining({ text: "helpful", value: 1 }),
        ]),
      }),
    );
  });
});
```

- [ ] **Step 2: Run the analytics tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/analytics-reporting-and-review/list-course-bound-review-items.test.ts src/__tests__/modules/analytics-reporting-and-review/get-course-bound-review-detail.test.ts src/__tests__/modules/analytics-reporting-and-review/get-course-bound-response-review.test.ts
```

Expected: FAIL because the analytics services do not exist yet.

- [ ] **Step 3: Add the analytics dependencies**

Run:

```bash
pnpm add recharts wink-nlp wink-eng-lite-web-model stopword @isoterik/react-word-cloud
```

Expected: `package.json` and `pnpm-lock.yaml` update successfully.

- [ ] **Step 4: Implement the analytics DTOs and reviewer services**

Create `src/modules/analytics-reporting-and-review/types.ts`:

```ts
export type ReviewListItem = {
  evaluationId: string;
  courseLabel: string;
  programLabel: string;
  publishedAt: Date | null;
  responseCount: number;
  href: string;
};

export type MeanSeriesItem = {
  key: string;
  label: string;
  mean: number;
};

export type WordCloudWord = {
  text: string;
  value: number;
};

export type ResponseCard = {
  label: string;
  overallMean: number;
  responseId: string;
  submittedAt: Date;
};
```

Create `src/modules/analytics-reporting-and-review/services/list-course-bound-review-items.ts`:

```ts
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import { resolveReviewerProgramScope } from "@/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope";
import type { Role } from "@/lib/constants/roles";
import type { ReviewListItem } from "@/modules/analytics-reporting-and-review/types";

export async function listCourseBoundReviewItems(input: {
  reviewerRole: Role;
  basePath: string;
}): Promise<ReviewListItem[]> {
  const session = await resolveAuthSession();

  if (!session) {
    return [];
  }

  const programScope = await resolveReviewerProgramScope({ reviewerRole: input.reviewerRole, userId: session.userId });

  const evaluations = await prisma.courseBoundEvaluation.findMany({
    where: {
      ...(input.reviewerRole === "FACULTY" ? { faculty_id: session.userId } : {}),
      ...(programScope ? { program_id: { in: programScope } } : {}),
      published_at: { not: null },
    },
    include: {
      course: true,
      program: true,
      responses: { where: { submitted_at: { not: null } }, select: { id: true } },
    },
    orderBy: { published_at: "desc" },
  });

  return evaluations.map((evaluation) => ({
    courseLabel: `${evaluation.course.code} - ${evaluation.course.title}`,
    evaluationId: evaluation.id,
    href: `${input.basePath}/${evaluation.id}`,
    programLabel: `${evaluation.program.code} - ${evaluation.program.name}`,
    publishedAt: evaluation.published_at,
    responseCount: evaluation.responses.length,
  }));
}
```

Create `src/modules/analytics-reporting-and-review/services/get-course-bound-review-detail.ts`:

```ts
import model from "wink-eng-lite-web-model";
import winkNLP from "wink-nlp";
import { removeStopwords } from "stopword";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import { resolveReviewerProgramScope } from "@/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope";
import type { Role } from "@/lib/constants/roles";

const nlp = winkNLP(model);

export function buildWordCloudWords(comments: string[]) {
  const tokens = comments
    .flatMap((comment) => nlp.readDoc(comment).tokens().out())
    .map((token) => token.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  const filtered = removeStopwords(tokens);
  const frequencies = new Map<string, number>();

  for (const token of filtered) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .map(([text, value]) => ({ text, value }))
    .sort((left, right) => right.value - left.value || left.text.localeCompare(right.text))
    .slice(0, 30);
}

function mean(values: number[]) {
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(2));
}

export async function getCourseBoundReviewDetail(input: {
  evaluationId: string;
  reviewerRole: Role;
}) {
  const session = await resolveAuthSession();

  if (!session) {
    return null;
  }

  const programScope = await resolveReviewerProgramScope({ reviewerRole: input.reviewerRole, userId: session.userId });

  const evaluation = await prisma.courseBoundEvaluation.findFirst({
    where: {
      id: input.evaluationId,
      ...(input.reviewerRole === "FACULTY" ? { faculty_id: session.userId } : {}),
      ...(programScope ? { program_id: { in: programScope } } : {}),
    },
    include: {
      course: true,
      program: true,
      responses: {
        where: { submitted_at: { not: null } },
        include: { qual_items: true, quant_items: true },
        orderBy: { submitted_at: "asc" },
      },
    },
  });

  if (!evaluation) {
    return null;
  }

  const questionGroups = new Map<string, number[]>();
  const sectionGroups = new Map<string, number[]>();

  for (const response of evaluation.responses) {
    for (const item of response.quant_items) {
      const questionKey = `${item.section_key}:${item.item_key}`;
      questionGroups.set(questionKey, [...(questionGroups.get(questionKey) ?? []), item.rating_value]);
      sectionGroups.set(item.section_key, [...(sectionGroups.get(item.section_key) ?? []), item.rating_value]);
    }
  }

  const allRatings = [...questionGroups.values()].flat();

  return {
    courseLabel: `${evaluation.course.code} - ${evaluation.course.title}`,
    evaluationId: evaluation.id,
    overview: {
      completionRate: 100,
      overallMean: allRatings.length > 0 ? mean(allRatings) : 0,
      responseCount: evaluation.responses.length,
    },
    programLabel: `${evaluation.program.code} - ${evaluation.program.name}`,
    questionMeans: [...questionGroups.entries()].map(([key, values]) => ({ key, label: key, mean: mean(values) })),
    responseCards: evaluation.responses.map((response, index) => ({
      label: `Respondent A${String(index + 1).padStart(2, "0")}`,
      overallMean: response.quant_items.length > 0 ? mean(response.quant_items.map((item) => item.rating_value)) : 0,
      responseId: response.id,
      submittedAt: response.submitted_at!,
    })),
    sectionMeans: [...sectionGroups.entries()].map(([key, values]) => ({ key, label: key, mean: mean(values) })),
    wordCloud: buildWordCloudWords(
      evaluation.responses.flatMap((response) => response.qual_items.map((item) => item.text_content)),
    ),
  };
}
```

Create `src/modules/analytics-reporting-and-review/services/get-course-bound-response-review.ts`:

```ts
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import { resolveReviewerProgramScope } from "@/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope";
import type { Role } from "@/lib/constants/roles";

function buildAnonymizedLabel(index: number) {
  return `Respondent A${String(index + 1).padStart(2, "0")}`;
}

export async function getCourseBoundResponseReview(input: {
  responseId: string;
  reviewerRole: Role;
}) {
  const session = await resolveAuthSession();

  if (!session) {
    return null;
  }

  const programScope = await resolveReviewerProgramScope({ reviewerRole: input.reviewerRole, userId: session.userId });

  const response = await prisma.response.findFirst({
    where: {
      id: input.responseId,
      assignment: {
        course_bound: {
          ...(input.reviewerRole === "FACULTY" ? { faculty_id: session.userId } : {}),
          ...(programScope ? { program_id: { in: programScope } } : {}),
        },
      },
    },
    include: {
      assignment: {
        include: {
          course_bound: {
            include: {
              course: true,
              responses: {
                where: { submitted_at: { not: null } },
                orderBy: { submitted_at: "asc" },
                select: { id: true },
              },
            },
          },
        },
      },
      qual_items: true,
      quant_items: true,
    },
  });

  if (!response?.assignment.course_bound || !response.submitted_at) {
    return null;
  }

  const siblingIds = response.assignment.course_bound.responses.map((item) => item.id);
  const reviewerIndex = siblingIds.indexOf(response.id);

  return {
    courseLabel: `${response.assignment.course_bound.course.code} - ${response.assignment.course_bound.course.title}`,
    label: buildAnonymizedLabel(reviewerIndex === -1 ? 0 : reviewerIndex),
    responseId: response.id,
    sections: [
      {
        key: "quantitative",
        title: "Quantitative Answers",
        answers: response.quant_items.map((item) => ({
          prompt: `${item.section_key}:${item.item_key}`,
          value: String(item.rating_value),
        })),
      },
      {
        key: "qualitative",
        title: "Qualitative Answers",
        answers: response.qual_items.map((item) => ({
          prompt: `${item.section_key}:${item.prompt_key}`,
          value: item.text_content,
        })),
      },
    ],
    submittedAt: response.submitted_at,
  };
}
```

- [ ] **Step 5: Run the analytics tests**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/analytics-reporting-and-review/list-course-bound-review-items.test.ts src/__tests__/modules/analytics-reporting-and-review/get-course-bound-review-detail.test.ts src/__tests__/modules/analytics-reporting-and-review/get-course-bound-response-review.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/modules/analytics-reporting-and-review/types.ts src/modules/analytics-reporting-and-review/services/list-course-bound-review-items.ts src/modules/analytics-reporting-and-review/services/get-course-bound-review-detail.ts src/modules/analytics-reporting-and-review/services/get-course-bound-response-review.ts src/__tests__/modules/analytics-reporting-and-review/list-course-bound-review-items.test.ts src/__tests__/modules/analytics-reporting-and-review/get-course-bound-review-detail.test.ts src/__tests__/modules/analytics-reporting-and-review/get-course-bound-response-review.test.ts
git commit -m "feat: add scoped course-bound analytics services"
```

## Task 5: Build Shared Review UI For Faculty, Program Head, And Dean

**Files:**
- Create: `src/components/course-bound-review/published-course-bound-list.tsx`
- Create: `src/components/course-bound-review/course-bound-review-tabs.tsx`
- Create: `src/components/course-bound-review/mean-bar-chart.tsx`
- Create: `src/components/course-bound-review/qualitative-word-cloud.tsx`
- Create: `src/components/course-bound-review/anonymized-response-cards.tsx`
- Create: `src/components/course-bound-review/anonymized-response-detail.tsx`
- Create: `src/app/(app)/faculty/cilo-evaluations/[evaluationId]/page.tsx`
- Create: `src/app/(app)/faculty/cilo-evaluations/[evaluationId]/responses/[responseId]/page.tsx`
- Create: `src/app/(app)/program-head/cilo-reviews/page.tsx`
- Create: `src/app/(app)/program-head/cilo-reviews/[evaluationId]/page.tsx`
- Create: `src/app/(app)/program-head/cilo-reviews/[evaluationId]/responses/[responseId]/page.tsx`
- Create: `src/app/(app)/dean/cilo-reviews/page.tsx`
- Create: `src/app/(app)/dean/cilo-reviews/[evaluationId]/page.tsx`
- Create: `src/app/(app)/dean/cilo-reviews/[evaluationId]/responses/[responseId]/page.tsx`
- Create: `src/__tests__/components/course-bound-review/course-bound-review-tabs.test.tsx`
- Create: `src/__tests__/app/reviewer-course-bound-pages.test.tsx`
- Modify: `src/app/(app)/program-head/dashboard/page.tsx`
- Modify: `src/app/(app)/dean/dashboard/page.tsx`

- [ ] **Step 1: Write the failing shared-review UI tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseBoundReviewTabs } from "@/components/course-bound-review/course-bound-review-tabs";

describe("CourseBoundReviewTabs", () => {
  it("renders overview, section analytics, responses, and word cloud tabs", () => {
    render(
      <CourseBoundReviewTabs
        basePath="/faculty/cilo-evaluations"
        detail={{
          courseLabel: "ITE 18 - Capstone 1",
          evaluationId: "evaluation-1",
          overview: { completionRate: 100, overallMean: 3.25, responseCount: 2 },
          programLabel: "BSIT - Bachelor of Science in Information Technology",
          questionMeans: [{ key: "teaching:teaching-1", label: "The instructor explained concepts clearly.", mean: 3 }],
          responseCards: [{ label: "Respondent A01", overallMean: 3.5, responseId: "response-1", submittedAt: new Date("2026-04-27T10:00:00.000Z") }],
          sectionMeans: [{ key: "teaching", label: "Teaching", mean: 3 }],
          wordCloud: [{ text: "clear", value: 2 }],
        }}
      />,
    );

    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /section analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /responses/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /word cloud/i })).toBeInTheDocument();
    expect(screen.getByText(/respondent a01/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/__tests__/components/course-bound-review/course-bound-review-tabs.test.tsx src/__tests__/app/reviewer-course-bound-pages.test.tsx
```

Expected: FAIL because the shared review components and pages do not exist yet.

- [ ] **Step 3: Implement the shared charts, word cloud, response cards, and route pages**

Create `src/components/course-bound-review/mean-bar-chart.tsx`:

```tsx
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MeanSeriesItem } from "@/modules/analytics-reporting-and-review/types";

export function MeanBarChart({ data, title }: { data: MeanSeriesItem[]; title: string }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="h-72 rounded-xl border border-border bg-surface p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 4]} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="mean" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
```

Create `src/components/course-bound-review/qualitative-word-cloud.tsx`:

```tsx
"use client";

import { ReactWordCloud } from "@isoterik/react-word-cloud";
import type { WordCloudWord } from "@/modules/analytics-reporting-and-review/types";

export function QualitativeWordCloud({ words }: { words: WordCloudWord[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <ReactWordCloud words={words.map((word) => ({ text: word.text, value: word.value }))} />
    </div>
  );
}
```

Create `src/components/course-bound-review/course-bound-review-tabs.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeanBarChart } from "@/components/course-bound-review/mean-bar-chart";
import { QualitativeWordCloud } from "@/components/course-bound-review/qualitative-word-cloud";
import { AnonymizedResponseCards } from "@/components/course-bound-review/anonymized-response-cards";

export function CourseBoundReviewTabs({
  basePath,
  detail,
}: {
  basePath: string;
  detail: any;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link href={basePath} className="text-sm font-semibold text-primary hover:underline">Back to Published Forms</Link>
        <h1 className="text-2xl font-black font-heading">{detail.courseLabel}</h1>
        <p className="text-sm text-text-muted">{detail.programLabel}</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="section-analytics">Section Analytics</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="word-cloud">Word Cloud</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs uppercase text-text-muted">Responses</p><p className="text-2xl font-black">{detail.overview.responseCount}</p></div>
            <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs uppercase text-text-muted">Completion Rate</p><p className="text-2xl font-black">{detail.overview.completionRate}%</p></div>
            <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs uppercase text-text-muted">Overall Mean</p><p className="text-2xl font-black">{detail.overview.overallMean}</p></div>
          </div>
          <MeanBarChart data={detail.sectionMeans} title="Section Means" />
        </TabsContent>

        <TabsContent value="section-analytics">
          <MeanBarChart data={detail.questionMeans} title="Question Means" />
        </TabsContent>

        <TabsContent value="responses">
          <AnonymizedResponseCards basePath={`${basePath}/${detail.evaluationId}/responses`} cards={detail.responseCards} />
        </TabsContent>

        <TabsContent value="word-cloud">
          <QualitativeWordCloud words={detail.wordCloud} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

Create `src/components/course-bound-review/published-course-bound-list.tsx`:

```tsx
import Link from "next/link";
import type { ReviewListItem } from "@/modules/analytics-reporting-and-review/types";

export function PublishedCourseBoundList({
  emptyMessage,
  items,
}: {
  emptyMessage: string;
  items: ReviewListItem[];
}) {
  if (items.length === 0) {
    return <div className="rounded-xl border border-dashed border-border p-8 text-sm text-text-muted">{emptyMessage}</div>;
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <Link key={item.evaluationId} href={item.href} className="rounded-xl border border-border bg-surface p-4 hover:border-primary/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold">{item.courseLabel}</h2>
              <p className="text-sm text-text-muted">{item.programLabel}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{item.responseCount} responses</p>
              <p className="text-text-muted">Open details</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

Create `src/components/course-bound-review/anonymized-response-cards.tsx`:

```tsx
import Link from "next/link";
import type { ResponseCard } from "@/modules/analytics-reporting-and-review/types";

export function AnonymizedResponseCards({
  basePath,
  cards,
}: {
  basePath: string;
  cards: ResponseCard[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article key={card.responseId} className="rounded-xl border border-border bg-surface p-4">
          <h3 className="font-bold">{card.label}</h3>
          <p className="text-sm text-text-muted">Submitted {card.submittedAt.toLocaleString()}</p>
          <p className="mt-2 text-sm font-semibold">Overall mean: {card.overallMean}</p>
          <Link href={`${basePath}/${card.responseId}`} className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
            View Response
          </Link>
        </article>
      ))}
    </div>
  );
}
```

Create `src/components/course-bound-review/anonymized-response-detail.tsx`:

```tsx
export function AnonymizedResponseDetail({ review }: { review: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black font-heading">{review.label}</h1>
        <p className="text-sm text-text-muted">{review.courseLabel}</p>
      </div>
      {review.sections.map((section: any) => (
        <section key={section.key} className="rounded-xl border border-border bg-surface p-4">
          <h2 className="font-bold">{section.title}</h2>
          <div className="mt-4 space-y-3">
            {section.answers.map((answer: any) => (
              <div key={`${section.key}-${answer.prompt}`}>
                <p className="text-sm font-semibold">{answer.prompt}</p>
                <p className="text-sm text-text-muted">{answer.value}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

Create `src/app/(app)/faculty/cilo-evaluations/[evaluationId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { ROLES } from "@/lib/constants/roles";
import { CourseBoundReviewTabs } from "@/components/course-bound-review/course-bound-review-tabs";
import { getCourseBoundReviewDetail } from "@/modules/analytics-reporting-and-review/services/get-course-bound-review-detail";

export default async function FacultyCourseBoundEvaluationDetailPage({ params }: { params: Promise<{ evaluationId: string }> }) {
  const { evaluationId } = await params;
  const detail = await getCourseBoundReviewDetail({ evaluationId, reviewerRole: ROLES.FACULTY });

  if (!detail) {
    notFound();
  }

  return <CourseBoundReviewTabs basePath="/faculty/cilo-evaluations" detail={detail} />;
}
```

Create `src/app/(app)/program-head/cilo-reviews/page.tsx`:

```tsx
import { PublishedCourseBoundList } from "@/components/course-bound-review/published-course-bound-list";
import { ROLES } from "@/lib/constants/roles";
import { listCourseBoundReviewItems } from "@/modules/analytics-reporting-and-review/services/list-course-bound-review-items";

export default async function ProgramHeadCiloReviewsPage() {
  const items = await listCourseBoundReviewItems({
    reviewerRole: ROLES.PROGRAM_HEAD,
    basePath: "/program-head/cilo-reviews",
  });

  return <PublishedCourseBoundList emptyMessage="No program-scoped CILO reviews yet." items={items} />;
}
```

Create `src/app/(app)/program-head/cilo-reviews/[evaluationId]/page.tsx` and `src/app/(app)/dean/cilo-reviews/[evaluationId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { ROLES } from "@/lib/constants/roles";
import { CourseBoundReviewTabs } from "@/components/course-bound-review/course-bound-review-tabs";
import { getCourseBoundReviewDetail } from "@/modules/analytics-reporting-and-review/services/get-course-bound-review-detail";

export default async function ProgramHeadCourseBoundReviewDetailPage({ params }: { params: Promise<{ evaluationId: string }> }) {
  const { evaluationId } = await params;
  const detail = await getCourseBoundReviewDetail({ evaluationId, reviewerRole: ROLES.PROGRAM_HEAD });

  if (!detail) {
    notFound();
  }

  return <CourseBoundReviewTabs basePath="/program-head/cilo-reviews" detail={detail} />;
}
```

```tsx
import { notFound } from "next/navigation";
import { ROLES } from "@/lib/constants/roles";
import { CourseBoundReviewTabs } from "@/components/course-bound-review/course-bound-review-tabs";
import { getCourseBoundReviewDetail } from "@/modules/analytics-reporting-and-review/services/get-course-bound-review-detail";

export default async function DeanCourseBoundReviewDetailPage({ params }: { params: Promise<{ evaluationId: string }> }) {
  const { evaluationId } = await params;
  const detail = await getCourseBoundReviewDetail({ evaluationId, reviewerRole: ROLES.DEAN });

  if (!detail) {
    notFound();
  }

  return <CourseBoundReviewTabs basePath="/dean/cilo-reviews" detail={detail} />;
}
```

Create one role-specific response page pattern, then apply it to faculty, program-head, and dean:

```tsx
import { notFound } from "next/navigation";
import { ROLES } from "@/lib/constants/roles";
import { AnonymizedResponseDetail } from "@/components/course-bound-review/anonymized-response-detail";
import { getCourseBoundResponseReview } from "@/modules/analytics-reporting-and-review/services/get-course-bound-response-review";

export default async function FacultyAnonymizedResponsePage({ params }: { params: Promise<{ responseId: string }> }) {
  const { responseId } = await params;
  const review = await getCourseBoundResponseReview({ responseId, reviewerRole: ROLES.FACULTY });

  if (!review) {
    notFound();
  }

  return <AnonymizedResponseDetail review={review} />;
}
```

Update `src/app/(app)/program-head/dashboard/page.tsx` and `src/app/(app)/dean/dashboard/page.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProgramHeadDashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Program Head Dashboard</h1>
        <p className="text-sm text-text-muted">Review BSIT-scoped Post-Term CILO results and anonymized responses.</p>
      </div>
      <Button asChild><Link href="/program-head/cilo-reviews">Open CILO Reviews</Link></Button>
    </div>
  );
}
```

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DeanDashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dean Dashboard</h1>
        <p className="text-sm text-text-muted">Review college-wide Post-Term CILO analytics with anonymized response drill-down.</p>
      </div>
      <Button asChild><Link href="/dean/cilo-reviews">Open CILO Reviews</Link></Button>
    </div>
  );
}
```

- [ ] **Step 4: Run the shared-review UI tests**

Run:

```bash
pnpm exec vitest run src/__tests__/components/course-bound-review/course-bound-review-tabs.test.tsx src/__tests__/app/reviewer-course-bound-pages.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/course-bound-review/published-course-bound-list.tsx src/components/course-bound-review/course-bound-review-tabs.tsx src/components/course-bound-review/mean-bar-chart.tsx src/components/course-bound-review/qualitative-word-cloud.tsx src/components/course-bound-review/anonymized-response-cards.tsx src/components/course-bound-review/anonymized-response-detail.tsx src/app/(app)/faculty/cilo-evaluations/[evaluationId]/page.tsx src/app/(app)/faculty/cilo-evaluations/[evaluationId]/responses/[responseId]/page.tsx src/app/(app)/program-head/cilo-reviews/page.tsx src/app/(app)/program-head/cilo-reviews/[evaluationId]/page.tsx src/app/(app)/program-head/cilo-reviews/[evaluationId]/responses/[responseId]/page.tsx src/app/(app)/dean/cilo-reviews/page.tsx src/app/(app)/dean/cilo-reviews/[evaluationId]/page.tsx src/app/(app)/dean/cilo-reviews/[evaluationId]/responses/[responseId]/page.tsx src/__tests__/components/course-bound-review/course-bound-review-tabs.test.tsx src/__tests__/app/reviewer-course-bound-pages.test.tsx src/app/(app)/program-head/dashboard/page.tsx src/app/(app)/dean/dashboard/page.tsx
git commit -m "feat: add shared reviewer analytics and response pages"
```

## Task 6: Run The Full Verification And Browser Demo Flow

**Files:**
- Verify: `supabase/migrations/20260421103000_add_outline_defense_scope_and_targets.sql`
- Verify: `src/modules/deployments-and-targeting/services/publish-course-bound-evaluation.ts`
- Verify: `src/modules/analytics-reporting-and-review/services/get-course-bound-review-detail.ts`
- Verify: `src/app/(app)/faculty/cilo-evaluations/[evaluationId]/page.tsx`
- Verify: `src/app/(app)/program-head/cilo-reviews/[evaluationId]/page.tsx`
- Verify: `src/app/(app)/dean/cilo-reviews/[evaluationId]/page.tsx`

- [ ] **Step 1: Run the focused Vitest suite for the entire slice**

Run:

```bash
pnpm exec vitest run src/__tests__/modules/academic-catalog-and-context/resolve-reviewer-program-scope.test.ts src/__tests__/modules/deployments-and-targeting/list-faculty-course-contexts.test.ts src/__tests__/modules/deployments-and-targeting/publish-course-bound-evaluation.test.ts src/__tests__/modules/analytics-reporting-and-review/list-course-bound-review-items.test.ts src/__tests__/modules/analytics-reporting-and-review/get-course-bound-review-detail.test.ts src/__tests__/modules/analytics-reporting-and-review/get-course-bound-response-review.test.ts src/__tests__/components/faculty/publish-course-bound-evaluation-form.test.tsx src/__tests__/components/course-bound-review/course-bound-review-tabs.test.tsx src/__tests__/app/reviewer-course-bound-pages.test.tsx src/__tests__/app/student-evaluation-pages.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run the production build**

Run:

```bash
pnpm build
```

Expected: Next.js build succeeds without route or client-component errors.

- [ ] **Step 3: Recheck linked Supabase migration state**

Run:

```bash
pnpm supabase:migration:list
pnpm supabase:push:dry-run
```

Expected:

- the new migration appears in the linked list
- dry run reports no unexpected unapplied changes

- [ ] **Step 4: Start the app for browser verification**

Run:

```bash
pnpm dev
```

Expected: local Next.js dev server starts successfully.

- [ ] **Step 5: Verify the outline-defense browser flow with Chrome DevTools MCP**

Use Chrome DevTools MCP to walk this exact path:

1. Sign in as the faculty demo account.
2. Open `/faculty/cilo-evaluations/new`.
3. Publish one Post-Term CILO evaluation for the BSIT 4th Year target.
4. Sign in as the student demo account.
5. Confirm the new assignment appears on `/student/evaluations`.
6. Submit one full response including a qualitative comment.
7. Sign back in as the faculty demo account and open the published form detail page.
8. Confirm the overview mean cards, section/question charts, word cloud, and anonymized `Responses` tab render.
9. Open one anonymized response page and confirm no respondent identity appears.
10. Repeat as the program-head demo account and confirm only BSIT-scoped results appear.
11. Repeat as the dean demo account and confirm the same review UI appears with broader scope.

Expected: the complete vertical slice works in the browser and matches the approved spec.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml prisma/schema.prisma prisma/seed.ts scripts/bootstrap-outline-defense-demo.ts src/types/supabase-database.ts src/lib/constants/navigation.ts src/components/layout/sidebar.tsx src/components/layout/mobile-nav.tsx src/modules src/components/faculty src/components/course-bound-review src/app/(app)/faculty src/app/(app)/program-head src/app/(app)/dean src/__tests__ supabase/migrations/20260421103000_add_outline_defense_scope_and_targets.sql
git commit -m "feat: ship outline-defense course-bound analytics slice"
```

## Self-Review Checklist

- Spec coverage:
  - reviewer scope tables and program scoping are handled in Task 1
  - faculty publishing and target persistence are handled in Tasks 2 and 3
  - student assignment reuse is handled in Task 2
  - mean-based analytics and word cloud are handled in Task 4
  - tabbed review UI and anonymized response drill-down are handled in Task 5
  - Supabase CLI and browser verification are handled in Task 6

- Placeholder scan:
  - no `TBD`, `TODO`, or unnamed files remain
  - migration file path and timestamp are fixed
  - dependency list is explicit

- Type consistency:
  - `PublishCourseBoundEvaluationInput` is used consistently by the action, form, and service
  - `resolveReviewerProgramScope` always returns `string[] | null`
  - reviewer pages all call the same analytics services with `reviewerRole`
