## 1. Database Schema — AlumniProfile + VerificationStatus

- [x] 1.1 Add `VerificationStatus` enum (`PENDING`, `APPROVED`, `REJECTED`) to `prisma/schema.prisma` with `@@map("verification_status")`
- [x] 1.2 Add `AlumniProfile` model to `prisma/schema.prisma` — `id` (UUID), `user_id` (unique, FK → User), `graduation_year` (Int), `program_id` (FK → Program), `verification_status` (VerificationStatus, default PENDING), `created_at`, `updated_at`. Map to `alumni_profiles`
- [x] 1.3 Add `verification_status` field (VerificationStatus, default PENDING) to existing `IndustryPartnerProfile` model
- [x] 1.4 Add `alumni_profile` relation to `User` model (1:1, optional)
- [x] 1.5 Add `alumni_profiles` relation to `Program` model
- [x] 1.6 Generate migration: `pnpm supabase:migration:diff -- add_alumni_profile_and_verification`
- [x] 1.7 Dry-run migration: `pnpm supabase:push:dry-run`
- [x] 1.8 Apply migration: `pnpm supabase:push`
- [x] 1.9 Regenerate types: `pnpm supabase:types`
- [x] 1.10 Verify: `pnpm build` (confirms Prisma types compile)

> **Commit:** `feat(schema): add alumni profile model and verification status enum`

---

## 2. Domain Enforcement — Server-Side Validation

- [x] 2.1 Create `src/features/auth/services/validate-role-domain.ts` — pure function `validateRoleDomain(email: string, intent: SystemRole): { valid: boolean; reason?: string }`. Internal roles (STUDENT, FACULTY) require `@acd.edu.ph` or `@acdeducation.com`. External roles (ALUMNI, INDUSTRY_PARTNER) accept any domain. Admin roles (ADMIN, DEAN, PROGRAM_HEAD) reject with "invite-only" reason
- [x] 2.2 Create unit test `src/__tests__/features/auth/services/validate-role-domain.test.ts` — test all 7 roles × valid/invalid domain combinations + no-intent case
- [x] 2.3 Modify `src/app/api/auth/callback/route.ts` — after code exchange, read `intent` query param, call `validateRoleDomain`, redirect to `/login?error=invalid_domain&role=<role>` on failure
- [x] 2.4 Modify `src/app/(public)/login/page.tsx` — read `?error=invalid_domain&role=<role>` query params, display domain violation error message with role context
- [x] 2.5 Verify: `pnpm vitest run src/__tests__/features/auth/services/validate-role-domain.test.ts && pnpm lint && pnpm build`

> **Commit:** `feat(auth): add role-conditional domain enforcement in auth callback`

---

## 3. Profile Gate Extension — Alumni + Industry Partner Onboarding Gates

- [x] 3.1 Extend profile gate types to include `ALUMNI_ONBOARDING_REQUIRED` and `INDUSTRY_PARTNER_ONBOARDING_REQUIRED` in the profile gate resolution logic
- [x] 3.2 Modify `src/features/auth/services/build-auth-session-snapshot.ts` — when primary role is ALUMNI and no `AlumniProfile` exists, set gate to `ALUMNI_ONBOARDING_REQUIRED`. Same for INDUSTRY_PARTNER without `IndustryPartnerProfile`
- [x] 3.3 Modify `src/features/auth/services/resolve-post-login-destination.ts` — map `ALUMNI_ONBOARDING_REQUIRED` → `/onboarding?intent=alumni`, `INDUSTRY_PARTNER_ONBOARDING_REQUIRED` → `/onboarding?intent=industry-partner`
- [x] 3.4 Modify `src/features/auth/components/session-guard.tsx` — handle new profile gate statuses (redirect to onboarding)
- [x] 3.5 Add unit tests for new profile gate resolution paths
- [x] 3.6 Verify: `pnpm test && pnpm lint && pnpm build`

> **Commit:** `feat(auth): extend profile gates for alumni and industry partner onboarding`

---

## 4. Server Actions — Alumni + Industry Partner Onboarding

- [x] 4.1 Create `src/lib/actions/alumni-actions.ts` — `createAlumniProfile` server action. Validates with Zod schema (graduation_year: number, program_id: UUID). Creates `AlumniProfile` + `UserRole(ALUMNI)` in a Prisma `$transaction`. Returns `{ success: boolean; error?: string }`
- [x] 4.2 Create `src/lib/actions/industry-partner-actions.ts` — `createIndustryPartnerProfile` server action. Validates with Zod schema (company_name: string required, position: string optional, program_id: UUID optional). Creates `IndustryPartnerProfile` + `UserRole(INDUSTRY_PARTNER)` in a Prisma `$transaction`. Returns `{ success: boolean; error?: string }`
- [x] 4.3 Add unit tests for both server actions — success paths, validation failures, duplicate role handling
- [x] 4.4 Verify: `pnpm test && pnpm lint && pnpm build`

> **Commit:** `feat(actions): add alumni and industry partner onboarding server actions`

---

## 5. Portal Page UI — Role Selection

- [x] 5.1 Create `src/features/portals/components/role-selection-card.tsx` — Client Component ("use client" for onClick). Props: role (SystemRole), title, description, requiresAcdEmail (boolean), isInviteOnly (boolean), isAdminProvisioned (boolean). Self-service roles show Google OAuth button; invite-only/admin-provisioned show informational badge
- [x] 5.2 Create `src/features/portals/lib/role-card-config.ts` — static config array mapping each SystemRole to display metadata (title, description, icon, category flags)
- [x] 5.3 Create `src/app/(public)/portal/page.tsx` — Server Component. Renders heading + grid of `RoleSelectionCard` for all 7 roles. Self-service roles: STUDENT, ALUMNI, INDUSTRY_PARTNER. Invite-only: ADMIN, DEAN, PROGRAM_HEAD. Admin-provisioned: FACULTY
- [x] 5.4 Update `src/features/portals/index.ts` — re-export `RoleSelectionCard`
- [x] 5.5 Modify `src/app/page.tsx` — change primary CTA from "Sign In" → "Get Started" linking to `/portal`
- [x] 5.6 Verify: `pnpm lint && pnpm build`

> **Commit:** `feat(portal): add role selection portal page with role cards`

---

## 6. Onboarding Forms UI — Alumni + Industry Partner

- [x] 6.1 Create `src/features/users/components/alumni-onboarding-form.tsx` — Collects graduation year and program ID. Uses `createAlumniProfile` server action.
- [x] 6.2 Create `src/features/users/components/industry-partner-onboarding-form.tsx` — Collects company name, position, and program ID. Uses `createIndustryPartnerProfile` server action.
- [x] 6.3 Update `src/app/(public)/onboarding/page.tsx` — Extend to parse `intent` (alumni, industry-partner) and render the corresponding form. Fall back to student if missing/unknown. Add logic to bypass form if user already has the requested role.
- [x] 6.4 Verify: `pnpm lint && pnpm build`

> **Commit:** `feat(onboarding): add alumni and industry partner onboarding forms`

---

## 7. Verification Banner — Dashboard UI

- [x] 7.1 Create `src/features/auth/components/verification-status-banner.tsx` — Server Component. Accepts `verificationStatus: VerificationStatus`. Renders contextual banner: PENDING (info), APPROVED (success, dismissible), REJECTED (warning with contact info)
- [x] 7.2 Add verification banner to alumni dashboard layout `src/app/(app)/alumni/layout.tsx` — fetch `AlumniProfile.verification_status`, render banner if not APPROVED
- [x] 7.3 Add verification banner to industry partner dashboard layout `src/app/(app)/industry-partner/layout.tsx` — fetch `IndustryPartnerProfile.verification_status`, render banner
- [x] 7.4 Verify: `pnpm lint && pnpm build`

> **Commit:** `feat(ui): add verification status banner to alumni and industry partner dashboards`

---

## 8. Integration Tests + Polish

- [x] 8.1 Vitest unit test: `ROLE_CARDS` config — STUDENT role generates `intent=student` in redirectTo param
- [x] 8.2 Vitest unit test: `ROLE_CARDS` config — ALUMNI role generates `intent=alumni` in redirectTo param
- [x] 8.3 Vitest unit test: `resolveProfileGate` — `ALUMNI_ONBOARDING_REQUIRED` gate uses intent=`alumni`; `INDUSTRY_PARTNER_ONBOARDING_REQUIRED` gate uses intent=`industry-partner`
- [x] 8.4 Vitest unit test: escape hatch — gate intent strings map to onboarding forms that include `/portal` back-navigation link
- [x] 8.5 Update seed data (`prisma/seed.ts`) — added alumni profiles for ALU_BSIT (PENDING) and ALU_BSBA (APPROVED); IP profiles now have explicit verification_status (IND_BSIT=PENDING, IND_BSHM=APPROVED)
- [x] 8.6 Final verification: `pnpm lint && pnpm test && pnpm build` ✓

> **Commit:** `test(auth): add unit tests for role selection and onboarding flows`
