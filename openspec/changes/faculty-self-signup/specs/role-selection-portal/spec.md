## MODIFIED Requirements

### Requirement: Faculty Admin-Provisioned Notice

The FACULTY role card SHALL NOT display a notice stating that faculty accounts are admin-provisioned and SHALL NOT be informational only. The card MUST include a self-registration call-to-action button allowing users to sign up or sign in as FACULTY.

#### Scenario: Faculty card shows self-registration CTA

- **Given** the portal page is loaded
- **When** the user views the FACULTY role card
- **Then** the card SHALL contain a Google OAuth call-to-action button
- **And** the card SHALL display the ACD email requirement indicator
- **Verification:** Playwright E2E — assert FACULTY card contains Google OAuth button and ACD domain requirement indicator.

---

### Requirement: Self-Service Role OAuth Trigger

Selecting a self-service role card (STUDENT, FACULTY, ALUMNI, INDUSTRY_PARTNER) SHALL trigger Google OAuth sign-in with the selected role passed as an `intent` parameter. The OAuth redirect URL MUST include the role intent so the auth callback can determine domain requirements and post-login destination.

#### Scenario: Clicking STUDENT card triggers OAuth with student intent

- **Given** the portal page is loaded
- **When** the user clicks the STUDENT role card's sign-up button
- **Then** the system SHALL initiate Google OAuth via Supabase Auth
- **And** the `redirectTo` URL SHALL include `intent=student` as a query parameter
- **Verification:** Vitest unit — mock Supabase client, assert `signInWithOAuth` called with correct `redirectTo` containing `intent=student`.

#### Scenario: Clicking FACULTY card triggers OAuth with faculty intent

- **Given** the portal page is loaded
- **When** the user clicks the FACULTY role card's sign-up button
- **Then** the system SHALL initiate Google OAuth via Supabase Auth
- **And** the `redirectTo` URL SHALL include `intent=faculty` as a query parameter
- **Verification:** Vitest unit — mock Supabase client, assert `signInWithOAuth` called with correct `redirectTo` containing `intent=faculty`.

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
