## Context

Currently, the `FACULTY` role is designated as admin-provisioned with no self-service entry flow. With the introduction of self-signup capability for faculty, the portal card for `FACULTY` needs to transition to a Google OAuth trigger, a new profile gate state `FACULTY_ONBOARDING_REQUIRED` is needed when a faculty user has no program affiliation, and a dedicated onboarding form must be created to link the faculty user to their primary program.

## Goals / Non-Goals

**Goals:**
- Enable self-service registration/login for the `FACULTY` role via the `/portal` page.
- Direct new faculty users to a dedicated onboarding flow at `/onboarding?intent=faculty` to select their program affiliation.
- Link the faculty member to their chosen program in the database using the existing `FacultyProgramAffiliation` model.
- Restrict faculty self-registration to ACD institutional domains (`@acd.edu.ph` or `@acdeducation.com`).

**Non-Goals:**
- Creating a separate profile model for faculty (existing `User` + `FacultyProgramAffiliation` mapping is sufficient).
- Adding complex multi-program selection during initial onboarding (keep onboarding minimal to primary program affiliation; multiple affiliations can be managed by admins later).

## Decisions

### D1: Portal page FACULTY Card OAuth trigger
**Decision:** Modify the `FACULTY` role card in `src/app/(public)/portal/page.tsx` to display an active login/register button triggering Google OAuth with `intent=faculty`.
**Rationale:** Standardizes the user experience across all self-service roles.
**Files:**
- `[MODIFY] src/app/(public)/portal/page.tsx`

---

### D2: Faculty Onboarding Profile Gate and Destination Resolution
**Decision:** Extend the profile gate system with `FACULTY_ONBOARDING_REQUIRED` state and route authenticated faculty users who lack a `FacultyProgramAffiliation` record to `/onboarding?intent=faculty`.
**Rationale:** Reuses the existing robust profile gate resolution mechanism.
**Files:**
- `[MODIFY] src/features/users/services/resolve-profile-gate.ts`
- `[MODIFY] src/features/auth/services/resolve-auth-session.ts`
- `[MODIFY] src/features/auth/services/build-auth-session-snapshot.ts`
- `[MODIFY] src/features/auth/services/resolve-post-login-destination.ts`

---

### D3: Faculty Onboarding Form component
**Decision:** Create a new Client Component `FacultyOnboardingForm` at `src/features/users/components/faculty-onboarding-form.tsx` containing first name, last name (prefilled), institutional email (read-only), and primary academic program dropdown.
**Rationale:** Keeping a separate onboarding form for faculty avoids mixing academic cohort inputs (student ID, section, year level) with faculty inputs.
**Files:**
- `[NEW] src/features/users/components/faculty-onboarding-form.tsx`
- `[MODIFY] src/app/(public)/onboarding/page.tsx` (to switch and render the form on `?intent=faculty`)
- `[NEW] src/lib/schemas/faculty-profile.ts` (Zod schema for form validation)

---

### D4: Server Action for Faculty Profile Registration
**Decision:** Create a server action `registerFacultyProfile` at `src/lib/actions/faculty-actions.ts` to perform the database updates.
**Rationale:** Updates first name/last name on `User` and inserts a `FacultyProgramAffiliation` record with `is_primary = true`.
**Files:**
- `[NEW] src/lib/actions/faculty-actions.ts`

---

### Sequence Diagram

```text
┌──────┐   ┌───────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐
│ User │   │Portal │   │ Google  │   │ Callback │   │Onboarding│   │Dashboard│
└──┬───┘   └───┬───┘   └────┬────┘   └────┬─────┘   └────┬─────┘   └────┬────┘
   │           │            │             │              │              │
   │  GET /portal           │             │              │              │
   │──────────>│            │             │              │              │
   │           │            │             │              │              │
   │  Click "Faculty"       │             │              │              │
   │──────────>│            │             │              │              │
   │           │  signInWithOAuth         │              │              │
   │           │  (redirectTo=            │              │              │
   │           │   /api/auth/callback     │              │              │
   │           │   ?intent=faculty)       │              │              │
   │           │───────────>│             │              │              │
   │           │            │             │              │              │
   │           │ Google OAuth consent     │              │              │
   │<──────────────────────>│             │              │              │
   │           │            │             │              │              │
   │           │            │  GET /api/auth/callback     │              │
   │           │            │  ?code=X&intent=faculty     │              │
   │           │            │────────────>│              │              │
   │           │            │             │              │              │
   │           │            │             │ exchangeCode │              │
   │           │            │             │ validateRoleDomain(email, FACULTY)
   │           │            │             │ → PASS (enforced domain OK) │
   │           │            │             │              │              │
   │           │            │             │ resolveSession│              │
   │           │            │             │ profileGate = │              │
   │           │            │             │ FACULTY_ONBOARDING_REQUIRED │
   │           │            │             │              │              │
   │  302 /onboarding?intent=faculty      │              │              │
   │<────────────────────────────────────>│              │              │
   │           │            │             │              │              │
   │  Submit faculty form   │             │              │              │
   │─────────────────────────────────────────────────────>│              │
   │           │            │             │              │              │
   │           │            │             │ registerFacultyProfile      │
   │           │            │             │ (creates ProgramAffiliation)│
   │           │            │             │              │              │
   │  302 /faculty/dashboard│             │              │              │
   │<─────────────────────────────────────────────────────────────────>│
   │           │            │             │              │              │
```

## Risks / Trade-offs

- **[Risk] Single program selection at onboarding** → Faculty members may teach courses in multiple programs. **Mitigation:** Onboarding only asks for their primary program affiliation to satisfy the profile gate. Admins can associate additional program affiliations through the admin dashboard or via seed data.
- **[Risk] Domain enforcement complexity** → Enforcing institutional domain for self-signup must be secure. **Mitigation:** The server-side domain verification is handled at the `/api/auth/callback/route.ts` boundary using the existing domain verification helper.

## Migration Plan

No database schema migrations are needed. The existing `FacultyProgramAffiliation` model fits the requirement perfectly.
The implementation will be completed as follows:
1. Implement helper changes: `resolveProfileGate`, `resolve-auth-session`, and `resolvePostLoginDestination`.
2. Create `facultyProfileSchema` and `registerFacultyProfile` server action.
3. Create `FacultyOnboardingForm` component.
4. Update `/portal` page to activate the faculty card, and `/onboarding` page to route the faculty intent.
