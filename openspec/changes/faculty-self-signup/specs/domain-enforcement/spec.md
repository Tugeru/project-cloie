## MODIFIED Requirements

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

#### Scenario: Faculty intent with ACD email succeeds

- **Given** a user initiates Google OAuth with `intent=faculty`
- **When** the auth callback receives the code and the user's email is `prof@acd.edu.ph`
- **Then** the callback SHALL proceed with session resolution and redirect to the appropriate destination
- **And** the user SHALL NOT be signed out
- **Verification:** Vitest unit — mock Supabase `exchangeCodeForSession` returning `@acd.edu.ph` email with `intent=faculty`, assert no sign-out and redirect to onboarding.

#### Scenario: Faculty intent with non-ACD email fails

- **Given** a user initiates Google OAuth with `intent=faculty`
- **When** the auth callback receives the code and the user's email is `prof@gmail.com`
- **Then** the callback SHALL call `supabase.auth.signOut()`
- **And** the callback SHALL redirect to `/login?error=invalid_domain`
- **Verification:** Vitest unit — mock non-ACD email with `intent=faculty`, assert rejection.
