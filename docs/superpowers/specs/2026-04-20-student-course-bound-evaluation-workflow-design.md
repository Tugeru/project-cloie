# Student Course-Bound Evaluation Workflow Design

**Date:** 2026-04-20
**Status:** Approved
**Topic:** First real end-to-end student evaluation workflow using the existing course-bound assignment and response schema.

## 1. Objective

Implement the first full real student workflow in CLOIE by replacing the current mock student evaluation experience with a real database-backed flow for course-bound evaluations.

This workflow starts from an already-existing `evaluation_assignment` and covers:

- real dashboard/list loading for assigned evaluations
- draft response creation and resume
- autosave on section change
- final submission
- submitted history visibility
- read-only submitted answer review on a dedicated page

The design must fit the current architecture and remain resilient to future stakeholder-driven changes, especially around reporting and publishing rules.

## 2. Current Context

The current codebase already includes:

- Supabase Auth and session resolution
- role and onboarding gates for student access
- Prisma models for `course_bound_evaluations`, `evaluation_assignments`, `responses`, and response item tables
- typed Supabase client setup and tracked Supabase migrations
- student-facing pages for dashboard, evaluations, history, and profile
- a mock `WizardShell` and `ReviewModal` UI for the evaluation form flow

The current gap is that the student evaluation pages are still mostly driven by hardcoded mock data rather than real assignments and responses.

## 3. Decision Summary

The chosen implementation approach is a `workflow service over the current schema`.

That means:

- the existing normalized response schema remains the source of truth
- student pages consume workflow-shaped DTOs instead of directly depending on raw table layouts
- backend orchestration for load/save/submit/history/review lives in a small module boundary rather than being spread across page files

This is preferred over a temporary JSON-draft model or a generalized workflow engine because it fits the current schema, delivers a real user-visible flow quickly, and keeps future reporting or publishing changes localized.

## 4. Scope Of This First Slice

Included:

- course-bound student evaluations only
- students who already have assignments
- autosave on section change
- hard final submission
- submitted response appears in history
- dedicated read-only page for submitted answer review

Explicitly excluded for this slice:

- admin or faculty assignment creation
- central deployment evaluations
- reopen or resubmit flows
- reporting dashboards or aggregate release logic
- deadline-window editing exceptions

## 5. Architecture

### A. Workflow Module

Add a focused backend module for the student evaluation workflow.

Responsibilities:

- resolve active assigned course-bound evaluations for the current student
- load one assignment-specific evaluation session
- create or resume a draft response
- autosave section answers
- finalize submission
- load submitted history rows
- load one submitted response for read-only review

This module is the primary boundary that protects the UI from direct table-shape coupling.

### B. Page And UI Layer

Student pages and components should render workflow DTOs and trigger workflow actions.

Responsibilities:

- dashboard/list/history rendering
- evaluation wizard rendering
- review modal rendering
- optimistic or loading state presentation
- error messages for save and submit failures

The page/UI layer should not contain business rules about ownership, submission eligibility, or persistence semantics.

### C. Persistence Layer

Use the existing Prisma-backed schema as the persisted model.

Core tables:

- `evaluation_assignments`
- `responses`
- `quantitative_response_items`
- `qualitative_response_items`
- `instrument_versions.structure_snapshot`

### D. Auth And Access Layer

Use the existing authenticated session resolution and role/profile gate flow.

The student workflow must only load assignments belonging to the currently authenticated student and should avoid leaking metadata for unauthorized assignments.

## 6. Data Model Usage

### Assignment

`evaluation_assignments` remains the source of truth for which student can answer which evaluation.

For this slice, the workflow only admits assignments where:

- `course_bound_id` is present
- the assignment belongs to the authenticated user

### Draft And Final Response

`responses` represents the student's actual answer session.

For this slice:

- one response record is associated with one assignment for the student flow
- `status = IN_PROGRESS` means draft
- `status = SUBMITTED` means final and locked
- `submitted_at` is set only on final submission

### Response Items

- `quantitative_response_items` store scalar ratings
- `qualitative_response_items` store text answers

The first implementation should persist against these normalized tables rather than introducing a parallel JSON draft store.

### Instrument Structure

The evaluation form should render from `instrument_versions.structure_snapshot`, not from mock inline objects.

That snapshot is the canonical question layout used for:

- live rendering
- answer persistence mapping
- read-only submitted review

## 7. End-To-End Flow

### Dashboard

Replace hardcoded active evaluations with workflow-backed assigned course-bound evaluations.

Each row should show:

- title
- course/context metadata
- deadline
- derived workflow status
- progress summary when there is a draft response

Derived states for this slice:

- not started: assignment exists but no response exists yet
- in progress: response exists with `IN_PROGRESS`
- due soon: styling or badge derived from deadline proximity

Submitted items should no longer appear in the active dashboard list.

### Evaluations List

Replace mock tab content with real workflow-backed data.

Tab behavior:

- active: assigned course-bound evaluations not finally submitted
- submitted: assigned course-bound evaluations with submitted responses
- closed: minimal or empty unless clearly derivable from assignment/deployment state in this slice

### Evaluation Detail Page

The evaluation page should resolve by assignment identity and load:

- assignment ownership and status
- course-bound evaluation metadata
- instrument structure snapshot
- existing saved draft answers if present

The current `WizardShell` becomes a real form shell instead of a mock container.

### Autosave On Section Change

When the student advances to the next section or navigates backward after edits:

- validate the current section according to the current flow rules
- create a draft `Response` if none exists yet
- upsert the current section's item rows
- keep the response in `IN_PROGRESS`
- update visible save feedback in the UI

Autosave is section-based, not per-keystroke and not manual-only.

### Review Modal And Final Submit

The review modal should render the real saved answer set from current local state plus persisted mapping rules.

On confirm submit:

- validate that all required questions are answered
- persist any current unsaved section values
- set `Response.status = SUBMITTED`
- set `submitted_at`
- transition the UI into final confirmation state

Submission is hard final in this first version. There is no student-side reopen path.

### History

Replace mock submission records with real submitted response records for the authenticated student.

Each row should show enough metadata to identify the evaluation, including submission timestamp.

### Read-Only Submitted Review

Use a dedicated page, not a modal.

The page should show:

- evaluation title and context
- submitted timestamp
- sectioned answer review
- locked, non-editable state

This is chosen over a modal because it provides a stable URL and a cleaner foundation for future reporting, publishing, or access-rule evolution.

## 8. State And Business Rules

### Ownership

Only the assigned respondent may view or answer the evaluation.

### Editable States

The student may edit only while the response is in draft state and the assignment is valid for completion in this first slice.

### Submitted State

Once submitted:

- the student cannot edit answers
- the item moves from active lists to submitted history
- the student may only view the dedicated read-only review page

### Future Resilience

Future changes to reporting or publishing rules should primarily affect workflow services and access policies rather than page-level components.

This is why DTO shaping and orchestration are intentionally centralized.

## 9. Error Handling

### Unauthorized Or Wrong Assignment

If the assignment does not belong to the authenticated student, return not-found or equivalent protected behavior without leaking assignment details.

### Invalid Workflow State

If the assignment is not course-bound, is not eligible for answering, or is already locked beyond the scope of this slice, route the user back to a safe student page with a clear message.

### Autosave Failure

- do not advance while claiming success if persistence failed
- keep the student on the current step when necessary
- show explicit save failure feedback
- never show stale “draft saved” messaging after a failed save

### Submit Failure

- do not show submitted success unless the database transaction completes
- preserve answers and allow retry

### Structure Mismatch

If persisted items no longer align with the structure snapshot needed for rendering, fail safely with a recoverable error view instead of rendering corrupted or partial answers silently.

### Duplicate Response Protection

The workflow layer should ensure the student flow does not accidentally create multiple active responses for the same assignment through repeated opens or rapid retries.

## 10. Testing Strategy

### Workflow Service Tests

Cover:

- assignment ownership checks
- draft response creation and resume
- section autosave upsert behavior
- final submit transition
- active versus submitted list shaping
- read-only review shaping

### Route And Page Tests

Cover:

- dashboard and list pages use real workflow data instead of mock arrays
- evaluation page loads existing draft answers
- submitted responses are not editable
- history page renders submitted results from real workflow DTOs

### UI Interaction Tests

Cover:

- section navigation with autosave
- review modal submit path
- visible error states for save and submit failures

### Security And Regression Tests

Cover:

- a student cannot access another student's assignment
- submitted responses disappear from active views and appear in history
- read-only review reflects stored answers accurately

### Manual Verification

Verify end to end with a seeded assigned student:

1. sign in
2. open assigned course-bound evaluation
3. answer one section
4. navigate away or refresh
5. confirm the draft persisted
6. submit
7. confirm it is removed from active views and visible in history
8. open read-only review page and confirm the saved answers render correctly

## 11. File And Module Direction

The existing student pages and components should be reused where possible, but their data flow should move from mock arrays and inline mock structures to workflow DTOs.

Expected change areas include:

- student dashboard page
- student evaluations list page
- student evaluation detail page
- student history page
- evaluation wizard shell
- review modal
- a new student evaluation workflow module

The design intentionally avoids unrelated refactors outside the flow.

## 12. Trade-Offs

### Benefits

- ships the first real student outcome workflow
- uses the existing normalized schema instead of inventing a throwaway draft model
- keeps future reporting and publishing changes localized in backend workflow services
- upgrades several visible student pages from mock state to real state in one cohesive slice

### Costs

- more backend orchestration than a page-local quick implementation
- autosave needs careful upsert logic across multiple item tables
- the first slice does not yet solve assignment creation or reporting publication workflows

## 13. Recommended Next Step After This Slice

Once this student flow is real and validated, the next natural end-to-end extension is upstream assignment and deployment management for faculty or admins.

That would complete the chain from publishing to student completion to downstream review/reporting.
