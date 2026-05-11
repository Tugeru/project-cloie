# CLOIE Full Platform Architecture Design

## Overview

This document defines the target full-platform architecture for PROJECT CLOIE as a near-production-ready, domain-modular monolith built on the current Next.js, Supabase, Prisma, and PostgreSQL stack.

The design is intended to guide the system beyond its current foundation of authentication, public pages, and student onboarding into a complete evaluation, deployment, response, analytics, and reporting platform for Assumption College of Davao.

This architecture is intentionally modular, but it is not frozen. Domain boundaries may evolve as implementation progresses, stakeholder feedback is gathered, and better seams become clear. What should remain stable is capability ownership: each major business capability should have one clear home for its business rules, validation, data access, and workflow orchestration.

## Architecture Goals

- Optimize for near-production readiness rather than capstone-only speed.
- Keep deployment simple as one primary web application and one primary database.
- Establish strong domain boundaries early enough to prevent route-driven sprawl.
- Support internal academic roles first, while leaving clean extension points for external respondents.
- Keep analytics and reporting downstream from operational workflows.
- Allow the architecture to evolve deliberately without turning modules into catch-all folders.

## System Style

CLOIE should be implemented as a domain-modular monolith.

This means:

- one `Next.js` application owns the web experience and route surface
- one primary `PostgreSQL` database remains the system of record
- `Supabase Auth` remains the identity provider and authenticated session source
- `Prisma` remains the persistence layer inside the application
- domain modules own business workflows instead of scattering them across route files, ad hoc helpers, and UI components

This style keeps hosting, deployment, and operations manageable while still creating boundaries strong enough for long-term maintainability.

## Domain Map

The full-platform domain map should be organized as follows.

### `identity-access`

Owns authentication, sessions, role resolution, RBAC, permission checks, invited-role access, and external respondent access.

### `user-lifecycle-profiles`

Owns student onboarding, alumni onboarding, respondent profile completion, profile updates, and profile completeness checks used for gating access.

### `academic-catalog-and-context`

Owns programs, majors, courses, course types, year levels, faculty-course context, and student academic context.

### `outcomes-and-mapping`

Owns PLOs, GOs, CILOs, and explicit mapping relationships between course-level and program-level outcomes.

### `instrument-catalog-and-template-governance`

Owns the evaluation tool catalog, templates, versions, sections, question metadata, rating scales, qualitative prompts, approved variants, archival behavior, and governance rules.

### `deployments-and-targeting`

Owns published form instances, availability windows, targeting and visibility rules, and the distinction between faculty-owned course-bound deployments and centrally managed deployments.

### `response-lifecycle`

Owns inbox delivery, start and resume flows, preview and confirmation, finalized submissions, receipts, and read-only response review.

### `analytics-reporting-and-review`

Owns attainment computation, summaries, dashboards, stakeholder comparison, qualitative insights, evidence views, and gap review support.

### `system-administration`

Owns users, roles, institution setup, catalogs, master data, configuration, system records, and tool catalog governance surfaces.

## Domain Ownership Rules

Each domain should expose a clear service layer and own its rules end to end.

- `identity-access` decides who the user is, what access they have, and whether a route or action may proceed.
- `user-lifecycle-profiles` decides whether the user is fully onboarded for their role and what profile data is still missing.
- `academic-catalog-and-context` owns the academic structures referenced by downstream workflows.
- `outcomes-and-mapping` owns outcome definitions and mapping logic.
- `instrument-catalog-and-template-governance` owns reusable instruments and their versioning rules.
- `deployments-and-targeting` turns governed instruments into actual answerable deployments.
- `response-lifecycle` owns respondent progress and final submission state.
- `analytics-reporting-and-review` reads finalized and contextualized records to produce reporting outputs.
- `system-administration` performs setup and maintenance work, but should not absorb unrelated business logic from the other domains.

The design rule is that each capability should have one clear owner. Cross-domain calls are allowed, but cross-domain rule duplication should be avoided.

## Dependency Direction

The preferred dependency direction is:

`identity/profile -> academic context -> outcomes/templates -> deployments -> responses -> analytics/reporting`

This direction means:

- upstream domains define context used by downstream domains
- downstream domains may reference upstream records, but should not casually rewrite upstream rules
- analytics stays downstream of response capture and should not leak write-path logic back into operational modules

## Main Data Flow

The primary data flow for the system should be:

1. Administrative and academic roles maintain catalogs, outcomes, mappings, and governed instrument templates.
2. Faculty or central academic roles create deployments against approved academic context and approved instrument versions.
3. Respondents receive only deployments they are eligible to answer through authenticated inbox views or controlled external-access flows.
4. Responses move through a strict lifecycle from availability to in-progress work to finalized submission.
5. Analytics and reports read from finalized responses, deployment metadata, academic context, and outcome mappings to compute attainment and review outputs.

## Code Organization

The current `Next.js` application should remain the primary app shell, but business logic should move into domain-owned module folders.

### Top-level organization

- `src/app`: route handlers, pages, layouts, and route entrypoints
- `src/modules`: domain-owned business logic
- `src/components`: shared UI only
- `src/lib`: low-level and cross-cutting platform utilities only
- `src/styles`: global and shared style layers

### Internal module organization

Each domain under `src/modules` should use a consistent layout where relevant:

- `services`: business workflows and orchestration
- `repositories`: Prisma-backed persistence and queries
- `schemas`: Zod validation and typed contracts
- `policies`: permission checks and invariants
- `mappers`: translation to view models, DTOs, or reporting shapes
- `constants`: domain-level constants when needed

### Route rule

Routes should stay thin.

- pages load data through domain services
- server actions call domain services
- UI components receive prepared view models
- direct Prisma access should not spread through pages and components

### Cross-cutting utility rule

`src/lib` should remain reserved for infrastructure and shared helpers such as:

- Prisma client setup
- Supabase client setup
- low-level auth helpers
- generic validation helpers
- generic utilities and shared constants

Files that encode business logic should live in their owning domain instead of collecting inside `src/lib` over time.

## Project Folder Tree

The proposed full-system project shape is:

```text
project-cloie/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── lint.yml
│       ├── test.yml
│       └── preview-check.yml
├── docs/
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── domain-map.md
│   │   ├── route-map.md
│   │   ├── access-control-matrix.md
│   │   ├── data-flow.md
│   │   └── reporting-read-models.md
│   ├── api/
│   │   ├── auth-flow.md
│   │   ├── route-handlers.md
│   │   └── external-respondent-access.md
│   ├── ui-ux/
│   │   ├── page-inventory.md
│   │   ├── navigation-map.md
│   │   ├── design-tokens.md
│   │   └── responsive-rules.md
│   ├── reports/
│   │   ├── attainment-rules.md
│   │   ├── export-scope.md
│   │   └── evidence-views.md
│   ├── project/
│   │   ├── backlog.md
│   │   ├── milestones.md
│   │   └── setup-notes.md
│   ├── plans/
│   └── superpowers/
│       └── specs/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts
│   └── seeds/
│       ├── roles.seed.ts
│       ├── programs.seed.ts
│       ├── year-levels.seed.ts
│       ├── course-types.seed.ts
│       ├── tool-catalog.seed.ts
│       └── instrument-templates.seed.ts
├── public/
│   ├── icons/
│   ├── logos/
│   ├── images/
│   └── manifest.webmanifest
├── scripts/
│   ├── verify-env.ts
│   ├── seed-all.ts
│   ├── reset-db.ts
│   └── generate-test-data.ts
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (app)/
│   │   ├── api/
│   │   ├── manifest.ts
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── modules/
│   │   ├── identity-access/
│   │   ├── user-lifecycle-profiles/
│   │   ├── academic-catalog-and-context/
│   │   ├── outcomes-and-mapping/
│   │   ├── instrument-catalog-and-template-governance/
│   │   ├── deployments-and-targeting/
│   │   ├── response-lifecycle/
│   │   ├── analytics-reporting-and-review/
│   │   └── system-administration/
│   ├── components/
│   ├── lib/
│   ├── styles/
│   ├── middleware.ts
│   └── __tests__/
├── tests/
│   └── e2e/
├── .env.example
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── vitest.config.ts
└── vitest.setup.ts
```

## Cross-Cutting Rules

### Authorization should happen in layers

- route-level guards decide whether a user can enter a section at all
- service-level policies decide whether a specific action is allowed
- query filtering limits visible records to the correct academic, deployment, and respondent context

### Finalized responses should be protected records

Users may start and resume responses when permitted, but once finalized, submissions should be treated as immutable except through explicitly designed administrative correction workflows.

### Analytics should read from stable source records

Reporting may later use derived queries, summary tables, or read models, but the source of truth remains deployments, finalized responses, academic context, outcomes, and governed instrument versions.

### Auditability should exist for sensitive workflows

CLOIE should be able to trace who created or changed major records such as templates, deployments, mappings, role assignments, and governed catalog data.

### External respondent access should stay isolated

External access may reuse deployment and response infrastructure, but the access model, token handling, and profile-completion rules should remain distinct from standard authenticated campus-user flows.

### Domain evolution is allowed, but it must be deliberate

The system shape may change based on stakeholder feedback and implementation learning, but capability ownership should not drift casually between modules.

## Reliability And Error Handling

Each domain should expose explicit failure modes rather than falling back to generic page failures.

- `identity-access` should fail closed for unknown or unauthorized users.
- `user-lifecycle-profiles` should distinguish missing, incomplete, and invalid profile states.
- `deployments-and-targeting` should reject invalid publish states early.
- `response-lifecycle` should enforce explicit lifecycle states and transitions.
- `analytics-reporting-and-review` should surface incomplete or insufficient data conditions clearly instead of silently producing misleading outputs.

## Testing Strategy

Testing should follow the domain boundaries.

- unit tests for services, policies, validation, and state transitions
- integration tests for Prisma-backed repositories and key cross-domain workflows
- end-to-end tests for authentication, onboarding, deployment publishing, respondent answering, submission locking, and report viewing
- contract-style tests for role access and route protection

The most critical flows to verify are:

1. login and role resolution
2. onboarding completion and profile gating
3. deployment publication and targeting
4. eligible respondent access
5. response finalization and immutability
6. analytics and report generation based on finalized data

## Current-State Implications

The current repository already contains useful foundations, including public pages, Google-auth wiring, Supabase session handling, Prisma schema foundations, and student onboarding work.

However, the codebase is still early relative to the full platform architecture. The largest architectural move from here is not changing the framework, but changing where logic lives:

- route files should become thinner
- helper-heavy logic in `src/lib` should move into domain modules
- authorization should move from partial helper coverage toward layered enforcement
- academic, deployment, response, and reporting workflows should be built as domain-owned services rather than page-local logic

## Architecture Evolution Note

This design is a target architecture, not a claim that every folder or module must appear immediately.

The implementation should grow toward this structure incrementally. If stakeholder feedback or implementation realities expose better domain boundaries, the system shape may be revised. Any revision should preserve clear ownership and should improve, not blur, business capability boundaries.
