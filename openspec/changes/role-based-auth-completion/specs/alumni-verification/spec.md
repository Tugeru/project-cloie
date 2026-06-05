## ADDED Requirements

### Requirement: AlumniProfile Data Model

The Prisma schema SHALL define an `AlumniProfile` model with a one-to-one relationship to the `User` model. The model SHALL include the following fields:

| Field                 | Type                | Constraints                                  |
|-----------------------|---------------------|----------------------------------------------|
| `id`                  | `String` (UUID)     | `@id @default(dbgenerated("gen_random_uuid()"))` |
| `user_id`             | `String` (UUID)     | `@unique`, foreign key to `User.id`          |
| `graduation_year`     | `Int`               | Required                                     |
| `program_id`          | `String` (UUID)     | Foreign key to `Program.id`                  |
| `verification_status` | `VerificationStatus`| `@default(PENDING)`                          |
| `created_at`          | `DateTime`          | `@default(now())`                            |
| `updated_at`          | `DateTime`          | `@updatedAt`                                 |

The model SHALL map to the database table `alumni_profiles` via `@@map("alumni_profiles")`. The `user` relation SHALL use `onDelete: Cascade`. The `program` relation SHALL use `onDelete: Restrict`.

#### Scenario: AlumniProfile model exists in Prisma schema

- **Given** the Prisma schema at `prisma/schema.prisma`
- **When** the schema is parsed
- **Then** an `AlumniProfile` model SHALL exist with all specified fields and constraints
- **And** the `user_id` field SHALL have a `@unique` constraint (enforcing 1:1 with User)
- **Verification:** Vitest unit — parse schema, assert model definition matches specification.

#### Scenario: AlumniProfile has foreign key to User

- **Given** the `AlumniProfile` model
- **When** inspecting relations
- **Then** there SHALL be a `user` relation field referencing `User.id` on `user_id`
- **And** the relation SHALL use `onDelete: Cascade`
- **Verification:** Vitest unit — assert relation definition in schema.

#### Scenario: AlumniProfile has foreign key to Program

- **Given** the `AlumniProfile` model
- **When** inspecting relations
- **Then** there SHALL be a `program` relation field referencing `Program.id` on `program_id`
- **And** the relation SHALL use `onDelete: Restrict`
- **Verification:** Vitest unit — assert relation definition in schema.

#### Scenario: User model has alumni_profile relation

- **Given** the `User` model in Prisma schema
- **When** inspecting its relations
- **Then** there SHALL be an `alumni_profile` relation field of type `AlumniProfile?` (optional, 1:1)
- **Verification:** Vitest unit — assert `User` model includes `alumni_profile AlumniProfile?` relation.

---

### Requirement: VerificationStatus Enum

The Prisma schema SHALL define a `VerificationStatus` enum with exactly three values: `PENDING`, `APPROVED`, `REJECTED`. This enum SHALL be used by both `AlumniProfile` and `IndustryPartnerProfile` for tracking verification state.

#### Scenario: VerificationStatus enum exists with correct values

- **Given** the Prisma schema
- **When** the schema is parsed
- **Then** a `VerificationStatus` enum SHALL exist
- **And** it SHALL contain exactly three values: `PENDING`, `APPROVED`, `REJECTED`
- **Verification:** Vitest unit — parse schema, assert enum definition.

#### Scenario: VerificationStatus values are exhaustive

- **Given** the `VerificationStatus` enum
- **When** checking its values
- **Then** there SHALL be no values other than PENDING, APPROVED, REJECTED
- **Verification:** Vitest unit — assert enum length is 3.

---

### Requirement: IndustryPartnerProfile Verification Status Field

The existing `IndustryPartnerProfile` model SHALL be modified to add a `verification_status` field of type `VerificationStatus` with a default value of `PENDING`. This is a non-breaking additive change — existing records SHALL receive the default value via migration.

#### Scenario: IndustryPartnerProfile has verification_status field

- **Given** the `IndustryPartnerProfile` model in Prisma schema
- **When** the schema is parsed
- **Then** the model SHALL include a `verification_status` field of type `VerificationStatus`
- **And** the field SHALL have `@default(PENDING)`
- **Verification:** Vitest unit — assert field exists with correct type and default.

#### Scenario: Existing IndustryPartnerProfile records receive default

- **Given** existing `IndustryPartnerProfile` records in the database without a `verification_status` value
- **When** the database migration runs
- **Then** all existing records SHALL have `verification_status` set to `PENDING`
- **Verification:** Manual — run migration, query existing records, assert all have PENDING status.

---

### Requirement: New Alumni Default to PENDING Verification

When a new `AlumniProfile` is created (via the alumni onboarding server action), the `verification_status` field SHALL default to `PENDING`. The profile creation logic SHALL NOT explicitly set `verification_status` unless overriding the default — the database default of `PENDING` SHALL apply.

#### Scenario: Newly created alumni profile has PENDING status

- **Given** a user completes the alumni onboarding form
- **When** the server action creates the `AlumniProfile` record
- **Then** the record's `verification_status` SHALL be `PENDING`
- **Verification:** Vitest integration — create AlumniProfile via server action, query DB, assert `verification_status` is `PENDING`.

#### Scenario: Alumni profile does not require explicit status on creation

- **Given** the alumni onboarding server action
- **When** it creates an `AlumniProfile` via `prisma.alumniProfile.create()`
- **Then** the `data` object SHALL NOT include `verification_status` (relying on `@default(PENDING)`)
- **Verification:** Vitest unit — inspect server action code, assert no explicit `verification_status` in create payload.

---

### Requirement: New Industry Partners Default to PENDING Verification

When a new `IndustryPartnerProfile` is created (via the industry partner onboarding server action), the `verification_status` field SHALL default to `PENDING`. This mirrors the alumni verification behavior.

#### Scenario: Newly created industry partner profile has PENDING status

- **Given** a user completes the industry partner onboarding form
- **When** the server action creates the `IndustryPartnerProfile` record
- **Then** the record's `verification_status` SHALL be `PENDING`
- **Verification:** Vitest integration — create IndustryPartnerProfile via server action, query DB, assert `verification_status` is `PENDING`.

---

### Requirement: Verification Banner on Dashboard

Alumni and industry partner users with a `verification_status` of `PENDING` SHALL see a verification status banner on their respective dashboard pages (`/alumni/dashboard` and `/industry-partner/dashboard`). The banner SHALL inform the user that their profile is pending verification. Users with `PENDING` status SHALL still have full access to their dashboard — the banner is informational only, not blocking.

#### Scenario: Alumni with PENDING status sees verification banner

- **Given** an authenticated user with the ALUMNI role and `AlumniProfile.verification_status = PENDING`
- **When** they navigate to `/alumni/dashboard`
- **Then** the dashboard SHALL display a visible verification status banner
- **And** the banner SHALL contain text indicating "Verification Pending" or equivalent
- **And** the banner SHALL NOT block access to any dashboard content
- **Verification:** Playwright E2E — log in as PENDING alumni, navigate to dashboard, assert banner visible and dashboard content accessible.

#### Scenario: Industry partner with PENDING status sees verification banner

- **Given** an authenticated user with the INDUSTRY_PARTNER role and `IndustryPartnerProfile.verification_status = PENDING`
- **When** they navigate to `/industry-partner/dashboard`
- **Then** the dashboard SHALL display a verification status banner
- **And** the banner SHALL inform the user their profile is pending verification
- **Verification:** Playwright E2E — log in as PENDING industry partner, navigate to dashboard, assert banner visible.

#### Scenario: Alumni with APPROVED status does not see banner

- **Given** an authenticated user with the ALUMNI role and `AlumniProfile.verification_status = APPROVED`
- **When** they navigate to `/alumni/dashboard`
- **Then** the dashboard SHALL NOT display the verification pending banner
- **Verification:** Playwright E2E — log in as APPROVED alumni, navigate to dashboard, assert no banner.

#### Scenario: Industry partner with APPROVED status does not see banner

- **Given** an authenticated user with the INDUSTRY_PARTNER role and `IndustryPartnerProfile.verification_status = APPROVED`
- **When** they navigate to `/industry-partner/dashboard`
- **Then** the dashboard SHALL NOT display the verification pending banner
- **Verification:** Playwright E2E — log in as APPROVED industry partner, navigate to dashboard, assert no banner.

#### Scenario: Alumni with REJECTED status sees rejection banner

- **Given** an authenticated user with the ALUMNI role and `AlumniProfile.verification_status = REJECTED`
- **When** they navigate to `/alumni/dashboard`
- **Then** the dashboard SHALL display a banner indicating verification was rejected
- **And** the banner SHOULD include guidance on next steps (e.g., "Contact administration")
- **And** the banner SHALL NOT block access to dashboard content
- **Verification:** Playwright E2E — log in as REJECTED alumni, navigate to dashboard, assert rejection banner visible.

#### Scenario: Industry partner with REJECTED status sees rejection banner

- **Given** an authenticated user with the INDUSTRY_PARTNER role and `IndustryPartnerProfile.verification_status = REJECTED`
- **When** they navigate to `/industry-partner/dashboard`
- **Then** the dashboard SHALL display a banner indicating verification was rejected
- **Verification:** Playwright E2E — log in as REJECTED industry partner, assert rejection banner.

---

### Requirement: Profile Gate Awareness for Verification Status

The profile gate system SHALL NOT block alumni or industry partner users with `PENDING` verification status from accessing their dashboards. The profile gate for these roles SHALL resolve to `COMPLETE` once the `AlumniProfile` or `IndustryPartnerProfile` exists, regardless of verification status. Verification status is an informational overlay, not a gate.

#### Scenario: PENDING alumni resolves to COMPLETE profile gate

- **Given** a user with the ALUMNI role and an `AlumniProfile` record (verification_status = PENDING)
- **When** `resolveProfileGate` is called for this user
- **Then** the result SHALL be `{ status: "COMPLETE" }`
- **And** the user SHALL NOT be redirected to onboarding
- **Verification:** Vitest unit — call `resolveProfileGate` with alumni role + existing profile, assert COMPLETE.

#### Scenario: PENDING industry partner resolves to COMPLETE profile gate

- **Given** a user with the INDUSTRY_PARTNER role and an `IndustryPartnerProfile` record (verification_status = PENDING)
- **When** `resolveProfileGate` is called for this user
- **Then** the result SHALL be `{ status: "COMPLETE" }`
- **Verification:** Vitest unit — call `resolveProfileGate` with industry partner role + existing profile, assert COMPLETE.

#### Scenario: Alumni without profile resolves to onboarding required

- **Given** a user with the ALUMNI role but NO `AlumniProfile` record
- **When** `resolveProfileGate` is called for this user
- **Then** the result SHALL indicate onboarding is required (directing to `/onboarding?intent=alumni`)
- **Verification:** Vitest unit — call `resolveProfileGate` with alumni role + no profile, assert onboarding gate.

---

### Requirement: Admin Verification UI Is Out of Scope

This spec explicitly defines that admin-facing UI for approving or rejecting alumni and industry partner verification is NOT included. Only the data model (`VerificationStatus` enum, `verification_status` field) and status display (dashboard banner) are in scope. A future spec SHALL cover the admin verification workflow.

#### Scenario: No admin verification routes exist

- **Given** the routes under `(app)/admin/`
- **When** inspecting available pages
- **Then** there SHALL NOT be a verification management page (e.g., `/admin/verifications`)
- **Verification:** Manual — confirm no admin verification route files exist.

#### Scenario: VerificationStatus can only be PENDING at creation

- **Given** the alumni and industry partner onboarding server actions
- **When** a new profile is created through onboarding
- **Then** the `verification_status` SHALL always be `PENDING`
- **And** there SHALL be no server action or API endpoint to change the status (in this change's scope)
- **Verification:** Vitest unit — assert no mutation functions for `verification_status` exist in the onboarding actions.

---

### Requirement: Database Migration for Schema Changes

All schema changes (new `AlumniProfile` model, new `VerificationStatus` enum, new `verification_status` field on `IndustryPartnerProfile`, new `alumni_profile` relation on `User`) SHALL be applied via the standard Prisma → Supabase migration workflow:

1. Edit `prisma/schema.prisma`
2. Run `pnpm supabase:migration:diff -- add_alumni_verification`
3. Run `pnpm supabase:push:dry-run` to preview
4. Run `pnpm supabase:push` to apply
5. Run `pnpm supabase:types` to regenerate types

Hand-editing `src/types/supabase-database.ts` is NOT permitted.

#### Scenario: Migration creates alumni_profiles table

- **Given** the migration SQL generated by `supabase:migration:diff`
- **When** the migration is applied
- **Then** a `alumni_profiles` table SHALL exist in the database
- **And** it SHALL have columns matching the `AlumniProfile` model specification
- **Verification:** Manual — run migration, inspect database schema.

#### Scenario: Migration adds verification_status to industry_partner_profiles

- **Given** the migration SQL
- **When** the migration is applied
- **Then** the `industry_partner_profiles` table SHALL have a new `verification_status` column
- **And** existing rows SHALL have the value `PENDING`
- **Verification:** Manual — run migration, query existing rows.

#### Scenario: Supabase types are regenerated

- **Given** the migration has been applied
- **When** `pnpm supabase:types` is run
- **Then** `src/types/supabase-database.ts` SHALL be updated to reflect the new `alumni_profiles` table and `verification_status` enum
- **And** the file SHALL NOT be hand-edited
- **Verification:** Manual — run `pnpm supabase:types`, diff the output.
