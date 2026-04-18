# Unified Student Onboarding Architecture

## Overview
This document outlines the end-to-end architecture for capturing new user profiles (specifically Students) originating from the Google OAuth Sign-in integration using Supabase. We utilize "Approach A" (Unified Limbo Session).

## 1. Authentication Callback interception
**File:** `src/app/api/auth/callback/route.ts`
When an un-roled user logs in via OAuth, the database assigns a naked `User` record via Supabase. We intercept the redirect to check if the user has database-level roles. If `roles.length === 0`, they are firmly routed to `/onboarding`.

## 2. Onboarding Stepper (Frontend)
**Route Group:** `src/app/(public)/onboarding`
- **RoleSelection Component:** Prompts the user "What is your role at ACD?". If a user clicks the "Sign Up as Student" directly from the login page, we append `?intent=student` to skip this screen automatically.
- **StudentProfileForm Component:**
   - Handled via `react-hook-form` + `@hookform/resolvers/zod`.
   - **Static Payload:** Fetches the active Google session to prefill First Name, Last Name, and locks the Institutional Email so it cannot be altered.
   - **Cascading Selections:** Fetches `Program` models from the database. Once a `Program` is selected, an asynchronous check unlocks the `Major` dropdown if that specific program contains majors.
   - **Fields:** Program, Major, Year Level, Student ID Number.
   - **UX:** Cancel Button executes `supabase.auth.signOut()` and destroys the Google Session.

## 3. Atomic Database Insertion (Backend)
**Location:** Server Action (`src/app/(public)/onboarding/_actions.ts`)
When the frontend form is successfully submitted, the payload triggers an atomic database transaction using Prisma:
1. Validates Session matches payload.
2. `prisma.$transaction`:
   - Enforce existing `User` sync with `auth.users` matching their `uuid`.
   - Create `StudentAcademicProfile` binding to user, program, and year level.
   - Create `UserRole` joining `User` to `STUDENT` globally.

By wrapping this in a transaction, we ensure no user is ever left partially registered inside `public` tables.
