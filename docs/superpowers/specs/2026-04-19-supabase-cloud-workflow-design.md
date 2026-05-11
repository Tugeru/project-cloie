# Supabase Cloud Workflow Design

**Date:** 2026-04-19
**Status:** Approved
**Topic:** Git-tracked Supabase Cloud workflow for a single free-tier hosted project, with Prisma owning core app schema and Supabase owning platform-specific features.

## 1. Objective

Establish a low-overhead development and version-control workflow for PROJECT CLOIE that works with a single hosted Supabase free-tier project and does not require local Docker-based Supabase.

The workflow must preserve the current architecture:

- `Supabase Postgres` is the live database host.
- `Prisma` remains the primary modeling layer for ordinary application tables.
- `Supabase Auth` remains the authentication provider, including Google OAuth.
- `Supabase CLI` is added as the operational and version-control bridge for Supabase-specific infrastructure and tracked SQL changes.

## 2. Current Context

The repository already uses:

- `Next.js` app routing and server/client Supabase clients
- `Supabase Auth` for Google OAuth sign-in
- `Supabase Postgres` as the backing database
- `Prisma` as the application ORM and schema definition layer
- existing Prisma seed data for core academic records

Because the project is on the Supabase free tier and only has one hosted project, the system cannot rely on Supabase cloud branches for isolation. The design therefore uses process discipline and Git-tracked artifacts instead of environment branching.

## 3. Decision Summary

The chosen approach is `Option 3`:

- `Prisma` owns the core relational application schema.
- `supabase/` owns Supabase-specific assets and migration SQL.
- the hosted Supabase project remains the only remote runtime environment.
- GitHub becomes the history and audit trail for backend changes.
- the Supabase dashboard is limited to secrets, provider credentials, and settings that cannot be represented cleanly as code.

This is a deliberate split-ownership model, not a mixed free-for-all. Every class of change needs one clear home.

## 4. Ownership Boundaries

### Prisma owns

- ordinary app tables and columns
- relations and referential structure
- indexes and normal relational constraints that belong to the application model
- Prisma client generation
- seed logic for application-level reference data such as roles, programs, majors, year levels, and similar catalog entities

### Supabase SQL and `supabase/` own

- `RLS` policies
- grants and role permissions
- auth-related SQL integration
- PostgreSQL extensions
- triggers and database functions that Prisma should not model as application schema
- Edge Functions
- storage bucket setup and storage policies
- Supabase project config that can be represented in tracked files
- SQL migration files used to apply reviewed changes to the hosted database

### Supabase dashboard owns

- project secrets
- OAuth provider credentials and client secrets
- unavoidable dashboard-only settings

Direct dashboard changes that affect database behavior or access rules should be treated as exceptions and mirrored back into the repo immediately.

## 5. Source Of Truth Model

The repo is the source of truth for intended backend structure and behavior.

That source of truth is expressed through two coordinated artifacts:

- `prisma/schema.prisma` for app-schema intent
- `supabase/migrations/*.sql` and related `supabase/` assets for applied infrastructure and platform behavior

In practice, Prisma remains the design surface for normal schema changes, but the tracked deployment artifact for a hosted single-project workflow is reviewed SQL committed in Git.

This means `prisma db push` should not be the routine way to change the hosted project, because it bypasses durable migration history.

## 6. Repo Layout

The repo should include a `supabase/` tree alongside the existing Prisma setup.

Expected tracked assets:

- `supabase/config.toml`
- `supabase/migrations/*.sql`
- `supabase/functions/` when Edge Functions are introduced
- optional generated artifacts such as Supabase TypeScript types if the team decides they are worth committing
- documentation describing the ownership boundary and workflow

The existing Prisma structure remains in place:

- `prisma/schema.prisma`
- `prisma/seed.ts`
- future `prisma/migrations/` only if the team later adopts a safe non-production-backed migration workflow

## 7. Development Workflow

### A. App-schema change

Use this path when the feature is mainly tables, columns, relations, or indexes.

1. Update `prisma/schema.prisma`.
2. Generate a reviewed SQL diff representing the change against the current hosted database state.
3. Save that SQL under `supabase/migrations/` with a descriptive timestamped name.
4. If the feature also needs RLS, grants, triggers, or other Supabase-specific behavior, add that to the same migration or a paired migration.
5. Commit the Prisma schema change and the SQL migration together.
6. Apply the tracked migration intentionally to the linked hosted project.

This preserves Prisma ownership of the model while still producing Git-tracked SQL for the real environment.

### B. Supabase-platform change

Use this path when the feature is mainly security, auth-adjacent database behavior, storage, or functions.

1. Add or update SQL and Supabase assets under `supabase/`.
2. Keep Prisma unchanged unless the feature also alters app tables.
3. Commit the change before or together with remote application.
4. Apply the change through the linked Supabase CLI workflow.

### C. Dashboard-only change

Use this only for secrets, OAuth credentials, or settings that cannot realistically be tracked as code.

1. Make the dashboard change.
2. Update repo docs or config templates if the change affects local setup or operational expectations.
3. Do not commit secrets.

If the dashboard change affects SQL-level behavior, recreate it in tracked files immediately so the repo does not drift.

## 8. Agent Access Model

The agent should have CLI-based access to the linked Supabase project, but operate with file-first discipline.

The agent may:

- inspect linked project state
- generate or edit `supabase/` assets
- update `prisma/schema.prisma`
- produce reviewed migration SQL
- apply tracked migrations intentionally
- generate types and related integration artifacts
- help inspect and repair drift between repo intent and hosted state

The agent should not:

- use the dashboard as its normal operating surface
- commit secrets or provider credentials
- perform destructive or irreversible database operations without explicit confirmation
- make undocumented live changes that are not reflected in repo files

## 9. Drift Management

Because there is only one hosted project, drift is the main operational risk.

Common drift sources:

- `prisma db push` applied directly to the hosted database without a tracked SQL artifact
- dashboard edits to policies, SQL, or storage rules
- manual SQL run outside the repo workflow

Required response to drift:

1. Identify the live change.
2. Recreate it as a committed migration or tracked config change.
3. Realign `prisma/schema.prisma` if the change affected Prisma-owned schema.
4. Only then continue with new feature work.

The rule is simple: if production changed, Git must learn about it before more changes pile on.

## 10. Error Handling And Safety Rules

- Prefer small backend changes over large bundled migrations.
- Treat destructive operations such as dropping columns, rewriting data, or disabling policies as explicit confirmation boundaries.
- If a Prisma-owned feature cannot be represented cleanly in Prisma, move that concern into Supabase SQL and document the reason.
- If a change touches auth, RLS, or permissions, verify behavior with a real authenticated flow after apply.
- If a migration partially succeeds or leaves uncertain state, stop and inspect the hosted database before writing follow-up SQL.

## 11. Verification

Before calling a backend change complete, verify the relevant parts:

- migration or apply command succeeded
- `prisma generate` still succeeds
- app tests relevant to auth or data access still pass
- the affected application flow still works against the hosted project
- any generated artifacts intended for commit are up to date

For auth-related work, verification should include at least one end-to-end sign-in or session path check. For RLS or permissions work, verification should include an access-path test that would fail if the policy is wrong.

## 12. Trade-Offs

### Benefits

- no Docker-based local Supabase requirement
- Git-tracked backend history on the free tier
- keeps Prisma as the familiar modeling layer for app schema
- adds a safe place for Supabase-specific logic and infrastructure assets
- gives the agent a clear operating model for future work

### Costs

- no true isolated cloud dev environment
- more process discipline is required to avoid drift
- some schema changes will require converting Prisma intent into tracked SQL before apply
- the team must respect ownership boundaries or the split model becomes confusing

## 13. Recommended Policy

Adopt a strict ownership policy:

- use `Prisma` first for ordinary app-schema modeling
- use `Supabase SQL` first for platform, security, storage, and auth-adjacent database behavior
- do not use `prisma db push` as the normal production-backed change mechanism
- do not rely on the dashboard for anything that should have durable history

This policy keeps the workflow predictable for both humans and agents while still fitting the current cloud-only constraints.
