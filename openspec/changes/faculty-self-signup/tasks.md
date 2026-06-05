## 1. Helper & Profile Gate Extension — Faculty Onboarding Gates

- [ ] 1.1 Include `faculty_program_affiliations` in Prisma query of `resolveAuthSessionFromAuthenticatedUser` in `src/features/auth/services/resolve-auth-session.ts`
- [ ] 1.2 Modify `build-auth-session-snapshot.ts` to include `hasFacultyAffiliation` field in snapshot and input, mapping it to whether `faculty_program_affiliations` has entries
- [ ] 1.3 Add `FACULTY_ONBOARDING_REQUIRED` to `ProfileGate` types and gate checking in `src/features/users/services/resolve-profile-gate.ts`. Return `FACULTY_ONBOARDING_REQUIRED` when role is `FACULTY` and `hasFacultyAffiliation` is false
- [ ] 1.4 Modify `resolvePostLoginDestination.ts` to redirect `FACULTY_ONBOARDING_REQUIRED` to `/onboarding?intent=faculty`
- [ ] 1.5 Update `SessionGuard` layout-level protection in `src/features/auth/components/session-guard.tsx` to handle `FACULTY_ONBOARDING_REQUIRED`
- [ ] 1.6 Add/extend unit tests for profile gate resolution to test the new faculty gate path
- [ ] 1.7 Verify: `pnpm test && pnpm lint && pnpm build`

> **Commit:** `feat(auth): add profile gate resolution for faculty onboarding`

---

## 2. Server Schema & Actions — Faculty Onboarding

- [ ] 2.1 Create `src/lib/schemas/faculty-profile.ts` with `facultyProfileSchema` using Zod. Fields: `first_name` (non-empty string), `last_name` (non-empty string), `program_id` (UUID)
- [ ] 2.2 Create `src/lib/actions/faculty-actions.ts` with `registerFacultyProfile` server action. It should validate inputs, update the `User` first/last name, insert a `FacultyProgramAffiliation` record with `is_primary = true`, and return success/error status
- [ ] 2.3 Add unit tests for the `registerFacultyProfile` server action (success, validation failure, duplicate program affiliation)
- [ ] 2.4 Verify: `pnpm test && pnpm lint && pnpm build`

> **Commit:** `feat(actions): add faculty profile registration server action`

---

## 3. Portal UI Updates — Self-Service Faculty Role

- [ ] 3.1 Modify `src/app/(public)/portal/page.tsx` (or role selection configs) to change the `FACULTY` card to have a Google OAuth CTA button instead of the admin-provisioned notice
- [ ] 3.2 Ensure clicking the `FACULTY` card initiates Google OAuth via Supabase with `intent=faculty`
- [ ] 3.3 Verify: `pnpm lint && pnpm build`

> **Commit:** `feat(portal): enable self-service oauth trigger for faculty role`

---

## 4. Faculty Onboarding Form UI — Presentation & Integration

- [ ] 4.1 Create `src/features/users/components/faculty-onboarding-form.tsx` client component. Fields: first name, last name, institutional email (read-only), and primary academic program select dropdown using base-nova UI and `customZodResolver`
- [ ] 4.2 Modify `/onboarding` page controller at `src/app/(public)/onboarding/page.tsx` to handle `?intent=faculty`, fetch programs from the database, and render `FacultyOnboardingForm`
- [ ] 4.3 Add a "Not your role?" back link navigating to `/portal` on the faculty onboarding form page
- [ ] 4.4 Verify: `pnpm lint && pnpm build`

> **Commit:** `feat(onboarding): add faculty onboarding form component and route integration`

---

## 5. Integration Tests & Polish

- [ ] 5.1 Add mock faculty onboarding and sign-in flow data scenarios in `prisma/seed.ts` for testing
- [ ] 5.2 Write integration test checking that domain validation in `src/app/api/auth/callback/route.ts` successfully allows institutional email and rejects personal emails for `intent=faculty`
- [ ] 5.3 Verify: `pnpm lint && pnpm test && pnpm build`

> **Commit:** `test(auth): verify faculty self-signup and onboarding flow`
