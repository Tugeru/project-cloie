## Why

Currently, CLOIE's role-based auth system treats faculty accounts as admin-provisioned only, without self-service registration or onboarding capabilities on the `/portal` page. However, faculty members should also be allowed to sign up themselves via institutional Google OAuth and select their program affiliations, just like students do. Allowing self-signup for faculty reduces administrative overhead and streamlines onboarding during the deployment of the evaluation platform.

## What Changes

**Already exists (no changes needed):**
- `SystemRole` enum contains the `FACULTY` role.
- `FacultyProgramAffiliation` table maps faculty users to academic programs.
- Domain validation is structured to enforce `@acd.edu.ph` or `@acdeducation.com` for internal roles (including `FACULTY`).

**New capabilities to build:**
- `faculty-onboarding`: Faculty profile onboarding form and flow that allows self-signed-up faculty members to select their primary academic program and complete their identity profiles.
- `FacultyProgramAffiliation` creation server action to link the faculty user with their selected program during onboarding.

**Modifications to existing code:**
- **Role Selection Portal (`/portal`)**: Modify the `FACULTY` card to have an active Google OAuth registration/sign-in call-to-action button rather than the informational "Account provisioned" badge.
- **Profile Gate Resolution (`resolveProfileGate`)**: Add a new profile gate state `FACULTY_ONBOARDING_REQUIRED` when a user has the `FACULTY` role but has not completed their program affiliations.
- **Onboarding Page Routing (`/onboarding`)**: Support `?intent=faculty` to render the new faculty onboarding form.
- **Post-Login Destination Resolution (`resolvePostLoginDestination`)**: Handle `FACULTY_ONBOARDING_REQUIRED` gate by redirecting to `/onboarding?intent=faculty`.
- **Auth Callback (`/api/auth/callback`)**: Ensure that a Google OAuth sign-in with `intent=faculty` enforces the `@acd.edu.ph` or `@acdeducation.com` domains.

**Database migrations required:** No database migration is required. The existing `FacultyProgramAffiliation` model is sufficient to represent a faculty member's program affiliation.

## Capabilities

### New Capabilities
- `faculty-onboarding`: A self-service onboarding flow for faculty members to provide their first and last names, and select their primary academic program affiliation.

### Modified Capabilities
- `role-selection-portal`: Update the `FACULTY` role card behavior on `/portal` to trigger self-service registration/login using Google OAuth with the `intent=faculty` query parameter.
- `domain-enforcement`: Extend institutional domain check constraints to apply to the newly enabled self-service `FACULTY` registration route.

## Impact

**Affected feature modules:**
- `src/features/auth/` — Extend intent handling in OAuth buttons, callback route, and post-login destination helper.
- `src/features/portals/` — Enable interactive state for the faculty selection card on `/portal`.
- `src/features/users/` — Extend profile gates, onboarding controller, and add a faculty onboarding form.

**Affected routes:**
- Modified: `src/app/(public)/portal/page.tsx`
- Modified: `src/app/(public)/onboarding/page.tsx`
- Modified: `src/app/api/auth/callback/route.ts`
- New: `src/features/users/components/faculty-onboarding-form.tsx` (rendered under onboarding route)
- New: `src/lib/actions/faculty-actions.ts` (server actions for registering faculty profiles)

**Constitution Compliance:**
- **pnpm only**: Built and configured using standard package patterns.
- **Server Components default**: The `/portal` page remains a Server Component; onboarding client form uses "use client" only for reactive form states.
- **Custom Zod Resolver**: The new faculty onboarding form uses `customZodResolver` and standard Zod schemas.
- **No unnecessary DB migration**: Avoids creating a new database model since the existing `FacultyProgramAffiliation` model satisfies all requirements.
- **Linting & Verification**: All changes are structured to satisfy standard TypeScript/Prisma constraints.
