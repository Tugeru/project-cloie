## ADDED Requirements

### Requirement: Faculty Onboarding Profile Gate

When a user is authenticated and holds the FACULTY role, the system SHALL check if they have completed their program affiliations. If the user has zero records in the `FacultyProgramAffiliation` table, the profile gate status SHALL resolve to `FACULTY_ONBOARDING_REQUIRED` with `intent` as `faculty`. Under this status, the user MUST be redirected to `/onboarding?intent=faculty` when trying to access app pages.

#### Scenario: Faculty user with no program affiliations is gated

- **Given** an authenticated user with role FACULTY
- **And** the user has no entries in `faculty_program_affiliations` table
- **When** the session snapshot is resolved
- **Then** the profile gate status SHALL be `FACULTY_ONBOARDING_REQUIRED`
- **And** they SHALL be redirected to `/onboarding?intent=faculty`
- **Verification:** Vitest unit — mock session resolution, assert gate status and redirect destination.

#### Scenario: Faculty user with existing program affiliation bypasses gate

- **Given** an authenticated user with role FACULTY
- **And** the user has at least one active entry in `faculty_program_affiliations`
- **When** the session snapshot is resolved
- **Then** the profile gate status SHALL be `COMPLETE`
- **And** they SHALL NOT be redirected to `/onboarding`
- **Verification:** Vitest unit — mock session with existing affiliation, assert gate status is COMPLETE.

---

### Requirement: Faculty Onboarding Form Render

The onboarding route `/onboarding?intent=faculty` SHALL render a dedicated form for faculty profile setup. The form MUST display the user's institutional email as read-only. It MUST allow editing the user's First Name and Last Name (pre-filled from their Google account metadata). It MUST display a select dropdown populated with all available academic programs from the database to choose their primary program affiliation.

#### Scenario: Faculty onboarding page renders form fields

- **Given** an authenticated user under the `FACULTY_ONBOARDING_REQUIRED` gate
- **When** they navigate to `/onboarding?intent=faculty`
- **Then** the page SHALL render form inputs for "First Name" and "Last Name"
- **And** the inputs SHALL be pre-filled with values from the user's account metadata
- **And** the page SHALL display the user's email as read-only text
- **And** the page SHALL render an "Academic Program" dropdown containing active programs
- **Verification:** Playwright E2E — load `/onboarding?intent=faculty`, assert fields exist, assert email matches user, assert program dropdown is populated.

---

### Requirement: Faculty Profile Onboarding Form Submission

Submitting the faculty onboarding form SHALL validate user inputs client-side and server-side. The First Name and Last Name fields MUST be non-empty. A valid program ID MUST be selected. Upon successful validation, the form SHALL call the server action `registerFacultyProfile`. This action SHALL update the User record in the database with the verified first name and last name, insert a `FacultyProgramAffiliation` record mapping the user to the selected program with `is_primary = true` and `is_active = true`, and then redirect the user to `/dashboard` (which resolves to the faculty dashboard).

#### Scenario: Submit form with valid data succeeds

- **Given** a user is on the faculty onboarding form page
- **When** they fill in a valid first name, last name, and select an academic program
- **And** they click the "Submit and Continue" button
- **Then** the system SHALL update the User's first_name and last_name in the database
- **And** the system SHALL create a `FacultyProgramAffiliation` mapping this user to the selected program
- **And** the system SHALL redirect the user to `/dashboard`
- **Verification:** Playwright E2E — fill form, submit, assert database updates, assert redirect to `/faculty/dashboard` (or resolve-post-login-destination target).

#### Scenario: Submit form with missing fields fails

- **Given** a user is on the faculty onboarding form page
- **When** they clear the first name field and attempt to submit the form
- **Then** the form SHALL show validation errors indicating "First Name is required"
- **And** no database records SHALL be created or updated
- **And** no redirect SHALL occur
- **Verification:** Playwright E2E — trigger client validation, assert error message visible, assert URL remains unchanged.
