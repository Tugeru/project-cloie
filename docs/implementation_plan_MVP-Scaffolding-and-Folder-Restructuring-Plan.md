# MVP Scaffolding & Folder Restructuring Plan (v2)

> Updated with user feedback on roles, course scoping, testing strategy, and Option A (restructure first).
> Historical planning note: the active implementation source of truth is `docs/plans/cloie-mvp-roadmap.md`.
> Older references in this document to sections, course types, or PLO-driven scope are superseded by the
> current sectionless MVP model and the GO + CILO outcome model.

---

## Current State Audit

**Implemented (buggy/unrefined):** Auth, Student portal (dashboard/evaluations/history/profile), Faculty CILO evaluations, Dean/PH CILO reviews, Onboarding, Middleware, Layout shell, Course-bound review components (mean chart, word cloud), Prisma schema, PWA manifest.

**Missing for MVP:** Admin CRUD, Academic structure management, User management, PLO/GO/CILO pages, Outcome mapping, PH template builder, Central deployments (exit survey/alumni/industry), Analytics dashboards, External stakeholder portals, Graduating-student eligibility logic.

---

## Design Decision 1: Roles as Prisma Enum

### Problem
The current `Role` model + `UserRole` join table is overengineered for 7 fixed roles. Role names are already hardcoded in `lib/constants/roles.ts`.

### Solution: PostgreSQL enum via Prisma

```prisma
enum SystemRole {
  ADMIN
  DEAN
  PROGRAM_HEAD
  FACULTY
  STUDENT
  ALUMNI
  INDUSTRY_PARTNER
}

model UserRole {
  id          String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id     String     @db.Uuid
  role        SystemRole
  assigned_at DateTime   @default(now())

  user        User       @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, role])
  @@map("user_roles")
}
```

**Changes:**
- Remove `Role` model and `roles` table entirely
- Remove `role_id` FK from `UserRole`, replace with `role SystemRole` enum column
- Remove `GRADUATING_STUDENT` role — replace with `is_graduating Boolean` on `StudentAcademicProfile`
- Update `lib/constants/roles.ts` to derive from Prisma's generated `SystemRole` type
- Update `resolve-auth-session.ts` to read `.role` directly instead of `.role.name`
- Update seed to remove role table seeding

**Why this is better:**
- Type-safe at both DB and TypeScript level
- No joins needed to check roles — single column read
- No stale role records possible
- Prisma generates the TypeScript enum automatically

---

## Design Decision 2: Course Scoping (GE / Program / Major)

### Problem
Courses currently have `program_id` (nullable) and `course_type_id`. This handles GE vs program-specific, but NOT major-specific courses (e.g., BSBA-Marketing has courses that BSBA-HRM doesn't).

### Solution: Three-tier course scoping

```prisma
model Course {
  id             String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code           String     @unique
  title          String
  description    String?
  program_id     String?    @db.Uuid    // null = GE course
  major_id       String?    @db.Uuid    // null = shared across all majors in program
  course_type_id String     @db.Uuid
  is_active      Boolean    @default(true)
  created_at     DateTime   @default(now())
  updated_at     DateTime   @updatedAt

  program        Program?   @relation(fields: [program_id], references: [id], onDelete: SetNull)
  major          Major?     @relation(fields: [major_id], references: [id], onDelete: SetNull)
  course_type    CourseType @relation(fields: [course_type_id], references: [id], onDelete: Restrict)
  cilos          CILO[]
  evaluations    CourseBoundEvaluation[]

  @@map("courses")
}
```

**Scoping rules:**

| `program_id` | `major_id` | Scope | Example |
|---|---|---|---|
| `null` | `null` | General Education (all programs) | NSTP1, GEGS |
| `BSIT` | `null` | Program-specific (all majors) | IT101, IT102 |
| `BSBA` | `Marketing` | Major-specific | MKT301 |

**UI implication:** Course form needs a conditional flow:
1. Select course type (GE or Program-Specific)
2. If Program-Specific → select program
3. If program has majors → optionally select major

---

## Design Decision 3: Dev-Mode Testing Strategy

### Problem
Google OAuth means you need separate Google accounts to test different roles. Impractical for a 2-person team and impossible for automated testing.

### Solution: Multi-layer approach

#### Layer 1: Seeded Demo Users (via Supabase Admin API)
The seed script creates test users directly in Supabase Auth + assigns them roles in the CLOIE database:

```
demo-admin@cloie.test      → ADMIN
demo-dean@cloie.test       → DEAN
demo-ph@cloie.test         → PROGRAM_HEAD
demo-faculty@cloie.test    → FACULTY
demo-student@cloie.test    → STUDENT (non-graduating)
demo-grad@cloie.test       → STUDENT (is_graduating=true)
demo-alumni@cloie.test     → ALUMNI
demo-industry@cloie.test   → INDUSTRY_PARTNER
```

#### Layer 2: Dev Auth Bypass Route
A development-only API route (`/api/auth/dev-login`) that accepts an email and creates a session directly — no OAuth redirect needed:

```ts
// Only enabled when NODE_ENV === 'development'
// POST /api/auth/dev-login { email: "demo-admin@cloie.test" }
```

#### Layer 3: Dev Role Switcher Component
A floating dev-only UI pill that lists all demo accounts. Click to instantly switch user/role. Only renders in development.

#### Layer 4: Playwright Test Helpers
For automated E2E tests, a helper that calls the dev auth bypass to authenticate as any role before running test scenarios:

```ts
// test-utils/auth.ts
async function loginAs(page: Page, role: 'admin' | 'dean' | 'faculty' | ...) {
  await page.request.post('/api/auth/dev-login', { data: { email: `demo-${role}@cloie.test` } });
}
```

> [!WARNING]
> The dev auth bypass must **never** be available in production. It will be gated by `NODE_ENV === 'development'` and excluded from production builds.

---

## Part 1: Folder Restructuring (Option A — Do First)

### Target Structure

```
src/
├── app/                          # Routes only — thin pages
│   ├── (public)/                 # login, onboarding
│   ├── (app)/                    # authenticated shell
│   │   ├── admin/
│   │   ├── faculty/
│   │   ├── student/
│   │   ├── program-head/
│   │   ├── dean/
│   │   ├── alumni/
│   │   └── industry-partner/
│   └── api/
├── features/                     # Domain modules
│   ├── auth/                     # session, policies, components
│   ├── academic-structure/       # programs, majors, courses, sections
│   ├── outcomes/                 # PLOs, GOs, CILOs, mappings
│   ├── instruments/              # templates, versions, builder
│   ├── evaluations/              # course-bound, central deployments
│   ├── responses/                # collection, submission, wizard
│   ├── analytics/                # mean, word cloud, attainment
│   ├── reporting/                # export, report pages
│   └── users/                    # profiles, management, affiliations
├── components/                   # Shared UI only
│   ├── ui/                       # shadcn primitives
│   └── layout/                   # shell, sidebar, topbar
├── lib/                          # Global utilities only
│   ├── db/prisma.ts
│   ├── supabase/
│   ├── constants/
│   └── utils.ts
└── types/
```

### Feature Module Convention

Each `features/<domain>/` folder contains:
```
features/<domain>/
├── components/        # React components specific to this domain
├── services/          # Server-side data fetching / business logic
├── actions/           # Server Actions (mutations)
├── schemas/           # Zod validation schemas
├── types.ts           # Domain-specific TypeScript types
└── index.ts           # Barrel export (public API)
```

### Migration Sequence
1. Create `features/` skeleton with `index.ts` barrels
2. `modules/identity-access/` + `lib/auth/` + `components/auth/` → `features/auth/`
3. `modules/student-evaluation-workflow/` → `features/responses/`
4. `components/student/` → split into `features/responses/` + `features/users/`
5. `components/faculty/` → `features/evaluations/`
6. `components/course-bound-review/` → `features/analytics/`
7. Remaining `modules/` → corresponding `features/`
8. Clean up empty dirs, update all imports in `app/`
9. `pnpm build` verification after each step

---

## Part 2: MVP Feature Scaffolding (7 Phases)

### Phase 1: Schema Migrations
- Add `SystemRole` Prisma enum, migrate `UserRole` to use it
- Remove `Role` model
- Add `major_id` to `Course` model
- Add `is_graduating` to `StudentAcademicProfile`
- Expand seed with demo users, programs (BSIT, BSBA w/ majors), GE + program + major-specific courses, PLOs, GOs, CILOs, instrument templates

### Phase 2: Admin Portal
- `/admin/dashboard` — overview stats
- `/admin/users` — user table, invite, role assignment
- `/admin/programs` — program CRUD with major sub-management
- `/admin/courses` — course catalog with GE/program/major filter
- `/admin/year-levels` — year level + section management
- `/admin/outcomes` — PLO/GO list per program
- `/admin/instruments` — default instrument list

### Phase 3: Outcomes Management
- `/admin/outcomes` and `/program-head/outcomes` — PLO/GO/CILO management
- `/program-head/outcomes/mapping` — CILO-to-PLO/GO mapping matrix

### Phase 4: Faculty + Student Refinement
- Faculty: real dashboard, course affiliation view, CILO management per course
- Student: graduating-student eligibility banner, central deployment forms in evaluations list

### Phase 5: Program Head Template Builder + Deployments
- `/program-head/tools` — template list, create, edit, preview
- `/program-head/deployments` — deploy exit survey/alumni/industry tools

### Phase 6: Dean + PH Analytics
- `/dean/dashboard` + `/dean/analytics` — college-wide mean + word cloud
- `/program-head/dashboard` + `/program-head/analytics` — program-scoped
- `/dean/reports` + `/program-head/reports` — report list with export stubs

### Phase 7: External Stakeholder Portals
- `/alumni/dashboard` + `/alumni/evaluations/[id]`
- `/industry-partner/dashboard` + `/industry-partner/evaluations/[id]`

---

## Open Questions

1. **BSBA major examples**: Can you provide 2-3 example major names for BSBA (e.g., Marketing Management, Human Resource Management, Financial Management)? This helps seed realistic data.
2. **Scaffolding depth**: Should all pages have working CRUD for outline defense, or is read-only lists + "create" stubs sufficient for the first pass?

## Verification Plan

- `pnpm build` passes after each phase
- All role portals accessible via dev role switcher
- Navigation links resolve for all new routes
- Seeded data visible in list pages
