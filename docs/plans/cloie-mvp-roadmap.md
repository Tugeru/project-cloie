# CLOIE MVP Planned Implementation Roadmap

## Summary

Build the MVP as a **mockup-guided, sectionless, stakeholder-first system** with
implementation sequenced by dependency rather than by page count. The product
should be delivered as a set of role-complete vertical slices, with each later
phase depending on stable admin-managed data, scoped access, and shared
workflow contracts from earlier phases.

The implementation order is:

1. **Phase 0 — Schema and Workflow Alignment**
2. **Phase 1 — Admin Foundation**
3. **Phase 2 — Faculty + Student Vertical Slice**
4. **Phase 3 — Program Head Courses + Evaluation Tools**
5. **Phase 4 — Alumni and Industry Partner Response Flows**
6. **Phase 5 — Program Head + Dean Analytics and Reports**
7. **Phase 6 — UX Consolidation and PWA Readiness**

Core product rules for all phases:
- Student context is **sectionless**
- Student targeting uses only `program`, optional `major`, and `year level`
- Student portal follows the student mockups as the UX guide
- Program Head portal follows the program-head mockups as the UX guide
- Program Head and Dean share one leadership portal pattern with different
  scope rules

## Implementation Roadmap

### Phase 0 — Schema and Workflow Alignment

Stabilize the domain model before expanding more UI or CRUD.

Implement:
- Replace `CourseType` with `CourseScope`
- Remove `PLO` if the current accepted model is GO + CILO only
- Remove section-based student logic from MVP
- Convert deployment and response strings to enums
- Add template ownership and `is_faculty_accessible`
- Add industry partner profile/company support
- Normalize shared contracts for:
  - student academic context
  - deployment targeting
  - response rendering
  - leadership scope resolution

Outputs:
- stable schema and domain contracts
- no new feature built on deprecated section-based assumptions
- reusable types for later role-specific work

### Phase 1 — Admin Foundation

Build the operational setup layer that all role workflows depend on.

Implement:
- Programs and majors management
- Courses management
- Year levels management
- Users management and role assignment
- Student academic context management:
  - `program`
  - optional `major`
  - `year_level`
  - `academic_year`
  - `is_graduating`
- Faculty-to-program assignment
- Program-head-to-program assignment
- Industry partner records with company/program context
- Baseline instrument governance

UX direction:
- data-dense admin interface
- searchable lists and filterable tables
- create/edit flows with validation
- safe destructive actions and clear empty states

Outputs:
- downstream workflows become UI-driven instead of seed-driven
- all respondent targeting inputs exist
- all scoped role relationships are manageable in the system

### Phase 2 — Faculty + Student Vertical Slice

Complete the strongest end-to-end academic workflow and align it to the student
mockups.

Implement for Faculty:
- eligible course-context selection
- standalone CILO management
- derived course-bound evaluation configuration
- targeting by `program + optional major + year level`
- publish flow
- summarized result review for course-bound evaluations

Implement for Student:
- dashboard matching mockup information architecture
- summary cards for `Pending`, `In Progress`, `Submitted`
- `Continue` card for the latest resumable evaluation
- pending evaluations list with direct CTA
- evaluations page with status tabs, search, and progress cards
- evaluation form with quantitative and qualitative sections
- preview/review and explicit confirmation before submit
- submission history with read-only results
- profile showing academic context and graduating eligibility
- graduating-student survey surfaced as a normal assigned task when eligible

Outputs:
- one complete academic MVP story:
  - admin configures
  - faculty publishes
  - student responds
  - faculty reviews

### Phase 3 — Program Head Courses + Evaluation Tools

Make the Program Head portal real using the mockups as the UX guide.

Implement:
- program-scoped courses page and management flow
- evaluation tools page with:
  - `Templates`
  - `Published`
- template builder with:
  - template settings
  - section-based structure
  - question cards
  - Likert questions
  - guided open-ended questions
  - editable Likert descriptors
  - suggested-response arrays
  - faculty-access flag
- publication form with:
  - schedule
  - target stakeholder
  - audience targeting
  - student targeting by `program + optional major + year level`
  - stakeholder-specific targeting behavior for alumni and industry partner
    flows
- template save, edit, duplicate, and publish behavior
- published deployment records preserving template/version context and
  deployment status

Outputs:
- Program Head can manage program-owned tools end to end
- templates and deployments move from static scaffolds to persistent workflows

### Phase 4 — Alumni and Industry Partner Response Flows

Implement invite-backed external stakeholder completion flows using the shared
response engine.

Implement:
- invite-backed login/access entry
- assigned evaluation list
- stakeholder-specific evaluation rendering
- preview/confirm/submit flow
- post-submit read-only state
- one-response enforcement
- visibility limited to intended deployments

Reuse:
- shared form rendering
- shared submission protections
- shared response status model

Outputs:
- all required respondent groups can complete digital evaluations
- external stakeholder evidence enters the same reporting pipeline

### Phase 5 — Program Head + Dean Analytics and Reports

Build a shared leadership review layer with scope-based behavior.

Implement:
- one shared analytics/reporting subsystem
- Program Head scope = assigned program only
- Dean scope = college-wide by default with program filter and drill-down
- analytics views for:
  - mean summaries
  - qualitative summaries and word clouds
  - GO/CILO attainment where mappings exist
  - published-form review views
- reporting views for:
  - on-screen summaries first
  - structured report views second
  - export only after data correctness and scope enforcement are stable

Outputs:
- leadership roles can review program and college performance
- analytics and reports support CQI and MVP defense scenarios

### Phase 6 — UX Consolidation and PWA Readiness

Polish the system so the cross-role product feels coherent and demo-ready.

Implement:
- responsive navigation refinement
- student mobile bottom navigation behavior
- desktop-first leadership workspace refinement
- consistent empty/loading/error/success states
- install prompt and PWA shell
- demo role switching and reliable seeded walkthrough data
- visual consistency aligned with student and Program Head mockup direction

Outputs:
- the system feels like one product rather than disconnected portals
- all major role demos are stable and presentation-ready

## Important Interface and Type Changes

Public and shared contracts must reflect these decisions:

- Student academic context:
  - `program_id`
  - `major_id | null`
  - `year_level_id`
  - `academic_year`
  - `is_graduating`
- No `section_id` in student context, targeting, or MVP analytics
- Deployment targeting supports:
  - `program_id`
  - `major_id | null`
  - `year_level_id | null`
  - `target_stakeholder`
  - schedule/status fields
- Program Head template structure must support:
  - section title and description
  - ordered questions
  - question type
  - required flag
  - Likert point descriptors
  - suggested-response array for guided open-ended items
  - template ownership
  - `is_faculty_accessible`
- Student evaluation list contract must support:
  - dashboard counts
  - continue/resume state
  - due state
  - progress state
  - status tabs
- Published evaluation/deployment contract must support:
  - title
  - source template/version
  - publication date
  - status
  - allowed actions
- Leadership analytics contract must be shared by Program Head and Dean and
  parameterized by nullable program scope

## Test Plan

Validate each phase with behavior-focused tests.

Schema and contracts:
- no MVP service depends on section-based student logic
- enum-backed statuses and scope types are used consistently
- template ownership and faculty-access rules are enforced

Admin foundation:
- create/update/archive programs, majors, courses, and year levels
- manage users, role assignments, and academic context
- manage faculty/program-head assignments
- manage industry partner records and invite-ready context

Faculty + Student slice:
- faculty can publish with valid scoped context
- student sees only eligible evaluations
- dashboard counts and `Continue` state are correct
- evaluations tabs/search/status behavior works
- preview/confirm/submit is enforced
- submitted responses become read-only
- graduating-student tool visibility follows eligibility rules

Program Head tooling:
- courses page supports scoped management
- templates and published tabs reflect real persisted records
- builder preserves sections, ordering, descriptors, and suggestions
- publication resolves the correct target audience and schedule

External stakeholder flows:
- invited alumni and industry users see only intended deployments
- can complete once and see submitted state afterward

Leadership analytics and reports:
- Program Head sees only assigned-program data
- Dean sees college-wide data and can drill into a program
- summaries and attainment views use the correct scoped datasets

UX and regression:
- student portal remains mobile-first
- Program Head and Dean remain desktop-first
- navigation and shared shell patterns are consistent
- PWA shell and install flow do not break app routing

## Assumptions and Defaults

- The roadmap in this conversation is the source of truth; older planning notes
  that conflict with it are stale.
- Student context is fully sectionless for MVP.
- Student and Program Head mockups are strong UX guides, not pixel-locked
  specs.
- Program Head and Dean use the same portal architecture with different scope
  behavior.
- External stakeholder access is invite-backed, not anonymous.
- Export/report generation is lower priority than correct on-screen analytics
  and scoped visibility.
- Admin Foundation must be completed before deeper Program Head deployment
  workflows are treated as production-ready.
