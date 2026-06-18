## Why

CLOIE's role-based auth system is ~60% complete. The core RBAC infrastructure — `SystemRole` enum, `UserRole` join table, `SessionGuard` route protection, primary role resolution, 7 per-role route groups, and dev auth — is fully operational with 24 seeded demo users.

However, the **public-facing entry flow** is missing. There is no role selection portal, no domain enforcement distinguishing internal vs external roles, no onboarding for alumni or industry partners, and no alumni profile model. Users currently bypass role selection entirely and rely on dev-auth or pre-provisioned accounts. This blocks realistic auth flows for production and demo environments.

## What Changes

**Already exists (no changes needed):**
- `SystemRole` enum with 7 roles (ADMIN, DEAN, PROGRAM_HEAD, FACULTY, STUDENT, ALUMNI, INDUSTRY_PARTNER)
- `UserRole` many-to-many join table
- `SessionGuard` layout-level route protection for all 7 role groups
- Primary role resolution with hierarchy (ADMIN=100 → STUDENT=10)
- Profile gates (ROLE_SELECTION_REQUIRED, STUDENT_ONBOARDING_REQUIRED, COMPLETE)
- Google OAuth with intent support in `google-signin-button.tsx`
- Auth callback route (`api/auth/callback`)
- Student onboarding flow and `StudentAcademicProfile` model
- `IndustryPartnerProfile` model (without verification status)
- Dev auth with role switcher

**New capabilities to build:**
- Role selection portal page at `/portal` with cards for all 7 roles
- ACD domain enforcement — internal roles require `@acd.edu.ph` or `@acdeducation.com`, external roles allow any Google account
- `AlumniProfile` model (1:1 with User) with verification status
- `VerificationStatus` enum (PENDING, APPROVED, REJECTED)
- `verification_status` field on existing `IndustryPartnerProfile`
- Alumni onboarding form (graduation year, program)
- Industry partner onboarding form (company name, position, program)
- Role-aware error handling for domain violations
- "Not your role?" escape hatch on onboarding pages
- Landing page CTA changed from "Sign In" to "Get Started" → `/portal`

**Modifications to existing code:**
- Auth callback route — make domain check conditional on role intent
- `google-signin-button.tsx` — pass role intent through OAuth redirect
- `resolve-post-login-destination.ts` — handle new onboarding intents (alumni, industry-partner)
- Onboarding page — extend with `?intent=alumni` and `?intent=industry-partner` form variants
- Login page — accept `?role=` param for role-specific messaging
- `User` model — add `alumni_profile` relation
- Seed data — add alumni and industry partner onboarding flows to test scenarios

**Database migrations required:** Yes — `AlumniProfile` model, `VerificationStatus` enum, `verification_status` on `IndustryPartnerProfile`, `alumni_profile` relation on `User`.

## Capabilities

### New Capabilities
- `role-selection-portal`: Public-facing portal page at `/portal` with role cards for all 7 system roles, domain requirement indicators, and OAuth integration
- `domain-enforcement`: Role-conditional domain validation in the auth callback — internal roles require ACD institutional email, external roles accept any Google account
- `external-onboarding`: Alumni and industry partner onboarding forms with role-specific profile creation, verification status tracking, and "Not your role?" escape hatch
- `alumni-verification`: AlumniProfile data model with verification workflow (PENDING → APPROVED/REJECTED), mirroring the pattern for IndustryPartnerProfile

### Modified Capabilities
_(No existing openspec/specs/ to modify — openspec/specs/ is currently empty)_

## Impact

**Affected feature modules:**
- `src/features/auth/` — OAuth button, callback, session guard, post-login resolution
- `src/features/portals/` — New portal page and role selection components (currently embryonic: only `HeroCard`)
- `src/features/users/` — Profile gate resolution, onboarding forms

**Affected routes:**
- New: `src/app/(public)/portal/page.tsx`
- Modified: `src/app/(public)/onboarding/page.tsx`, `src/app/(public)/login/page.tsx`
- Modified: `src/app/api/auth/callback/route.ts`
- Modified: `src/app/page.tsx` (landing page CTA)

**Database:**
- New model: `AlumniProfile`
- New enum: `VerificationStatus`
- Modified model: `IndustryPartnerProfile` (add `verification_status`)
- Modified model: `User` (add `alumni_profile` relation)
- Migration required via Prisma → Supabase workflow

**Dependencies:** No new npm packages required. All features use existing stack (shadcn/ui, react-hook-form, Zod, Prisma, Supabase Auth).

**Constitution Compliance:** All 6 core principles satisfied — pnpm only, Server Components default with "use client" only where needed (OAuth button, onboarding forms), customZodResolver for forms, Prisma migration workflow for schema changes, verification gates (lint/test/build), feature-based organization.
