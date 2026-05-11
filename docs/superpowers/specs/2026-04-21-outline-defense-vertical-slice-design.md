# Outline-Defense Vertical Slice Design

**Date:** 2026-04-21
**Status:** Approved in conversation, pending spec-file review
**Topic:** Working prototype for the outline defense centered on the Post-Term CILO evaluation flow, mean-based analytics, anonymized response review, and scoped reporting.

## 1. Objective

Deliver the most defensible outline-defense working prototype as a real end-to-end CLOIE slice:

- faculty publishes a course-bound Post-Term CILO evaluation
- students answer the published form through the existing evaluation workflow
- faculty, program heads, and the college dean review analytics from collected responses
- quantitative Likert results are measured through `mean`
- qualitative responses are visualized through a required word cloud
- response drill-down supports anonymized per-response review

This slice is intended to prove CLOIE's core value as an evaluation, monitoring, and reporting platform without overextending into full platform breadth too early.

## 2. Current Context

The repository already has meaningful foundations in place:

- Supabase Auth with role-aware routing and onboarding gates
- Prisma-backed schema for users, academic entities, instruments, course-bound evaluations, assignments, and response items
- a tracked Supabase CLI workflow already documented in `docs/superpowers/specs/2026-04-19-supabase-cloud-workflow-design.md`
- a real student course-bound evaluation response workflow under `src/modules/student-evaluation-workflow`
- stub dashboards for `faculty`, `program-head`, and `dean`

The largest current gap for the outline defense is that the system does not yet demonstrate the full authoring-to-analytics story required by the PRD and SRS. In particular, the codebase still lacks:

- faculty-side publishing flow for course-bound CILO evaluations
- scoped analytics and reporting surfaces for faculty, program heads, and the dean
- mean-based quantitative visualization through `Recharts`
- required word-cloud visualization for qualitative feedback
- anonymized response drill-down for academic reviewers

## 3. Chosen Approach

The selected prototype strategy is a narrow vertical slice over the current schema and architecture.

That means:

- keep the current modular-monolith direction
- extend the existing course-bound evaluation data model rather than replacing it
- add faculty publishing and analytics/reporting services as focused modules
- use one real workflow to demonstrate authoring, response collection, and review
- defer lower-value breadth until after the outline defense

This is preferred over a broad multi-tool demo or a backend-heavy foundation-only phase because it creates the strongest working proof with the least architectural churn.

## 4. Scope For The Outline-Defense Prototype

Included in this slice:

- RBAC and role-specific entry points for `faculty`, `student`, `program head`, and `dean`
- faculty creation and publication of course-bound Post-Term CILO evaluations
- persisted targeting rules for the intended student academic context
- student answer flow with draft, review, final submit, and read-only submitted review
- faculty analytics for published forms owned by that faculty member
- program-head analytics for published forms inside assigned program scope
- dean analytics using the same review surface, but across all programs with filtering
- per-question, per-section, and overall mean calculations for Likert-scale questions
- `Recharts`-based quantitative charts
- required word-cloud visualization using the project word-cloud library
- anonymized response-list and response-detail views for academic reviewers

Explicitly deferred after the outline defense:

- full parity for alumni, graduating-student, and industry-partner end-to-end flows
- full non-course-bound template builder refinement
- advanced trend analysis across terms
- export-heavy report generation
- CQI workflow tooling beyond evidence review
- advanced offline/PWA caching behavior beyond installability and app-shell experience

## 5. Role Workflows

### Faculty Workflow

1. Enter the faculty portal.
2. Open a published-forms or create-form surface for Post-Term CILO evaluations.
3. Select a valid course context from the controlled academic data.
4. Confirm or encode CILOs and course information needed for the evaluation snapshot.
5. Set activation and deadline values.
6. Persist the intended student targeting context.
7. Publish the form.
8. Later open the published form detail page and review analytics only for forms published by that faculty member.

### Student Workflow

1. Enter the student portal.
2. See only assigned active evaluations.
3. Answer the course-bound evaluation.
4. Review before submission.
5. Submit final answers.
6. Access read-only submitted-answer review where permitted.

### Program Head Workflow

1. Enter the program-head portal.
2. Open the program-scoped evaluation review surface.
3. View only published forms and analytics within the assigned program.
4. Drill into anonymized responses for those forms.

### Dean Workflow

1. Enter the dean portal.
2. Use the same review surface as the program head.
3. View college-wide results with program filtering and drill-down.
4. Drill into anonymized responses without receiving respondent identity.

## 6. Page And UI Structure

The chosen review surface is a published-form detail page with tabs.

### A. Published Forms Index

Each reviewer role should have a list page appropriate to its scope:

- faculty: only forms where `CourseBoundEvaluation.faculty_id` is the current user
- program head: only forms within the assigned program scope
- dean: all forms, with program filter controls

Each form row should show:

- course label
- program label
- academic term metadata
- publication status
- deadline
- response count
- actions such as `View Details`

### B. Published Form Detail Page

The detail page should use tabs:

- `Overview`
- `Section Analytics`
- `Responses`
- `Word Cloud`

This tabbed structure is preferred over one long page or multiple sibling routes because it keeps the explanation simple and keeps the response drill-down close to the analytics context without burying it.

### C. Responses Tab

The `Responses` tab should show one card per response.

Each response card should expose only anonymized and review-safe metadata:

- anonymized label such as `Respondent A01`
- submitted timestamp
- overall mean
- `View Response` action

It must not expose:

- name
- email
- student number
- direct section roster identity
- profile-link access

### D. Response Detail Page

Clicking `View Response` should navigate to a dedicated response page.

That page should show:

- the published form context
- the anonymized respondent label
- submitted timestamp
- every answered question grouped by section
- quantitative answers exactly as submitted
- qualitative answers exactly as submitted
- read-only presentation only

This page is intended for academic review, not respondent management.

## 7. Analytics Rules

### Quantitative Metrics

Because the instrument uses Likert-scale quantitative questions, the primary metric is `mean`.

The prototype should compute:

- per-question mean
- per-section mean
- overall form mean
- response count
- completion rate where meaningful

No more complex metric is required for the outline-defense slice.

### Quantitative Charts

Use `Recharts` for all quantitative visualization.

Recommended chart usage:

- `BarChart` for section means
- `BarChart` for question means within a selected section
- summary cards for total responses, completion rate, and overall mean

This matches the tech stack direction in `docs/cloie-techstack.md` and produces charts that are easy to explain in the defense.

### Qualitative Processing And Visualization

The qualitative pipeline should use:

- `winkNLP`
- stopword filtering
- app-level normalization and frequency shaping
- `@isoterik/react-word-cloud` for the word-cloud visualization

Although `docs/cloie-techstack.md` currently describes word-cloud visualization as optional, the user direction for this design overrides that document for the outline-defense slice. For this prototype, the word-cloud library is required.

The word cloud should be visible from the published-form detail page and derived from qualitative responses in the relevant scope.

## 8. Access And Anonymization Rules

### Faculty Access Rule

Faculty may view analytics and anonymized response drill-down only for published course-bound evaluations they own.

### Program Head Access Rule

Program heads may view analytics and anonymized response drill-down only for published course-bound evaluations inside their assigned program scope.

### Dean Access Rule

The dean uses the same general review experience as the program head, but with college-wide visibility and program filtering.

### Anonymization Rule

The reviewer-facing response views must anonymize respondent identity.

The anonymized label should be deterministic only inside a single published form context so that reviewers can distinguish responses on that form without turning the label into a reusable identity across the whole system.

Anonymization should be derived in the reporting layer, not stored as a second identity record.

## 9. Architecture And Module Boundaries

The design should extend the current modular-monolith layout.

### Existing Modules To Reuse

- `identity-access`
- `user-lifecycle-profiles`
- `student-evaluation-workflow`

### New Or Expanded Capability Owners

#### `academic-catalog-and-context`

Owns the minimal course/program/year/section lookup needed to support faculty publishing and scoped review.

#### `deployments-and-targeting`

Owns:

- faculty publishing workflow
- persisted target scope for course-bound evaluations
- assignment creation or assignment-resolution support for the student workflow

#### `analytics-reporting-and-review`

Owns:

- mean-based quantitative aggregation
- chart-ready DTO shaping
- qualitative token-frequency shaping
- anonymized response list shaping
- anonymized response detail shaping
- faculty/program-head/dean scoped review queries

Routes should stay thin. Pages should load DTOs from module services instead of embedding business rules.

## 10. Schema Direction

The current Prisma schema is close, but a few changes are appropriate for this prototype.

### Recommended App-Schema Changes

1. Add explicit `FacultyProgramAffiliation` records so faculty publishing and scoped review do not rely on informal assumptions.
2. Add explicit `ProgramHeadAssignment` records so program-head analytics scope is database-backed.
3. Add explicit `CourseBoundEvaluationTarget` records so faculty publication stores intended program, major, year-level, and section targeting clearly.
4. Add a database-backed one-response-per-assignment constraint, preferably as a unique rule on `Response.assignment_id` because one response should move from draft to submitted instead of creating parallel records.

### Recommended Constraint Behavior

For the student workflow, one `Response` should represent the draft-to-submitted lifecycle for one assignment. The database should enforce that the same assignment cannot accumulate multiple competing response records.

### Analytics Storage Direction

Do not introduce a separate analytics warehouse or denormalized reporting table for this slice.

Compute analytics from:

- `course_bound_evaluations`
- `evaluation_assignments`
- `responses`
- `quantitative_response_items`
- `qualitative_response_items`
- `instrument_versions.structure_snapshot`

This keeps the prototype simple and aligned with the current schema.

## 11. Supabase CLI Workflow

Schema and infrastructure changes should follow the repository's existing cloud workflow.

Use this ownership model:

- `prisma/schema.prisma` for ordinary application schema intent
- tracked SQL under `supabase/migrations/` for reviewed migration artifacts and Supabase-specific behavior
- `Supabase CLI` for apply, inspect, and verification against the linked hosted project

For this slice:

- do not use `prisma db push` as the normal hosted-change mechanism
- keep schema changes small and reviewable
- commit Prisma schema changes and tracked SQL together when implementation begins
- verify linked-project behavior after migration apply

## 12. Testing And Demo Verification

### App-Level Verification

The implementation should include targeted tests for:

- faculty publishing rules
- target-scope persistence
- one-response-per-assignment behavior
- mean aggregation shaping
- scoped analytics filtering for faculty, program head, and dean
- anonymized response-list shaping
- anonymized response-detail access checks
- word-cloud data shaping

### Browser Verification

Use Chrome DevTools MCP during verification of the working prototype.

The primary demo path to validate is:

1. faculty publishes a CILO evaluation
2. student completes and submits it
3. faculty sees analytics for the published form
4. program head sees only scoped results
5. dean sees broader filtered results
6. response detail is visible but anonymized

This gives a direct browser-level proof for the outline defense.

## 13. Design Trade-Off Summary

This design deliberately favors one real, defensible slice over breadth.

Benefits:

- strongest demo story for the outline defense
- minimal divergence from the current codebase
- schema changes remain focused and justifiable
- analytics and anonymized review provide visible value beyond raw form submission

Costs:

- non-course-bound stakeholder tools remain less complete in this phase
- reporting breadth is intentionally limited
- some academic-structure persistence may need to be added before the slice can be fully correct

## 14. Final Decision Summary

The outline-defense prototype should be built as a real Post-Term CILO vertical slice.

The key decisions are:

- use `mean` as the quantitative metric for Likert-scale questions and sections
- use `Recharts` for quantitative analytics charts
- require `@isoterik/react-word-cloud` for qualitative visualization
- provide faculty analytics for forms they published
- provide program-head and dean review using the same page pattern with different scope filters
- use a tabbed published-form detail page with `Overview`, `Section Analytics`, `Responses`, and `Word Cloud`
- use anonymized respondent cards and a separate read-only response-detail page
- make schema changes where needed to support affiliations, targeting, and one-response enforcement
- use the tracked Supabase CLI workflow for backend changes
- verify the end-to-end browser flow with Chrome DevTools MCP
