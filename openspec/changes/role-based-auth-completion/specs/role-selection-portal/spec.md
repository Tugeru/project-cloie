## ADDED Requirements

### Requirement: Portal Page Route

The system SHALL render the role selection portal at the route `/portal` under the `(public)/` layout group. The page MUST be accessible without authentication. The page MUST use Server Components by default.

#### Scenario: Unauthenticated user visits portal

- **Given** a user who is not logged in
- **When** they navigate to `/portal`
- **Then** the page SHALL render successfully with HTTP 200
- **And** all 7 role cards SHALL be visible
- **Verification:** Playwright E2E — navigate to `/portal`, assert 7 role cards rendered.

#### Scenario: Portal route is under public layout group

- **Given** the Next.js App Router configuration
- **When** the portal page file exists at `src/app/(public)/portal/page.tsx`
- **Then** it SHALL share the `(public)/` layout (no `SessionGuard` wrapper)
- **And** it SHALL NOT require an authenticated session
- **Verification:** Vitest unit — confirm route file location; Playwright E2E — access without session cookie.

---

### Requirement: Role Card Display

The portal page SHALL display exactly 7 role cards, one for each value in the `SystemRole` enum: ADMIN, DEAN, PROGRAM_HEAD, FACULTY, STUDENT, ALUMNI, INDUSTRY_PARTNER. Each card SHALL display the role name in a user-friendly format (e.g., "Program Head" for PROGRAM_HEAD, "Industry Partner" for INDUSTRY_PARTNER).

#### Scenario: All seven roles rendered

- **Given** the portal page is loaded
- **When** the page finishes rendering
- **Then** there SHALL be exactly 7 role card elements
- **And** each card SHALL correspond to one unique `SystemRole` enum value
- **Verification:** Playwright E2E — query all role card elements, assert count is 7, assert text content matches all role names.

#### Scenario: Role cards display human-readable names

- **Given** the portal page is loaded
- **When** a user reads the PROGRAM_HEAD card
- **Then** the card label SHALL read "Program Head" (not "PROGRAM_HEAD")
- **And** the INDUSTRY_PARTNER card SHALL read "Industry Partner"
- **Verification:** Playwright E2E — assert card text for each role.

---

### Requirement: Internal Role Domain Indicator

Role cards for internal roles (ADMIN, DEAN, PROGRAM_HEAD, FACULTY, STUDENT) SHALL display a visual indicator stating that an ACD institutional email (`@acd.edu.ph` or `@acdeducation.com`) is required to register or sign in with that role.

#### Scenario: Student card shows ACD email requirement

- **Given** the portal page is loaded
- **When** the user views the STUDENT role card
- **Then** the card SHALL display text indicating "ACD email required" or equivalent
- **And** the indicator SHALL reference `@acd.edu.ph` or `@acdeducation.com` domains
- **Verification:** Playwright E2E — assert STUDENT card contains domain requirement text.

#### Scenario: Faculty card shows ACD email requirement

- **Given** the portal page is loaded
- **When** the user views the FACULTY role card
- **Then** the card SHALL display an ACD email requirement indicator
- **Verification:** Playwright E2E — assert FACULTY card contains domain requirement text.

#### Scenario: All five internal role cards show domain indicator

- **Given** the portal page is loaded
- **When** the user views cards for ADMIN, DEAN, PROGRAM_HEAD, FACULTY, and STUDENT
- **Then** each of these 5 cards SHALL include the ACD domain requirement indicator
- **And** the ALUMNI and INDUSTRY_PARTNER cards SHALL NOT include this indicator
- **Verification:** Playwright E2E — assert domain indicator presence/absence per role category.

---

### Requirement: External Role Acceptance Indicator

Role cards for external roles (ALUMNI, INDUSTRY_PARTNER) SHALL display a visual indicator stating that any Google account is accepted (no institutional email required).

#### Scenario: Alumni card shows any Google account accepted

- **Given** the portal page is loaded
- **When** the user views the ALUMNI role card
- **Then** the card SHALL display text indicating "Any Google account" or equivalent
- **And** the card SHALL NOT mention ACD email requirement
- **Verification:** Playwright E2E — assert ALUMNI card contains acceptance text and lacks domain restriction text.

#### Scenario: Industry Partner card shows any Google account accepted

- **Given** the portal page is loaded
- **When** the user views the INDUSTRY_PARTNER role card
- **Then** the card SHALL display text indicating any Google account is accepted
- **Verification:** Playwright E2E — assert INDUSTRY_PARTNER card contains acceptance text.

---

### Requirement: Admin Role Invite-Only Badge

Admin roles (ADMIN, DEAN, PROGRAM_HEAD) SHALL display an "Invite Only" badge on their cards. These cards SHALL be informational only — they MUST NOT include a self-registration call-to-action button. The card SHALL explain that these roles are assigned by an administrator.

#### Scenario: ADMIN card shows invite-only badge

- **Given** the portal page is loaded
- **When** the user views the ADMIN role card
- **Then** the card SHALL display a visible "Invite Only" badge
- **And** the card SHALL NOT contain a sign-in or register button
- **And** the card SHALL include text explaining admin provisioning (e.g., "Assigned by administrator")
- **Verification:** Playwright E2E — assert badge visible, no CTA button present.

#### Scenario: DEAN card shows invite-only badge

- **Given** the portal page is loaded
- **When** the user views the DEAN role card
- **Then** the card SHALL display a visible "Invite Only" badge
- **And** the card SHALL NOT contain a sign-in or register button
- **Verification:** Playwright E2E — assert badge visible, no CTA button present.

#### Scenario: PROGRAM_HEAD card shows invite-only badge

- **Given** the portal page is loaded
- **When** the user views the PROGRAM_HEAD role card
- **Then** the card SHALL display a visible "Invite Only" badge
- **And** the card SHALL NOT contain a sign-in or register button
- **Verification:** Playwright E2E — assert badge visible, no CTA button present.

#### Scenario: Self-service role cards do NOT show invite-only badge

- **Given** the portal page is loaded
- **When** the user views the STUDENT, ALUMNI, or INDUSTRY_PARTNER role cards
- **Then** none of these cards SHALL display the "Invite Only" badge
- **Verification:** Playwright E2E — assert badge absent on self-service cards.

---

### Requirement: Faculty Admin-Provisioned Notice

The FACULTY role card SHALL display a notice indicating that faculty accounts are provisioned by an administrator. The card MUST NOT include a self-registration call-to-action button. It SHALL be informational, similar to admin roles but with distinct messaging (e.g., "Account provisioned by your program head or admin").

#### Scenario: Faculty card shows admin-provisioned notice

- **Given** the portal page is loaded
- **When** the user views the FACULTY role card
- **Then** the card SHALL display text indicating the role is admin-provisioned
- **And** the card SHALL NOT contain a sign-up or register button
- **And** the card SHALL still show the ACD email requirement indicator
- **Verification:** Playwright E2E — assert provisioning notice present, no CTA button.

---

### Requirement: Self-Service Role OAuth Trigger

Selecting a self-service role card (STUDENT, ALUMNI, INDUSTRY_PARTNER) SHALL trigger Google OAuth sign-in with the selected role passed as an `intent` parameter. The OAuth redirect URL MUST include the role intent so the auth callback can determine domain requirements and post-login destination.

#### Scenario: Clicking STUDENT card triggers OAuth with student intent

- **Given** the portal page is loaded
- **When** the user clicks the STUDENT role card's sign-up button
- **Then** the system SHALL initiate Google OAuth via Supabase Auth
- **And** the `redirectTo` URL SHALL include `intent=student` as a query parameter
- **Verification:** Vitest unit — mock Supabase client, assert `signInWithOAuth` called with correct `redirectTo` containing `intent=student`.

#### Scenario: Clicking ALUMNI card triggers OAuth with alumni intent

- **Given** the portal page is loaded
- **When** the user clicks the ALUMNI role card's sign-up button
- **Then** the `redirectTo` URL SHALL include `intent=alumni` as a query parameter
- **Verification:** Vitest unit — mock Supabase client, assert `redirectTo` contains `intent=alumni`.

#### Scenario: Clicking INDUSTRY_PARTNER card triggers OAuth with industry-partner intent

- **Given** the portal page is loaded
- **When** the user clicks the INDUSTRY_PARTNER role card's sign-up button
- **Then** the `redirectTo` URL SHALL include `intent=industry-partner` as a query parameter
- **Verification:** Vitest unit — mock Supabase client, assert `redirectTo` contains `intent=industry-partner`.

---

### Requirement: Landing Page CTA Links to Portal

The landing page (`src/app/page.tsx`) SHALL include a primary call-to-action that links to `/portal`. The CTA text SHOULD read "Get Started" or equivalent (replacing any existing "Sign In" CTA that bypasses role selection).

#### Scenario: Landing page CTA navigates to portal

- **Given** a user visits the landing page at `/`
- **When** the page renders
- **Then** there SHALL be a primary CTA button/link pointing to `/portal`
- **And** clicking the CTA SHALL navigate the user to `/portal`
- **Verification:** Playwright E2E — click CTA, assert URL is `/portal`.

---

### Requirement: Authenticated User Visiting Portal

When a user who is already authenticated visits `/portal`, the page SHALL still render the role selection cards. The system SHOULD display context indicating the user is already logged in (e.g., show their email). If the user's profile gate status is `COMPLETE`, the page MAY offer a link to their dashboard alongside the role cards.

#### Scenario: Logged-in user with COMPLETE profile sees portal

- **Given** a user is authenticated with profile gate status `COMPLETE` and primary role STUDENT
- **When** they navigate to `/portal`
- **Then** the portal page SHALL render all 7 role cards
- **And** the page SHOULD display the user's current session context (e.g., email or current role)
- **And** the page MAY include a link to their existing dashboard at `/student/dashboard`
- **Verification:** Playwright E2E — log in as student, navigate to `/portal`, assert cards visible and session context shown.

#### Scenario: Logged-in user with ROLE_SELECTION_REQUIRED sees portal

- **Given** a user is authenticated but has no roles assigned (profile gate `ROLE_SELECTION_REQUIRED`)
- **When** they navigate to `/portal`
- **Then** the portal page SHALL render all 7 role cards with normal self-service OAuth triggers
- **And** no dashboard link SHALL be shown
- **Verification:** Playwright E2E — log in as user with no roles, navigate to `/portal`, assert no dashboard link.

#### Scenario: Multi-role user visiting portal

- **Given** a user is authenticated and holds both STUDENT and ALUMNI roles
- **When** they navigate to `/portal`
- **Then** the portal page SHALL still render all 7 role cards
- **And** the self-service cards SHALL remain functional (user can add another role)
- **Verification:** Playwright E2E — log in as multi-role user, navigate to `/portal`, assert cards are interactive.
