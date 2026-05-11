# School Year + Course Assignment — Phased Implementation Plan (Clean-Code Edition)

A nine-phase, end-to-end rollout that introduces a school-year/term backbone, per-term student enrollment ledger, and a Program-Head-driven course-assignment module, while enforcing a strict layered architecture, component reuse, and clean-code standards across every phase.

> Companion to `school-year-and-course-assignment-9c41dd.md` (architecture/decisions). Supersedes the earlier phased draft (`-9c41dd.md`).

---

## 0. Engineering Standards (Apply To Every Phase)

These standards are mandatory and not optional shortcuts. Each phase's PR must satisfy them before moving on.

### 0.1 Layered Architecture (strict 4-layer)

```
Prisma schema  →  feature services  →  server actions  →  UI components/pages
                                          ↑
                                   zod schemas (shared)
```

- **Schema layer** (`prisma/schema.prisma`, `supabase/migrations/**`): owns persistence and indexes. No business rules.
- **Service layer** (`src/features/<domain>/services/**`): the only place that imports `prisma`. Each function returns a discriminated `ServiceResult<T>` (`{ success: true; data } | { success: false; error }`). Services validate authorization via `resolveAuthSession` + role gates and enforce business rules.
- **Action layer** (`src/lib/actions/**`): thin server actions; parse input with zod (the same schema used by the form), delegate to services, translate to client payloads. No DB calls. No conditional business logic.
- **Component layer** (`src/features/<domain>/components/**` and `src/app/(app)/**/page.tsx`): receives data via props, calls server actions only. Server components may call services *only for read-only queries*; mutations always go through actions.
- **Schema layer** (`src/features/<domain>/schemas/**`): single zod source for both server action validation and `customZodResolver` form binding (per `AGENTS.md` Turbopack/Zod 4 quirk).

### 0.2 Naming, Single Responsibility, File Size

- One exported responsibility per service file (`create-x.ts`, `list-x.ts`, `archive-x.ts`); colocate small private helpers.
- Components ≤ ~250 LOC. Extract sub-components when a JSX subtree has its own state or repeats.
- File names kebab-case; types and components PascalCase; functions camelCase. No abbreviations beyond `id`.
- No "manager" or "helper" god-files; if a file's name needs "and" to describe it, split it.

### 0.3 No Hardcoding (Pragmatic Centralization)

- Enums (semester/term/year-level/section, role lists), policy thresholds, default page sizes, sort orders, and lookup-table options live in `src/lib/constants/**` or a new `src/features/academic-calendar/policies.ts`. Reuse them everywhere.
- Acceptable to inline user-facing copy (toasts, empty states) next to the component for now; do not invent a parallel "labels" module unless reused 3+ times.
- DateTime formatting goes through one helper module (no scattered `toLocaleString` ad-hoc options).
- Magic numbers prohibited (no `slice(0, 50)` without an explanation constant).

### 0.4 UI Component Reuse (No Reinventing)

- Always reuse the existing primitives in `@/components/ui/**` (`Button`, `Input`, `Label`, `Select`, `Dialog`, `Sheet`, `Tabs`, `Table`, `Badge`, `Card`, `Alert`, `DropdownMenu`, `Checkbox`, `Switch`, `Tooltip`, `Skeleton`, `RadioGroup`, `Progress`, `Toast`).
- Stepped flows reuse the existing wizard/form patterns (`WizardShell`-style layout, `Sheet`-based side panels, `Dialog`-based modals). Build a small `TermInstancePicker`, `ClassIdentityPicker`, `FacultySearchPopover` once, then reuse across PH, Faculty, and Admin screens.
- No raw `<table>` or `<button>` markup — use the UI library.
- No copy-pasted JSX between phases: when the same pattern (filter bar, status pill, empty state) appears twice, lift to `src/features/<domain>/components/shared/`.
- Tailwind styling only via design tokens already in use (`text-text-secondary`, `bg-surface`, etc.); no inline arbitrary hex values.

### 0.5 Performance & Correctness

- Add the indexes listed per phase before shipping list pages; verify with `EXPLAIN` for any query expected to scale (>10k rows).
- Server-side queries select only the columns the UI needs (`select: { ... }`), never `findMany()` without projection on hot paths.
- `resolveActiveTerm()` uses `React.cache` to deduplicate per request.
- Prisma writes that span multiple tables run inside `prisma.$transaction` with a single rollback boundary. The rollover job is idempotent and safe to retry.
- All booleans default explicitly in DB (no implicit nulls for `is_active`).
- Date ranges always exclusive on the upper bound; comparisons via UTC.

### 0.6 Authorization & Auditing

- Every service mutation calls `resolveAuthSession()` and asserts the required role(s) before any DB write.
- Audit fields: `course_assignments.assigned_by`, `student_enrollments.source`, `school_years.archived_by` (added below) populated by services, never by callers.
- Cross-program operations (e.g., PH assigning a faculty from a different program) require the affected program to be in PH scope; all other paths return `{ success: false, error }`.

### 0.7 Testing Discipline (Vitest Only)

- Each phase ships with:
  - Unit tests for new services (success + at least one negative path each).
  - Integration tests for new server actions (input validation + role gating).
  - Component tests for new interactive components (Testing Library: render → interact → assert; no snapshots).
  - Regression tests around any code path the phase rewires (publish flows, onboarding).
- Tests never reach across layers (a service test does not start an app shell; a component test does not hit Prisma).
- Targeted commands listed per phase. Each phase ends with a green `pnpm lint && pnpm test && pnpm build`.

### 0.8 Migration Discipline

- Follow the canonical workflow in `AGENTS.md`: edit `prisma/schema.prisma` → `pnpm supabase:migration:diff -- <name>` → review SQL → `pnpm supabase:push:dry-run` → `pnpm supabase:push` → `pnpm supabase:types`.
- Constraints not expressible in Prisma (NULLS NOT DISTINCT, partial unique) live in the SQL migration with a comment cross-referencing the Prisma `@@index` placeholder.
- New columns added in additive phases are nullable; tightening to NOT NULL happens only after backfill verification.
- Every migration is rehearsed by running `pnpm db:seed` from a clean local database before merging.

### 0.9 Definition of Done (Per Phase)

A phase is done only if all are true:
1. Prisma schema + Supabase migration applied locally and via dry-run.
2. Generated `src/types/supabase-database.ts` updated.
3. New/changed services + actions + components landed with tests.
4. `pnpm lint` clean (no warnings introduced).
5. `pnpm test` green.
6. `pnpm build` succeeds (Next typecheck passes).
7. App is shippable: existing flows untouched still pass.
8. Brief PR notes call out any deferred work and link to the phase that picks it up.

---

## Phase 0 — Foundations (Constants, Types, Helpers)

**Goal**: prepare shared primitives the later phases depend on, with zero behavior change.

**End-to-end deliverable**: helpers + types + tests merged; nothing user-visible.

### Files

- `[NEW] src/lib/constants/academic-period.ts`
  - `formatSchoolYearCode(start: number)` → `"2025-2026"`.
  - `parseSchoolYearCode(code: string)` → `{ startYear, endYear } | null`.
  - `assertValidSemesterTerm(semester, term)` policy — Summer must have `term = null`; otherwise term must be set.
  - `ALLOWED_SEMESTER_TERM_PAIRS` — typed lookup table consumed by zod schemas and the term-instance form.
- `[NEW] src/lib/constants/page-sizes.ts` — `DEFAULT_TABLE_PAGE_SIZE`, `MAX_TABLE_PAGE_SIZE` (used by all new list services to avoid magic numbers).
- `[NEW] src/lib/utils/date-format.ts` — `formatTermInstanceLabel`, `formatSchoolYearRange`. Replaces ad-hoc string building.
- `[NEW] src/features/academic-calendar/types.ts` — `SchoolYearItem`, `TermInstanceItem`, `ActiveTermContext`, `TermInstanceLabelParts`.
- `[NEW] src/features/academic-calendar/policies.ts` — pure policy predicates: `canArchiveSchoolYear`, `canSetActive`, `canDeleteTermInstance`. Imported by services and components.

### Modified

- `[MOD] src/lib/constants/academic.ts` — re-export shared helpers from `academic-period.ts` so existing imports keep working without duplication.

### Tests

- `[NEW] src/__tests__/lib/constants/academic-period.test.ts`.
- `[NEW] src/__tests__/lib/utils/date-format.test.ts`.
- `[NEW] src/__tests__/features/academic-calendar/policies.test.ts`.

### Verification

`pnpm lint && pnpm vitest run src/__tests__/lib src/__tests__/features/academic-calendar && pnpm build`.

---

## Phase 1 — School Year + Active Term Resolver + Admin UI

**Goal**: ship Admin SY/term management end-to-end, plus the active-term resolver consumed for *defaults only*.

### Schema

- `[MOD] prisma/schema.prisma`
  - `model SchoolYear` (`id`, `code` unique, `start_date`, `end_date`, `is_archived`, `archived_by` (User?), `archived_at`, timestamps).
  - `model AcademicTermInstance` (`id`, `school_year_id`, `semester`, `term?`, `start_date?`, `end_date?`, `is_active`, timestamps).
  - Unique `(school_year_id, semester, term)` mirrored as `@@index` (NULLS NOT DISTINCT enforced in SQL).
- Migration: `add_school_year_and_term_instance.sql`
  - `CREATE TABLE` for both.
  - `CREATE UNIQUE INDEX ... ON academic_term_instances (school_year_id, semester, term) NULLS NOT DISTINCT`.
  - `CREATE UNIQUE INDEX one_active_term_instance ON academic_term_instances (is_active) WHERE is_active = true`.
- Regenerate types via `pnpm supabase:types`.

### Services (Phase 1)

- `[NEW] src/features/academic-calendar/schemas/school-year.ts` — zod for create/update/archive.
- `[NEW] src/features/academic-calendar/schemas/term-instance.ts` — zod with `superRefine` calling `assertValidSemesterTerm`.
- `[NEW] src/features/academic-calendar/services/manage-school-years.ts` — `createSchoolYear`, `updateSchoolYear`, `archiveSchoolYear`. Single responsibility per export.
- `[NEW] src/features/academic-calendar/services/manage-term-instances.ts` — `addTermInstance`, `updateTermInstance`, `deleteTermInstance`, `setActiveTermInstance` (transactional flip).
- `[NEW] src/features/academic-calendar/services/list-school-years.ts` — paginated list with term children and active flag.
- `[NEW] src/features/academic-calendar/services/resolve-active-term.ts`
  - `resolveActiveTerm()` wrapped in `React.cache` for per-request memoization.
  - Returns `ActiveTermContext | null`.

### Server Actions

- `[NEW] src/lib/actions/admin-school-year-actions.ts` — `createSchoolYearAction`, `updateSchoolYearAction`, `archiveSchoolYearAction`, `addTermInstanceAction`, `updateTermInstanceAction`, `deleteTermInstanceAction`, `setActiveTermInstanceAction`. Each is a one-liner that parses zod + role-gates Admin + calls service.

### Components

Reuse `Card`, `Table`, `Dialog`, `Sheet`, `Form` primitives. Forms use `customZodResolver`.

- `[NEW] src/features/academic-calendar/components/school-year-list.tsx` — table with filters (active/archived), row expansion to show term instances; integrates `ActiveTermBadge`.
- `[NEW] src/features/academic-calendar/components/school-year-form.tsx` — create/edit; uses zod schema + `customZodResolver`.
- `[NEW] src/features/academic-calendar/components/term-instance-form.tsx` — disables `term` when semester is Summer (driven by `ALLOWED_SEMESTER_TERM_PAIRS`).
- `[NEW] src/features/academic-calendar/components/term-instance-picker.tsx` — **shared primitive** consumed by Phases 4–7 (PH, faculty, central deployment forms). Default = active term. Single source for the picker UX.
- `[NEW] src/features/academic-calendar/components/active-term-badge.tsx` — small badge usable in the topbar and dashboard heroes.
- `[NEW] src/features/academic-calendar/components/set-active-term-dialog.tsx` — confirmation pattern via existing `Dialog`.

### Pages

- `[NEW] src/app/(app)/admin/school-years/page.tsx` — server component, queries `listSchoolYears`, renders `SchoolYearList`.
- `[NEW] src/app/(app)/admin/school-years/new/page.tsx`.
- `[NEW] src/app/(app)/admin/school-years/[id]/page.tsx`.

### Modified (read-side surfaces)

- `[MOD] src/lib/constants/navigation.ts` — extend `ADMIN_NAV` with `{ name: "School Years", href: "/admin/school-years", icon: CalendarRange }` (icon imported alongside the existing `lucide-react` usage; no duplicates).
- `[MOD] src/components/layout/topbar.tsx` — render `ActiveTermBadge` for Admin/Dean/PH/Faculty (driven by role; no hardcoding).
- `[MOD] src/types/supabase-database.ts` — regenerated.

### Tests

- `[NEW] src/__tests__/modules/academic-calendar/manage-school-years.test.ts`.
- `[NEW] src/__tests__/modules/academic-calendar/manage-term-instances.test.ts` — set-active flips exactly one row; partial-unique enforced.
- `[NEW] src/__tests__/modules/academic-calendar/resolve-active-term.test.ts`.
- `[NEW] src/__tests__/components/admin/school-year-list.test.tsx`.
- `[NEW] src/__tests__/components/admin/term-instance-form.test.tsx` — Summer disables term.
- `[NEW] src/__tests__/components/shared/term-instance-picker.test.tsx` — default = active term.

### Verification

`pnpm supabase:push:dry-run && pnpm supabase:push && pnpm supabase:types && pnpm lint && pnpm test && pnpm build`.

---

## Phase 2 — Student Enrollment Ledger + Onboarding & Admin Wiring

**Goal**: stand up `student_enrollments` and start writing rows on student onboarding and admin user edits. Profile remains source-of-truth for now.

### Schema

- `[MOD] prisma/schema.prisma`
  - `enum EnrollmentSource { ONBOARDING ROLLOVER ADMIN }`.
  - `model StudentEnrollment` (`id`, `student_user_id`, `term_instance_id`, `program_id`, `major_id?`, `year_level`, `section?`, `source`, `is_active`, `created_by` (User?), timestamps).
  - Unique `(student_user_id, term_instance_id)`; index `(term_instance_id, program_id, year_level, section)`.
- Migration: `add_student_enrollments.sql`.

### Services

- `[NEW] src/features/enrollments/schemas/enrollment.ts` — `upsertEnrollmentSchema`, `adminUpsertEnrollmentSchema`.
- `[NEW] src/features/enrollments/services/manage-student-enrollments.ts`
  - `upsertEnrollmentForActiveTerm` — used by onboarding + admin-user editor.
  - `adminUpsertEnrollment` — Admin can target any term.
  - `deactivateEnrollment` — soft delete (preserve history).
- `[NEW] src/features/enrollments/services/list-enrollments.ts`
  - `listEnrollmentsForUser`, `listEnrollmentsForTerm` (paginated, projected columns only).
- `[NEW] src/features/enrollments/services/list-students-for-class.ts`
  - Pure helper used in Phases 6–7 publish flows: `({ termInstanceId, programId, yearLevel, section?, majorId? }) → StudentRecord[]`.

### Server Actions

- `[NEW] src/lib/actions/enrollment-actions.ts` — Admin-gated CRUD; thin pass-through.

### Components

- `[NEW] src/features/enrollments/components/student-enrollment-history.tsx` — embedded under the admin user editor, reuses `Table`.
- `[NEW] src/features/enrollments/components/enrollment-editor-dialog.tsx` — uses `Dialog`, `TermInstancePicker`, year-level/section selects from constants.

### Modified

- `[MOD] src/lib/actions/onboarding-actions.ts`
  - `[REMOVE-CODE]` calendar-month AY heuristic + TODO comment about "naive calendar-year logic".
  - Resolve via `resolveActiveTerm()`.
  - Inside the existing `prisma.$transaction`, also call `upsertEnrollmentForActiveTerm` with `source = ONBOARDING`.
- `[MOD] src/features/users/services/manage-users.ts` (`upsertStudentAcademicContext`)
  - After profile upsert, upsert active-term enrollment.
  - `deleteStudentAcademicContext`: also deactivate (not delete) enrollments.
- `[MOD] src/features/users/components/<student-academic-context-section>.tsx` — embed `StudentEnrollmentHistory` and `EnrollmentEditorDialog`.
- `[MOD] src/types/supabase-database.ts` regenerated.

### Tests

- `[NEW] src/__tests__/modules/enrollments/manage-student-enrollments.test.ts`.
- `[NEW] src/__tests__/modules/enrollments/list-students-for-class.test.ts`.
- `[MOD] src/__tests__/app/onboarding-actions.test.ts` (or `[NEW]`) — onboarding creates profile **and** active-term enrollment in one transaction; rejects when no active term.
- `[NEW] src/__tests__/components/admin/enrollment-editor-dialog.test.tsx`.

### Verification

Migration + types + `pnpm lint && pnpm test && pnpm build`.

---

## Phase 3 — Course Assignment Schema + Services

**Goal**: introduce `course_assignments` and the services PH/Faculty UIs will consume. No new UI besides server actions.

### Schema

- `[MOD] prisma/schema.prisma`
  - `model CourseAssignment` (`id`, `term_instance_id`, `faculty_id`, `course_id`, `program_id`, `year_level`, `section?`, `assigned_by`, `is_active`, timestamps).
  - Unique `(term_instance_id, course_id, faculty_id, program_id, year_level, section)` (NULLS NOT DISTINCT in SQL; mirrored as `@@index`).
  - Indexes `(term_instance_id, faculty_id)` and `(term_instance_id, course_id)`.
- Migration: `add_course_assignments.sql`.

### Services

- `[NEW] src/features/course-assignments/types.ts`.
- `[NEW] src/features/course-assignments/schemas/course-assignment.ts`.
- `[NEW] src/features/course-assignments/policies.ts` — `canManageCourseAssignment(session, course, programId)`. Centralizes the cross-program rule (PH manages courses in their program scope or GE; faculty target may be any active faculty).
- `[NEW] src/features/course-assignments/services/manage-course-assignments.ts`
  - `createCourseAssignment`, `updateCourseAssignment`, `deactivateCourseAssignment`, `bulkCreateCourseAssignments` (uses `prisma.$transaction`, reports per-row errors).
- `[NEW] src/features/course-assignments/services/list-course-assignments-for-program-head.ts`
  - Filters: `termInstanceId`, `courseId`, `facultyId`, `programId`, `yearLevel`, `section`. Paginated. Returns hydrated rows (course code/title, faculty name/email, program code, "last term taught" hint).
- `[NEW] src/features/course-assignments/services/list-course-assignments-for-faculty.ts`
  - Faculty's own assignments grouped by course with class identity badges.
- `[NEW] src/features/course-assignments/services/search-faculty-pool.ts`
  - Cross-program faculty search by name/email (paginated, capped via `MAX_TABLE_PAGE_SIZE`); returns affiliations as a hint only.

### Server Actions

- `[NEW] src/lib/actions/course-assignment-actions.ts` — thin wrappers; PH-gated.

### Tests

- `[NEW] src/__tests__/modules/course-assignments/manage-course-assignments.test.ts`
  - Uniqueness with null section.
  - Cross-program faculty allowed.
  - PH cannot manage courses outside scope (except GE).
  - Bulk create rolls back on first invalid row.
- `[NEW] src/__tests__/modules/course-assignments/list-course-assignments-for-faculty.test.ts`.
- `[NEW] src/__tests__/modules/course-assignments/search-faculty-pool.test.ts`.

### Verification

Migration + types + `pnpm lint && pnpm test && pnpm build`.

---

## Phase 4 — Program Head Course Assignment UI (Both Surfaces)

**Goal**: ship the dedicated page and the inline panel together, both backed by Phase 3 services. No duplication; one shared component layer.

### Components (shared, reused across both surfaces)

- `[NEW] src/features/course-assignments/components/shared/assignment-filters.tsx` — combobox bar (term picker, course, faculty, program, year level, section). Reuses `TermInstancePicker` and existing `Select`/`Combobox` primitives.
- `[NEW] src/features/course-assignments/components/shared/class-identity-fields.tsx` — `(program, year_level, section)` selectors driven by enums + active program scope. Used in both the dialog and bulk helpers.
- `[NEW] src/features/course-assignments/components/shared/faculty-search-popover.tsx` — debounced search, accessible combobox, "primary affiliation" hint, "different program" warning chip.
- `[NEW] src/features/course-assignments/components/course-assignment-form-dialog.tsx` — stepper using existing `Dialog` primitives:
  1. Term instance (default active)
  2. Course (PH-scoped)
  3. Class identity (`ClassIdentityFields`)
  4. Faculty (`FacultySearchPopover`) + cross-program confirmation step
- `[NEW] src/features/course-assignments/components/course-assignments-table.tsx` — server-paginated; uses `Table` + status pills (Badge).
- `[NEW] src/features/course-assignments/components/course-row-assignments-sheet.tsx` — uses existing `Sheet` for the inline panel.
- `[NEW] src/features/course-assignments/components/bulk-helpers/add-courses-for-class-dialog.tsx`.
- `[NEW] src/features/course-assignments/components/bulk-helpers/add-classes-for-faculty-dialog.tsx`.

### Pages

- `[NEW] src/app/(app)/program-head/course-assignments/page.tsx` — server component composes `AssignmentFilters` + `CourseAssignmentsTable`.

### Modified

- `[MOD] src/features/academic-structure/components/program-head-courses-catalog.tsx`
  - Add a top-level `TermInstancePicker` (defaults to active).
  - Add an "Assign Faculty" row action that opens `CourseRowAssignmentsSheet`.
  - Extract any newly duplicated filter UI into the shared module above.
- `[MOD] src/lib/constants/navigation.ts` — extend `PROGRAM_HEAD_NAV` with `{ name: "Course Assignments", href: "/program-head/course-assignments", icon: UsersRound }` between "Courses" and "CILO Reviews".

### Tests

- `[NEW] src/__tests__/components/program-head/course-assignments-table.test.tsx`.
- `[NEW] src/__tests__/components/program-head/course-assignment-form-dialog.test.tsx` — stepper validation, summer-no-term, cross-program confirmation.
- `[NEW] src/__tests__/components/program-head/course-row-assignments-sheet.test.tsx`.
- `[NEW] src/__tests__/components/program-head/bulk-helpers/*.test.tsx`.

### Verification

`pnpm lint && pnpm test && pnpm build`.

---

## Phase 5 — Faculty: CILOs and Tools Rewire (Read-Side)

**Goal**: faculty's "Manage CILOs" and Tools pages list courses based on `CourseAssignment` instead of program affiliation; shared CILO bank semantics preserved.

### Modified services

- `[MOD] src/features/evaluations/services/list-faculty-courses-with-cilos.ts`
  - Replace the affiliation lookup with a join through `course_assignments` filtered by `term_instance_id` (default active).
  - Project only the columns the UI needs.
- `[MOD] src/features/evaluations/services/list-faculty-course-contexts.ts`
  - Build contexts from assignments rather than the affiliation × course Cartesian product.
  - Return one context per assignment so the GE multi-program case yields three rows.
  - `[REMOVE-CODE]` the legacy Cartesian-product code block once tests are green.

### Modified pages/components

- `[MOD] src/app/(app)/faculty/cilos/page.tsx`
  - Accept a `termInstance` search param; default to active.
  - Pass to the service and the new filter component.
- `[MOD] src/features/evaluations/components/faculty-cilos-course-list.tsx`
  - Insert `TermInstancePicker` at the top.
  - Render class-identity badges per course row when multiple assignments exist.
  - Reuse `Badge`, `Card`, `Skeleton` primitives; no fresh markup.
- `[MOD] src/app/(app)/faculty/cilo-evaluations/new/page.tsx`
  - `[REMOVE-CODE]` the local `deriveCurrentAcademicYear()` helper.
  - Use `resolveActiveTerm()` for defaults.
- `[MOD] src/app/(app)/faculty/cilos/new/page.tsx` and the `add-cilo-form` — list courses filtered by assignments through the shared service.

### Tests

- `[MOD] src/__tests__/modules/evaluations/list-faculty-course-contexts.test.ts`.
- `[MOD] src/__tests__/modules/evaluations/list-faculty-courses-with-cilos.test.ts`.
- `[MOD] src/__tests__/components/faculty/cilos/faculty-cilos-course-list.test.tsx` — term picker behavior; GE multi-program duplication.

### Verification

Targeted vitest then full suite, then `pnpm build`.

---

## Phase 6 — Faculty: Publish Course-Bound Evaluation Rewire

**Goal**: replace free-text AY + multi-select program/year-level inputs with a class-assignment picker. Recipients come from `student_enrollments`.

### Schema

- `[MOD] prisma/schema.prisma` (`CourseBoundEvaluation`)
  - Add `term_instance_id` (nullable in this phase).
  - Add `course_assignment_id` (nullable; back-reference for analytics).
- Migration: `link_course_bound_evaluation_to_term_instance.sql`.

### Modified services

- `[MOD] src/features/evaluations/services/preview-course-bound-respondents.ts`
  - Accept `assignmentId`; resolve term + class identity from it; query `list-students-for-class`.
- `[MOD] src/features/evaluations/services/publish-course-bound-evaluation.ts`
  - Accept `assignmentId`; populate `term_instance_id` + `course_assignment_id` in addition to legacy text fields (Phase 1 compatibility).
  - Replace `prisma.studentAcademicProfile.findMany(...)` recipient lookup with the enrollment-driven helper.
  - Update unique-constraint-violation messaging to reference the assignment context.

### Modified action layer

- `[MOD] src/lib/actions/course-bound-evaluation-actions.ts` — new payload shape; preserve toast/redirect contract; thin wrapper only.

### Modified types/schemas

- `[MOD] src/features/evaluations/types.ts`
  - `PublishCourseBoundEvaluationInput` becomes `{ assignmentId, deploymentName, activationAt?, deadlineAt?, respondentIds?, templateId }`.
  - Mark legacy fields `@deprecated`; action layer ignores them.
- `[MOD] src/features/evaluations/schemas/...` — zod accepts new shape; `customZodResolver` consumes the same schema in the form.

### Components

- `[NEW] src/features/evaluations/components/assignment-picker.tsx` — dropdown over the faculty's assignments for a term, showing class identity. Reuses `Select`/`Combobox` + the shared `class-identity-fields` formatter for consistent labels.

### Modified components

- `[MOD] src/features/evaluations/components/publish-course-bound-evaluation-form.tsx`
  - `[REMOVE-CODE]` `academicYear` text input, `semester`, `term`, `selectedYearLevel`, `selectedProgramIds` state, multi-program checkbox group, and the regex `YYYY-YYYY` validator.
  - Add `selectedAssignmentId` state and render `AssignmentPicker`.
  - Class identity becomes a read-only summary `Card` derived from the chosen assignment.
- `[MOD] src/app/(app)/faculty/cilo-evaluations/new/page.tsx`
  - Simplified: render the assignment-driven form; no longer pre-fetches `availablePrograms` for GE multi-select.
  - `[REMOVE-CODE]` GE multi-program prefetch block.

### Tests

- `[MOD] src/__tests__/modules/evaluations/preview-course-bound-respondents.test.ts`.
- `[MOD] src/__tests__/modules/evaluations/publish-course-bound-evaluation.test.ts` — new shape; legacy fields still written; `term_instance_id` populated; recipients come from enrollments.
- `[MOD] src/__tests__/components/faculty/publish-course-bound-evaluation-form.test.tsx` — assignment picker; absence of free-text AY field; preview/exclude path still works.

### Verification

Migration + types + `pnpm lint && pnpm test && pnpm build`.

---

## Phase 7 — Central Deployment Rewire (Term Instance + Term Field)

**Goal**: PH central deployment uses `AcademicTermInstance` instead of free-text AY; recipients come from `student_enrollments` for STUDENT stakeholder.

### Schema

- `[MOD] prisma/schema.prisma` (`CentralDeployment`)
  - Add `term_instance_id` (nullable in this phase).
  - Add a real `term` enum column (currently missing on this model).
- Migration: `link_central_deployment_to_term_instance.sql`.

### Modified services/components

- `[MOD] src/features/evaluations/components/publish-central-deployment-form.tsx`
  - Replace free-text academic_year + `SEMESTER_OPTIONS` select with `TermInstancePicker` (default active).
  - `[REMOVE-CODE]` ad-hoc AY input + manual semester rendering.
- `[MOD] src/features/evaluations/services/publish-central-deployment.ts`
  - Resolve term instance, populate FK + legacy text fields.
  - Switch student-stakeholder recipient lookup to enrollments via `list-students-for-class`.
- `[MOD] src/features/evaluations/services/preview-central-deployment-respondents.ts` — same shift.
- `[MOD] src/features/evaluations/schemas/central-deployment.ts` — accept `term_instance_id` (preferred) and continue accepting legacy fields temporarily; `superRefine` requires one of the two.
- `[MOD] src/features/evaluations/services/list-program-head-deployments.ts` — surface term-instance label when present.
- `[MOD] src/lib/actions/central-deployment-actions.ts` — pass new payload shape; thin pass-through.

### Tests

- `[MOD] src/__tests__/modules/evaluations/publish-central-deployment.test.ts`.
- `[NEW] src/__tests__/components/program-head/publish-central-deployment-form.test.tsx` — uses `TermInstancePicker`; no free-text AY.

### Verification

Migration + types + `pnpm lint && pnpm test && pnpm build`.

---

## Phase 8 — Term Rollover + Exceptions Review

**Goal**: when Admin sets a new active term, run an idempotent rollover that creates next-term enrollments for active students and surfaces exceptions.

### Services

- `[NEW] src/features/academic-calendar/services/run-term-rollover.ts`
  - Inputs: `{ targetTermInstanceId }`.
  - Logic:
    - Fetch last-active enrollments per student.
    - Compute next-term `(year_level, program, major, section)` using cohort rules (1st→2nd … 4th→4th, with graduation flagged).
    - Insert enrollments with `source = ROLLOVER` (skip if already exists).
    - Collect exceptions: graduating 4th-years, students missing program/major, duplicate-section conflicts.
  - Idempotent and safe to retry; entire write inside `prisma.$transaction`.

### Components

- `[NEW] src/features/academic-calendar/components/rollover-exceptions-table.tsx` — uses `Table` + `Badge` for status; row actions reuse `EnrollmentEditorDialog` from Phase 2.
- `[NEW] src/features/academic-calendar/components/rollover-runner.tsx` — confirm step → live progress → exceptions list.

### Pages & Actions

- `[NEW] src/app/(app)/admin/school-years/[id]/rollover/page.tsx`.
- `[NEW] src/lib/actions/admin-rollover-actions.ts`.

### Modified

- `[MOD] src/features/academic-calendar/services/manage-term-instances.ts` — `setActiveTermInstance` returns `{ rolloverSuggested: termInstanceId }` so the UI can prompt admin without auto-running.

### Tests

- `[NEW] src/__tests__/modules/academic-calendar/run-term-rollover.test.ts` — idempotency, year-level promotion, exception collection.
- `[NEW] src/__tests__/components/admin/rollover-runner.test.tsx`.

### Verification

`pnpm lint && pnpm test && pnpm build`.

---

## Phase 9 — Cleanup: Drop Legacy Free-Text Columns

**Goal**: remove legacy free-text columns and tighten constraints, after Phase 1–8 stabilization.

### Pre-requisite

- `[NEW] scripts/backfill-school-year-from-academic-year.ts` — read-only audit script that prints proposed mapping + counts of unmappable rows. Run on staging before applying any destructive migration.

### Schema

- `[MOD] prisma/schema.prisma`
  - `CourseBoundEvaluation`: drop `academic_year`, `semester`, `term`; make `term_instance_id` NOT NULL; rebuild unique constraint on `(term_instance_id, course_id, faculty_id, section)` NULLS NOT DISTINCT (mirrored as `@@index`).
  - `CentralDeployment`: drop `academic_year`, `semester`; make `term_instance_id` NOT NULL.
  - `StudentAcademicProfile`: drop `academic_year`, `year_level`, `section`. Keep `program_id`, `major_id`, `student_id_number` as cohort/static.
- Migrations:
  - `backfill_term_instance_ids.sql` — fills FKs from legacy text using a map produced by the script above (idempotent).
  - `drop_legacy_academic_year_columns.sql` — drops old columns + rebuilds indexes.

### Services/components

- `[MOD] src/features/evaluations/services/publish-course-bound-evaluation.ts` — remove writes to legacy fields.
- `[MOD] src/features/evaluations/services/publish-central-deployment.ts` — same.
- `[MOD] src/features/evaluations/schemas/central-deployment.ts` — remove legacy fields; require `term_instance_id`.
- `[MOD] src/features/evaluations/types.ts` — remove `@deprecated` fields from `PublishCourseBoundEvaluationInput`.
- `[MOD] src/features/users/services/manage-users.ts` (`upsertStudentAcademicContext`) — drop writes to profile `academic_year`/`year_level`/`section`.
- `[MOD] src/lib/actions/onboarding-actions.ts` — profile no longer writes `academic_year`; enrollment is the source of truth.
- `[MOD] src/lib/constants/academic.ts` — remove unused helpers if any (keep enums).
- `[MOD]` all read-side display components that previously formatted `academic_year` → use `formatTermInstanceLabel`.

### Removed code blocks

- `[REMOVE-CODE]` `isCourseContextDuplicatePublishError` matcher tied to `..._academic_year_semester_term_section_key` → replace with the new index name.
- `[REMOVE-CODE]` legacy `YYYY-YYYY` regex validator and stragglers of `deriveCurrentAcademicYear`.

### Tests

- Add a service test that confirms Postgres rejects writes that omit `term_instance_id` on the deployment tables.
- Update affected service tests to drop legacy expectations.

### Verification

- Run the backfill audit script on a copy of production data.
- Migration + types + full test suite + build.

---

## Cross-Cutting Concerns

- **Authorization**: every new action gates on `resolveAuthSession` + role checks; cross-program operations check `canManageCourseAssignment`.
- **Forms with Zod**: use `customZodResolver` from `src/lib/forms/zod-resolver.ts` per `AGENTS.md`.
- **UX consistency**: reuse existing UI primitives; build shared sub-components once and import everywhere; centralize labels for enums.
- **Performance**: project columns; respect indexes; cache `resolveActiveTerm` per request; paginate all list services with `DEFAULT_TABLE_PAGE_SIZE`.
- **Analytics**: existing analytics services that read free-text AY get a small adapter (Phase 6/7 transitional) until Phase 9 cleanup.
- **Observability**: surface failures via `showToast` consistently; never swallow errors in actions.

## Sequencing Summary (TL;DR)

1. **Phase 0** — constants/types/policies/helpers.
2. **Phase 1** — School Year + Term Instance + Active Term Resolver + Admin UI + shared `TermInstancePicker`.
3. **Phase 2** — Student Enrollment ledger + onboarding/admin wiring.
4. **Phase 3** — Course Assignment schema + services.
5. **Phase 4** — PH Course Assignment UI (dedicated + inline) using shared components.
6. **Phase 5** — Faculty CILOs/Tools read-side rewire.
7. **Phase 6** — Faculty publish course-bound evaluation rewire.
8. **Phase 7** — Central deployment rewire.
9. **Phase 8** — Term rollover + exceptions review.
10. **Phase 9** — Drop legacy free-text columns; final cleanup.
