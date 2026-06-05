## Context

CLOIE's RBAC infrastructure is ~60% built. The core plumbing — `SystemRole` enum, `UserRole` join table, `SessionGuard` route protection, primary role resolution, profile gates, Google OAuth, auth callback, and student onboarding — is fully functional.

What's missing is the **public-facing entry flow**: how a new user discovers their role, authenticates with appropriate domain enforcement, completes role-specific onboarding, and gets routed to their dashboard. Currently, all users are pre-provisioned via seed data or dev-auth.

### Current Auth Flow (Incomplete)
```
Landing Page → /login → Google OAuth → callback → resolve session → dashboard
                                         ↑ no domain check
                                         ↑ no role intent
```

### Target Auth Flow
```
Landing Page ("Get Started") → /portal → select role
  ├─ Internal (STUDENT) → Google OAuth (@acd.edu.ph) → callback + domain check → /onboarding?intent=student → dashboard
  ├─ External (ALUMNI) → Google OAuth (any) → callback (no domain check) → /onboarding?intent=alumni → dashboard
  ├─ External (INDUSTRY_PARTNER) → Google OAuth (any) → callback → /onboarding?intent=industry-partner → dashboard
  └─ Admin roles (ADMIN/DEAN/PROGRAM_HEAD/FACULTY) → "Invite only" / "Admin provisioned" (no self-registration)
```

## Goals / Non-Goals

**Goals:**
- Complete the public-facing auth entry flow with role selection, domain enforcement, and onboarding
- Add `AlumniProfile` and `VerificationStatus` to the data model following existing patterns
- Extend the onboarding page to handle alumni and industry partner intents
- Maintain backward compatibility with existing auth flows (direct `/login` still works)

**Non-Goals:**
- Admin verification UI for approving/rejecting alumni/industry partner profiles (future work)
- Email/password authentication (Google OAuth only, per tech stack)
- Role switching within an authenticated session
- Multi-role onboarding in a single flow
- Offline/PWA support for auth flows

## Decisions

### D1: Portal page as Server Component at `src/app/(public)/portal/page.tsx`

**Decision:** Create `/portal` as a Server Component under the existing `(public)/` route group.

**Rationale:** The portal is a static page with role cards — no client-side state needed. Server Components reduce client JS. The `(public)/` group already has `login/` and `onboarding/` with proper layout.

**Alternatives considered:**
- ~~Client Component with animations~~ — Unnecessary JS for a mostly-static page. Interaction (clicking a role card) just navigates to Google OAuth.
- ~~Add to landing page~~ — Landing page serves marketing purpose; role selection deserves its own focused page.

**Files:**
- `[NEW] src/app/(public)/portal/page.tsx` — Server Component, renders role cards
- `[NEW] src/features/portals/components/role-selection-card.tsx` — Client Component ("use client" justified: onClick handler triggers OAuth redirect)
- `[MODIFY] src/features/portals/index.ts` — Re-export `RoleSelectionCard`
- `[MODIFY] src/app/page.tsx` — Change CTA from "Sign In" → "Get Started" linking to `/portal`

### D2: Role intent via OAuth `redirectTo` query parameter

**Decision:** Pass role intent as a query parameter in the Supabase `signInWithOAuth` `redirectTo` URL: `/api/auth/callback?intent=student`.

**Rationale:** This is the simplest approach that works with Supabase OAuth. The existing `google-signin-button.tsx` already supports an `intent` prop. The callback route already reads query params.

**Alternatives considered:**
- ~~`sessionStorage`~~ — Fragile across redirects, doesn't survive OAuth round-trip reliably.
- ~~Separate callback routes per role~~ — Duplication, harder to maintain.
- ~~Cookie-based intent~~ — Adds complexity, race conditions.

**Files:**
- `[MODIFY] src/features/auth/components/google-signin-button.tsx` — Ensure `intent` is mapped from role selection
- `[MODIFY] src/app/api/auth/callback/route.ts` — Read `intent` param, pass to domain enforcement + post-login resolution

### D3: Domain enforcement in auth callback (server-side)

**Decision:** Add a domain validation function to the auth callback that checks the authenticated user's email domain against a role-conditional allowlist.

```
Internal roles (STUDENT, FACULTY): require @acd.edu.ph or @acdeducation.com
External roles (ALUMNI, INDUSTRY_PARTNER): any Google account
Admin roles (ADMIN, DEAN, PROGRAM_HEAD): N/A (invite-only, never hit self-registration)
No intent: skip domain check (backward compatibility)
```

**Rationale:** Server-side enforcement is the only secure option — client-side checks can be bypassed. The callback is the single chokepoint after OAuth.

**Files:**
- `[NEW] src/features/auth/services/validate-role-domain.ts` — Pure function: `(email: string, intent: SystemRole) => { valid: boolean; reason?: string }`
- `[MODIFY] src/app/api/auth/callback/route.ts` — Call `validateRoleDomain` after code exchange, redirect to `/login?error=invalid_domain&role=<role>` on failure
- `[MODIFY] src/app/(public)/login/page.tsx` — Display domain error message when `?error=invalid_domain`

### D4: Extend onboarding page with new intents

**Decision:** Extend the existing `src/app/(public)/onboarding/page.tsx` to handle `?intent=alumni` and `?intent=industry-partner` alongside the existing `?intent=student`.

**Rationale:** The onboarding page already has the pattern for intent-based form rendering. Extending it avoids route duplication and follows the existing architecture.

**Onboarding form components** ("use client" justified: react-hook-form):
- `[NEW] src/features/users/components/alumni-onboarding-form.tsx` — graduation_year (number), program_id (select). Uses `customZodResolver`.
- `[NEW] src/features/users/components/industry-partner-onboarding-form.tsx` — company_name (text, required), position (text, optional), program_id (select, optional). Uses `customZodResolver`.
- `[NEW] src/lib/actions/alumni-actions.ts` — `createAlumniProfile` server action
- `[NEW] src/lib/actions/industry-partner-actions.ts` — `createIndustryPartnerProfile` server action
- `[MODIFY] src/app/(public)/onboarding/page.tsx` — Route to correct form based on `?intent=`
- `[MODIFY] src/features/auth/services/resolve-post-login-destination.ts` — Handle `ALUMNI_ONBOARDING_REQUIRED` and `INDUSTRY_PARTNER_ONBOARDING_REQUIRED` profile gates

### D5: AlumniProfile model + VerificationStatus enum

**Decision:** Create `AlumniProfile` as a 1:1 model following the exact pattern of `StudentAcademicProfile` and `IndustryPartnerProfile`. Add `VerificationStatus` enum shared by both `AlumniProfile` and `IndustryPartnerProfile`.

```prisma
enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
  @@map("verification_status")
}

model AlumniProfile {
  id                  String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id             String             @unique @db.Uuid
  graduation_year     Int
  program_id          String             @db.Uuid
  verification_status VerificationStatus @default(PENDING)
  created_at          DateTime           @default(now())
  updated_at          DateTime           @updatedAt

  user    User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  program Program @relation(fields: [program_id], references: [id], onDelete: Restrict)

  @@map("alumni_profiles")
}
```

**Migration workflow:**
1. Edit `prisma/schema.prisma` — add `VerificationStatus` enum, `AlumniProfile` model, `verification_status` to `IndustryPartnerProfile`, `alumni_profile` relation on `User`, `alumni_profiles` relation on `Program`
2. `pnpm supabase:migration:diff -- add_alumni_profile_and_verification`
3. `pnpm supabase:push:dry-run`
4. `pnpm supabase:push`
5. `pnpm supabase:types`

**Files:**
- `[MODIFY] prisma/schema.prisma`
- `[NEW] supabase/migrations/<timestamp>_add_alumni_profile_and_verification.sql`
- `[REGENERATE] src/types/supabase-database.ts`

### D6: Profile gate extension

**Decision:** Extend the existing profile gate system to support `ALUMNI_ONBOARDING_REQUIRED` and `INDUSTRY_PARTNER_ONBOARDING_REQUIRED` statuses, following the same pattern as `STUDENT_ONBOARDING_REQUIRED`.

**Files:**
- `[MODIFY] src/features/auth/services/build-auth-session-snapshot.ts` — Check for alumni_profile/industry_partner_profile when role is ALUMNI/INDUSTRY_PARTNER
- `[MODIFY] src/features/auth/components/session-guard.tsx` — Handle new profile gate statuses
- `[MODIFY] src/features/auth/services/resolve-post-login-destination.ts` — Route to `/onboarding?intent=alumni` or `?intent=industry-partner`

### Auth Flow Sequence Diagram

```
┌──────┐   ┌───────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐
│ User │   │Portal │   │ Google  │   │ Callback │   │Onboarding│   │Dashboard│
└──┬───┘   └───┬───┘   └────┬────┘   └────┬─────┘   └────┬─────┘   └────┬────┘
   │           │            │             │              │              │
   │  GET /portal           │             │              │              │
   │──────────>│            │             │              │              │
   │           │            │             │              │              │
   │  Click "Alumni"        │             │              │              │
   │──────────>│            │             │              │              │
   │           │  signInWithOAuth         │              │              │
   │           │  (redirectTo=            │              │              │
   │           │   /api/auth/callback     │              │              │
   │           │   ?intent=alumni)        │              │              │
   │           │───────────>│             │              │              │
   │           │            │             │              │              │
   │           │ Google OAuth consent     │              │              │
   │<──────────────────────>│             │              │              │
   │           │            │             │              │              │
   │           │            │  GET /api/auth/callback     │              │
   │           │            │  ?code=X&intent=alumni      │              │
   │           │            │────────────>│              │              │
   │           │            │             │              │              │
   │           │            │             │ exchangeCode │              │
   │           │            │             │ validateRoleDomain(email, ALUMNI)
   │           │            │             │ → PASS (any domain OK)     │
   │           │            │             │              │              │
   │           │            │             │ resolveSession│              │
   │           │            │             │ profileGate = │              │
   │           │            │             │ ALUMNI_ONBOARDING_REQUIRED  │
   │           │            │             │              │              │
   │  302 /onboarding?intent=alumni       │              │              │
   │<────────────────────────────────────>│              │              │
   │           │            │             │              │              │
   │  Submit alumni form    │             │              │              │
   │─────────────────────────────────────────────────────>│              │
   │           │            │             │              │              │
   │           │            │             │ createAlumniProfile          │
   │           │            │             │ (PENDING)    │              │
   │           │            │             │              │              │
   │  302 /alumni/dashboard │             │              │              │
   │<─────────────────────────────────────────────────────────────────>│
   │           │            │             │              │              │
```

## Risks / Trade-offs

**[Risk] OAuth redirect preserves intent via URL params** → The intent parameter is visible in the URL and could theoretically be tampered with. **Mitigation:** Domain enforcement in the callback is the security gate, not the intent param. A user can set `intent=student` but if their email isn't `@acd.edu.ph`, they're rejected regardless. Intent is a UX hint, not a trust boundary.

**[Risk] Alumni verification is PENDING-only at launch** → No admin UI to approve/reject. **Mitigation:** Alumni/industry partners can still access their dashboard with PENDING status. Admin verification UI is a separate future change. Status can be manually updated via Supabase dashboard in the interim.

**[Risk] Profile gate complexity grows** → Adding ALUMNI_ONBOARDING_REQUIRED and INDUSTRY_PARTNER_ONBOARDING_REQUIRED increases the states in `buildAuthSessionSnapshot`. **Mitigation:** Follow the exact existing pattern for STUDENT_ONBOARDING_REQUIRED. The logic is a simple if/else chain, not a state machine.

**[Risk] Backward compatibility with direct `/login`** → Users who go directly to `/login` (without role intent) should still work. **Mitigation:** When no `intent` param is present, skip domain enforcement entirely. Existing behavior is preserved.

## Migration Plan

1. **Database first:** Apply Prisma schema changes → migration → push → types regen
2. **Server logic second:** Domain validation, profile gates, server actions
3. **UI third:** Portal page, onboarding forms, login page updates
4. **Tests fourth:** Unit tests for domain validation, profile gates; integration tests for onboarding forms
5. **Polish last:** Error states, loading states, "Not your role?" links

**Rollback strategy:** All changes are additive (new model, new enum, new field, new routes). No existing behavior is removed. Rollback = revert the migration and delete new files.

## Open Questions

_None — all key decisions are addressed above. Design is aligned with existing codebase patterns._
