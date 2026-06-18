## ADDED Requirements

### Requirement: Alumni Onboarding Form

The onboarding page at `/onboarding?intent=alumni` SHALL render an alumni-specific onboarding form. The form MUST collect the following fields:

- `graduation_year` — **required**, integer, the year the alumni graduated
- `program_id` — **required**, selected from active `Program` records

The form SHALL use `react-hook-form` with `customZodResolver` from `@/lib/forms/zod-resolver` for validation. The form SHALL be a client component (`"use client"`).

#### Scenario: Alumni form renders with required fields

- **Given** an authenticated user with no ALUMNI role
- **When** they navigate to `/onboarding?intent=alumni`
- **Then** the page SHALL render a form with a graduation year input and a program selector
- **And** the graduation year field SHALL be marked as required
- **And** the program selector SHALL be marked as required
- **And** the program selector SHALL be populated with active `Program` records
- **Verification:** Playwright E2E — navigate to `/onboarding?intent=alumni`, assert form fields visible and required.

#### Scenario: Alumni form validates graduation year

- **Given** the alumni onboarding form is displayed
- **When** the user submits the form without entering a graduation year
- **Then** the form SHALL display a validation error for the graduation year field
- **And** the form SHALL NOT submit the data to the server
- **Verification:** Vitest unit — render form, submit empty, assert validation error on `graduation_year`.

#### Scenario: Alumni form validates program selection

- **Given** the alumni onboarding form is displayed
- **When** the user submits the form without selecting a program
- **Then** the form SHALL display a validation error for the program field
- **Verification:** Vitest unit — render form, submit without program, assert validation error on `program_id`.

#### Scenario: Alumni form validates graduation year range

- **Given** the alumni onboarding form is displayed
- **When** the user enters a graduation year in the future (e.g., current year + 5)
- **Then** the form SHALL display a validation error indicating the year is invalid
- **And** when the user enters a year before a reasonable minimum (e.g., 1950)
- **Then** the form SHALL also reject it
- **Verification:** Vitest unit — test boundary values for graduation year validation.

---

### Requirement: Industry Partner Onboarding Form

The onboarding page at `/onboarding?intent=industry-partner` SHALL render an industry-partner-specific onboarding form. The form MUST collect the following fields:

- `company_name` — **required**, string, the name of the company or organization
- `position` — **optional**, string, the partner's position/title at the company
- `program_id` — **optional**, selected from active `Program` records (the academic program the partner is affiliated with)

The form SHALL use `react-hook-form` with `customZodResolver`.

#### Scenario: Industry partner form renders with correct fields

- **Given** an authenticated user with no INDUSTRY_PARTNER role
- **When** they navigate to `/onboarding?intent=industry-partner`
- **Then** the page SHALL render a form with company name, position, and program selector fields
- **And** the company name field SHALL be marked as required
- **And** the position field SHALL be marked as optional
- **And** the program selector SHALL be marked as optional
- **Verification:** Playwright E2E — navigate to `/onboarding?intent=industry-partner`, assert form fields visible with correct required/optional indicators.

#### Scenario: Industry partner form validates company name

- **Given** the industry partner onboarding form is displayed
- **When** the user submits the form without entering a company name
- **Then** the form SHALL display a validation error for the company name field
- **Verification:** Vitest unit — render form, submit empty, assert validation error on `company_name`.

#### Scenario: Industry partner form accepts submission without optional fields

- **Given** the industry partner onboarding form is displayed
- **When** the user enters only the company name and submits
- **Then** the form SHALL pass client-side validation
- **And** the form SHALL submit the data to the server action
- **Verification:** Vitest unit — render form, fill company name only, submit, assert no validation errors.

---

### Requirement: Transactional Profile and Role Creation

Server actions for alumni and industry partner onboarding SHALL create the profile record and assign the `UserRole` in a single database transaction. This ensures that a profile is never created without the corresponding role assignment, and vice versa. The server actions SHALL be located in `src/lib/actions/` following the existing naming convention. The server actions SHALL return `{ success: boolean; error?: string }`.

#### Scenario: Alumni onboarding creates profile and role atomically

- **Given** an authenticated user submits the alumni onboarding form with valid data (graduation_year: 2023, program_id: valid UUID)
- **When** the server action executes
- **Then** the server SHALL create an `AlumniProfile` record with the provided graduation_year and program_id
- **And** the server SHALL create a `UserRole` record with `role: ALUMNI` for the user
- **And** both operations SHALL occur within a single Prisma `$transaction`
- **And** the action SHALL return `{ success: true }`
- **Verification:** Vitest integration — call server action with valid input, assert both `AlumniProfile` and `UserRole` records exist in DB.

#### Scenario: Industry partner onboarding creates profile and role atomically

- **Given** an authenticated user submits the industry partner onboarding form with valid data (company_name: "TechCorp")
- **When** the server action executes
- **Then** the server SHALL create an `IndustryPartnerProfile` record with the provided fields
- **And** the server SHALL create a `UserRole` record with `role: INDUSTRY_PARTNER` for the user
- **And** both operations SHALL occur within a single Prisma `$transaction`
- **And** the action SHALL return `{ success: true }`
- **Verification:** Vitest integration — call server action, assert both records created.

#### Scenario: Transaction rollback on failure

- **Given** an authenticated user submits the alumni onboarding form
- **When** the `UserRole` creation fails (e.g., duplicate role)
- **Then** the `AlumniProfile` record SHALL NOT be persisted
- **And** the action SHALL return `{ success: false, error: "..." }`
- **Verification:** Vitest integration — mock a constraint violation on `UserRole`, assert no `AlumniProfile` created.

#### Scenario: Server action redirects to dashboard after success

- **Given** an authenticated user completes alumni onboarding
- **When** the server action returns `{ success: true }`
- **Then** the client SHALL redirect the user to `/alumni/dashboard`
- **Verification:** Playwright E2E — complete alumni onboarding, assert navigation to `/alumni/dashboard`.

#### Scenario: Server action redirects industry partner to dashboard

- **Given** an authenticated user completes industry partner onboarding
- **When** the server action returns `{ success: true }`
- **Then** the client SHALL redirect the user to `/industry-partner/dashboard`
- **Verification:** Playwright E2E — complete onboarding, assert navigation to `/industry-partner/dashboard`.

---

### Requirement: Escape Hatch Back to Portal

Both the alumni and industry partner onboarding forms SHALL include a "Not your role?" link (or equivalent escape hatch) that navigates the user back to `/portal`. This allows users who selected the wrong role to go back and choose a different one.

#### Scenario: Alumni form shows escape hatch

- **Given** the alumni onboarding form is displayed at `/onboarding?intent=alumni`
- **When** the user views the form
- **Then** there SHALL be a visible "Not your role?" link or similar escape text
- **And** clicking it SHALL navigate to `/portal`
- **Verification:** Playwright E2E — assert escape link visible, click it, assert URL is `/portal`.

#### Scenario: Industry partner form shows escape hatch

- **Given** the industry partner onboarding form is displayed at `/onboarding?intent=industry-partner`
- **When** the user views the form
- **Then** there SHALL be a visible "Not your role?" link or similar escape text
- **And** clicking it SHALL navigate to `/portal`
- **Verification:** Playwright E2E — assert escape link visible, click it, assert URL is `/portal`.

---

### Requirement: Onboarding Page Intent Routing

The existing onboarding page at `src/app/(public)/onboarding/page.tsx` SHALL be extended to handle `alumni` and `industry-partner` intent values in addition to the existing `student` intent. The page SHALL render the appropriate form based on the `intent` query parameter. Unknown or missing intents SHALL fallback to the existing student onboarding behavior (backward compatibility with existing `resolvePostLoginDestination` logic).

#### Scenario: Intent=student renders student form (existing behavior)

- **Given** an authenticated user
- **When** they navigate to `/onboarding?intent=student`
- **Then** the page SHALL render the existing student onboarding form
- **Verification:** Playwright E2E — navigate with `intent=student`, assert student form fields visible.

#### Scenario: Intent=alumni renders alumni form

- **Given** an authenticated user
- **When** they navigate to `/onboarding?intent=alumni`
- **Then** the page SHALL render the alumni onboarding form (graduation year + program)
- **And** the student-specific fields SHALL NOT be visible
- **Verification:** Playwright E2E — navigate with `intent=alumni`, assert alumni form rendered.

#### Scenario: Intent=industry-partner renders industry partner form

- **Given** an authenticated user
- **When** they navigate to `/onboarding?intent=industry-partner`
- **Then** the page SHALL render the industry partner onboarding form (company name + position + program)
- **Verification:** Playwright E2E — navigate with `intent=industry-partner`, assert industry partner form rendered.

#### Scenario: Unknown intent falls back to student

- **Given** an authenticated user
- **When** they navigate to `/onboarding?intent=unknown`
- **Then** the page SHALL fallback to the student onboarding form
- **Verification:** Playwright E2E — navigate with `intent=unknown`, assert student form rendered.

#### Scenario: Missing intent falls back to student

- **Given** an authenticated user
- **When** they navigate to `/onboarding` without an intent parameter
- **Then** the page SHALL fallback to the student onboarding form (backward compatibility)
- **Verification:** Playwright E2E — navigate to `/onboarding`, assert student form rendered.

---

### Requirement: User with Existing Role Visits Onboarding

When a user who already holds the role matching the onboarding intent navigates to the onboarding page, the system SHALL detect the existing role and redirect them to their dashboard instead of showing the onboarding form. This prevents duplicate profile creation.

#### Scenario: Existing alumni visits alumni onboarding

- **Given** a user who already has the ALUMNI role and an `AlumniProfile`
- **When** they navigate to `/onboarding?intent=alumni`
- **Then** the system SHALL redirect them to `/alumni/dashboard`
- **And** the onboarding form SHALL NOT be rendered
- **Verification:** Playwright E2E — log in as existing alumni, navigate to alumni onboarding, assert redirect to dashboard.

#### Scenario: Existing industry partner visits industry partner onboarding

- **Given** a user who already has the INDUSTRY_PARTNER role and an `IndustryPartnerProfile`
- **When** they navigate to `/onboarding?intent=industry-partner`
- **Then** the system SHALL redirect them to `/industry-partner/dashboard`
- **Verification:** Playwright E2E — log in as existing industry partner, navigate to onboarding, assert redirect.

#### Scenario: Existing student visits alumni onboarding (multi-role)

- **Given** a user who has the STUDENT role but NOT the ALUMNI role
- **When** they navigate to `/onboarding?intent=alumni`
- **Then** the system SHALL render the alumni onboarding form (the user is adding a second role)
- **And** upon successful submission, the user SHALL have both STUDENT and ALUMNI roles
- **Verification:** Playwright E2E — log in as student, navigate to alumni onboarding, complete form, assert both roles present.
