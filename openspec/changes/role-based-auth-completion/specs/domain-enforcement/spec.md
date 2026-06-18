## ADDED Requirements

### Requirement: Internal Role Domain Enforcement

The auth callback at `src/app/api/auth/callback/route.ts` SHALL enforce ACD institutional domain validation when the OAuth `intent` query parameter specifies an internal role. Internal roles are STUDENT and FACULTY (the only internal roles that reach the callback via self-service or admin-provisioned flows). The accepted domains SHALL be `@acd.edu.ph` and `@acdeducation.com`. If the authenticated user's email does not match an accepted domain, the system SHALL reject the sign-in attempt.

#### Scenario: Student intent with ACD email succeeds

- **Given** a user initiates Google OAuth with `intent=student`
- **When** the auth callback receives the code and the user's email is `juan@acd.edu.ph`
- **Then** the callback SHALL proceed with session resolution and redirect to the appropriate destination
- **And** the user SHALL NOT be signed out
- **Verification:** Vitest unit — mock Supabase `exchangeCodeForSession` returning `@acd.edu.ph` email with `intent=student`, assert no sign-out and redirect to onboarding.

#### Scenario: Student intent with acdeducation.com email succeeds

- **Given** a user initiates Google OAuth with `intent=student`
- **When** the auth callback receives the code and the user's email is `juan@acdeducation.com`
- **Then** the callback SHALL proceed with session resolution
- **Verification:** Vitest unit — mock email `@acdeducation.com` with `intent=student`, assert success redirect.

#### Scenario: Student intent with non-ACD email fails

- **Given** a user initiates Google OAuth with `intent=student`
- **When** the auth callback receives the code and the user's email is `juan@gmail.com`
- **Then** the callback SHALL call `supabase.auth.signOut()` to invalidate the session
- **And** the callback SHALL redirect to `/login?error=invalid_domain`
- **Verification:** Vitest unit — mock `@gmail.com` email with `intent=student`, assert sign-out called and redirect to login with error.

#### Scenario: Faculty intent with non-ACD email fails

- **Given** a user initiates Google OAuth with `intent=faculty`
- **When** the auth callback receives the code and the user's email is `prof@gmail.com`
- **Then** the callback SHALL call `supabase.auth.signOut()`
- **And** the callback SHALL redirect to `/login?error=invalid_domain`
- **Verification:** Vitest unit — mock non-ACD email with `intent=faculty`, assert rejection.

---

### Requirement: External Role Domain Bypass

The auth callback SHALL allow any valid Google email domain when the OAuth `intent` query parameter specifies an external role. External roles are ALUMNI and INDUSTRY_PARTNER. No domain restriction SHALL be applied for these intents.

#### Scenario: Alumni intent with Gmail account succeeds

- **Given** a user initiates Google OAuth with `intent=alumni`
- **When** the auth callback receives the code and the user's email is `grad@gmail.com`
- **Then** the callback SHALL proceed with session resolution
- **And** the user SHALL NOT be signed out
- **And** the callback SHALL redirect to the appropriate post-login destination
- **Verification:** Vitest unit — mock `@gmail.com` email with `intent=alumni`, assert no sign-out and successful redirect.

#### Scenario: Industry partner intent with corporate email succeeds

- **Given** a user initiates Google OAuth with `intent=industry-partner`
- **When** the auth callback receives the code and the user's email is `hr@techcorp.com`
- **Then** the callback SHALL proceed with session resolution without domain validation
- **Verification:** Vitest unit — mock `@techcorp.com` email with `intent=industry-partner`, assert success.

#### Scenario: Alumni intent with ACD email also succeeds

- **Given** a user initiates Google OAuth with `intent=alumni`
- **When** the auth callback receives the code and the user's email is `former.student@acd.edu.ph`
- **Then** the callback SHALL proceed normally (ACD emails are a superset of "any Google account")
- **Verification:** Vitest unit — mock ACD email with `intent=alumni`, assert success.

#### Scenario: Industry partner intent with ACD email succeeds

- **Given** a user initiates Google OAuth with `intent=industry-partner`
- **When** the auth callback receives the code and the user's email is `partner@acdeducation.com`
- **Then** the callback SHALL proceed normally
- **Verification:** Vitest unit — mock ACD email with `intent=industry-partner`, assert success.

---

### Requirement: Domain Violation Redirect with Context

When a domain violation occurs (internal role intent with non-ACD email), the redirect to `/login` SHALL include the `error=invalid_domain` query parameter. The redirect SHOULD also include the `role` query parameter indicating which role was attempted, so the login page can display a contextual error message.

#### Scenario: Redirect includes role context on domain violation

- **Given** a user initiates Google OAuth with `intent=student`
- **When** the auth callback detects a non-ACD email (`user@gmail.com`)
- **Then** the redirect URL SHALL be `/login?error=invalid_domain&role=student`
- **Verification:** Vitest unit — assert redirect URL contains both `error=invalid_domain` and `role=student` params.

#### Scenario: Login page displays domain error message

- **Given** a user is redirected to `/login?error=invalid_domain&role=student`
- **When** the login page renders
- **Then** the page SHALL display an error message explaining that the STUDENT role requires an ACD institutional email
- **And** the message SHALL reference the accepted domains (`@acd.edu.ph`, `@acdeducation.com`)
- **Verification:** Playwright E2E — navigate to `/login?error=invalid_domain&role=student`, assert error message visible with domain info.

#### Scenario: Login page displays generic domain error without role

- **Given** a user is redirected to `/login?error=invalid_domain` (without role param, for backward compatibility)
- **When** the login page renders
- **Then** the page SHALL display a generic domain error message (e.g., "An institutional email is required for this role")
- **Verification:** Playwright E2E — navigate to `/login?error=invalid_domain`, assert generic error message visible.

---

### Requirement: Role Intent Passed via OAuth Flow

The role intent (e.g., `student`, `alumni`, `industry-partner`) SHALL be passed as a query parameter in the `redirectTo` URL used by Supabase OAuth. The auth callback SHALL read this intent from `searchParams` when the OAuth flow completes. The intent value MUST survive the full OAuth round-trip (client → Google → Supabase → callback).

#### Scenario: Intent parameter round-trips through OAuth

- **Given** a user clicks the STUDENT card on the portal page
- **When** `GoogleSignInButton` calls `supabase.auth.signInWithOAuth` with `redirectTo` containing `intent=student`
- **Then** when the OAuth callback fires at `/api/auth/callback?intent=student&code=...`
- **And** the callback SHALL read `searchParams.get("intent")` and receive `"student"`
- **Verification:** Vitest unit — simulate callback request with `intent=student` query param, assert intent correctly extracted.

#### Scenario: Intent parameter supports alumni value

- **Given** a user clicks the ALUMNI card on the portal page
- **When** the OAuth flow completes
- **Then** the callback SHALL receive `intent=alumni` from `searchParams`
- **Verification:** Vitest unit — assert `searchParams.get("intent")` returns `"alumni"`.

#### Scenario: Intent parameter supports industry-partner value

- **Given** a user clicks the INDUSTRY_PARTNER card on the portal page
- **When** the OAuth flow completes
- **Then** the callback SHALL receive `intent=industry-partner` from `searchParams`
- **Verification:** Vitest unit — assert `searchParams.get("intent")` returns `"industry-partner"`.

---

### Requirement: No Domain Check Without Intent (Backward Compatibility)

When the auth callback is invoked without a role `intent` query parameter (e.g., from the existing login page or a direct OAuth flow), the callback SHALL apply the current default domain enforcement behavior: requiring ACD domain for all sign-ins. This ensures backward compatibility with the existing login flow at `/login`.

#### Scenario: No intent parameter preserves existing behavior

- **Given** a user signs in from the `/login` page without role intent
- **When** the auth callback receives the code without an `intent` parameter
- **Then** the callback SHALL enforce ACD domain restriction (existing behavior)
- **And** non-ACD emails SHALL be rejected with redirect to `/login?error=invalid_domain`
- **Verification:** Vitest unit — simulate callback without `intent` param, assert ACD domain check is applied.

#### Scenario: No intent with ACD email succeeds

- **Given** a user signs in from `/login` without role intent
- **When** the callback receives the code and the user's email is `user@acd.edu.ph`
- **Then** the callback SHALL proceed with session resolution
- **Verification:** Vitest unit — assert ACD email without intent succeeds.

#### Scenario: No intent with non-ACD email fails

- **Given** a user signs in from `/login` without role intent
- **When** the callback receives the code and the user's email is `user@gmail.com`
- **Then** the callback SHALL sign the user out and redirect to `/login?error=invalid_domain`
- **Verification:** Vitest unit — assert non-ACD email without intent is rejected.

---

### Requirement: Admin Role Intents Are Not Reachable via Self-Service

The auth callback SHALL NOT accept `intent` values for admin roles (ADMIN, DEAN, PROGRAM_HEAD) from the self-service OAuth flow. If an `intent` value of `admin`, `dean`, or `program-head` is received, the callback SHALL treat it as an invalid intent and fall back to default domain enforcement behavior (ACD domain required).

#### Scenario: Admin intent treated as default flow

- **Given** a crafted OAuth request with `intent=admin`
- **When** the auth callback processes the request
- **Then** the callback SHALL NOT treat this as a valid admin registration
- **And** the callback SHALL apply default ACD domain enforcement
- **Verification:** Vitest unit — simulate callback with `intent=admin`, assert default domain check behavior (no special admin handling).

#### Scenario: Dean intent treated as default flow

- **Given** a crafted OAuth request with `intent=dean`
- **When** the auth callback processes the request
- **Then** the callback SHALL fall back to default domain enforcement
- **Verification:** Vitest unit — simulate callback with `intent=dean`, assert default behavior.
