# Foundation and Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish CLOIE's first domain-owned access slice by adding enriched session resolution, onboarding/profile gating, role-aware dashboard routing, and protected internal route groups that match the current repository.

**Architecture:** This slice keeps the current Next.js app intact and introduces the first two domain modules: `identity-access` and `user-lifecycle-profiles`. The implementation is deliberately narrow: move access decisions into reusable services and guards, keep existing onboarding persistence behavior, and add minimal internal dashboards so every post-login route resolves to a real page.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Auth SSR, Prisma, PostgreSQL, React Server Components, Zod, Vitest

---

## Scope Notes

This plan covers only the first working architecture slice:

- enriched authenticated session resolution
- primary-role selection and post-login destination rules
- student onboarding/profile completeness gating
- route-level access guards for internal roles
- real dashboard entry routes for internal roles already modeled in the repo

This plan does **not** implement invitations, external respondent token flows, faculty/course context, or academic catalog modules. Those belong in later plans.

## File Structure And Responsibilities

### Create

- `src/modules/identity-access/services/resolve-primary-role.ts`
  Picks one primary role from a user's assigned roles using a stable priority order.

- `src/modules/identity-access/services/resolve-post-login-destination.ts`
  Centralizes where users go after auth or dashboard entry, including onboarding redirects.

- `src/modules/user-lifecycle-profiles/services/resolve-profile-gate.ts`
  Decides whether the current authenticated user must complete onboarding before entering the app.

- `src/modules/identity-access/services/build-auth-session-snapshot.ts`
  Builds the app-facing session object from resolved roles and profile state.

- `src/modules/identity-access/services/resolve-auth-session.ts`
  Reads Supabase auth + Prisma data and returns the enriched app session.

- `src/modules/identity-access/policies/ensure-role-access.ts`
  Pure helper for route-level role checks used by server guards.

- `src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts`
  Locks primary-role and landing-page rules.

- `src/__tests__/modules/identity-access/build-auth-session-snapshot.test.ts`
  Locks session enrichment and profile-gate behavior.

- `src/__tests__/modules/identity-access/ensure-role-access.test.ts`
  Locks route-level role-access decisions.

- `src/app/(app)/dashboard/page.tsx`
  Normalized dashboard entry route that redirects authenticated users to their real landing page.

- `src/app/(app)/student/layout.tsx`
  Student route-group guard.

- `src/app/(app)/student/dashboard/page.tsx`
  Minimal working student dashboard page.

- `src/app/(app)/faculty/layout.tsx`
  Faculty route-group guard.

- `src/app/(app)/faculty/dashboard/page.tsx`
  Minimal working faculty dashboard page.

- `src/app/(app)/program-head/layout.tsx`
  Program-head route-group guard.

- `src/app/(app)/program-head/dashboard/page.tsx`
  Minimal working program-head dashboard page.

- `src/app/(app)/dean/layout.tsx`
  Dean route-group guard.

- `src/app/(app)/dean/dashboard/page.tsx`
  Minimal working dean dashboard page.

- `src/app/(app)/admin/layout.tsx`
  Admin route-group guard.

- `src/app/(app)/admin/dashboard/page.tsx`
  Minimal working admin dashboard page.

- `src/app/unauthorized/page.tsx`
  Shared unauthorized destination for role mismatches.

### Modify

- `src/lib/auth/session.ts`
  Delegate the old session helper to the new enriched session resolver.

- `src/components/auth/session-guard.tsx`
  Support role-aware and onboarding-aware guarding.

- `src/app/(app)/layout.tsx`
  Keep the shared app shell wrapped in the upgraded guard.

- `src/app/api/auth/callback/route.ts`
  Replace ad hoc role redirect logic with the new destination resolver.

- `src/app/(public)/onboarding/page.tsx`
  Redirect already-complete users away from onboarding and keep incomplete users inside the flow.

- `src/app/(public)/onboarding/student-profile-form.tsx`
  Keep the current registration UX, but route completion through the new normalized `/dashboard` entrypoint.

## Task 1: Create Deterministic Identity Routing Helpers

**Files:**
- Create: `src/modules/identity-access/services/resolve-primary-role.ts`
- Create: `src/modules/identity-access/services/resolve-post-login-destination.ts`
- Test: `src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { resolvePrimaryRole } from "@/modules/identity-access/services/resolve-primary-role";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";

describe("resolvePrimaryRole", () => {
  it("prefers admin over lower roles", () => {
    expect(resolvePrimaryRole([ROLES.FACULTY, ROLES.ADMIN])).toBe(ROLES.ADMIN);
  });

  it("returns null when the user has no roles", () => {
    expect(resolvePrimaryRole([])).toBeNull();
  });
});

describe("resolvePostLoginDestination", () => {
  it("sends a roleless student signup to student onboarding", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: "student",
        primaryRole: null,
        profileGate: { status: "ROLE_SELECTION_REQUIRED" },
      })
    ).toBe("/onboarding?intent=student");
  });

  it("sends an incomplete student profile back to onboarding", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.STUDENT,
        profileGate: { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" },
      })
    ).toBe("/onboarding?intent=student");
  });

  it("sends a complete student to the student dashboard", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.STUDENT,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/student/dashboard");
  });

  it("preserves an explicit non-dashboard destination", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/profile",
        intent: null,
        primaryRole: ROLES.ADMIN,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/profile");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts`

Expected: FAIL with module-resolution errors for the new `identity-access` services.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/modules/identity-access/services/resolve-primary-role.ts
import { ROLES, type Role } from "@/lib/constants/roles";

const ROLE_PRIORITY: Role[] = [
  ROLES.ADMIN,
  ROLES.DEAN,
  ROLES.PROGRAM_HEAD,
  ROLES.FACULTY,
  ROLES.INDUSTRY_PARTNER,
  ROLES.ALUMNI,
  ROLES.GRADUATING_STUDENT,
  ROLES.STUDENT,
];

export function resolvePrimaryRole(roles: Role[]): Role | null {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return null;
}
```

```ts
// src/modules/identity-access/services/resolve-post-login-destination.ts
import { ROLES, type Role } from "@/lib/constants/roles";

type ProfileGate =
  | { status: "ROLE_SELECTION_REQUIRED" }
  | { status: "STUDENT_ONBOARDING_REQUIRED"; intent: "student" }
  | { status: "COMPLETE" };

type DestinationInput = {
  requestedPath?: string | null;
  intent?: string | null;
  primaryRole: Role | null;
  profileGate: ProfileGate;
};

export function resolvePostLoginDestination({
  requestedPath,
  intent,
  primaryRole,
  profileGate,
}: DestinationInput): string {
  if (requestedPath && requestedPath !== "/dashboard") {
    return requestedPath;
  }

  if (profileGate.status === "ROLE_SELECTION_REQUIRED") {
    return intent === "student" ? "/onboarding?intent=student" : "/onboarding";
  }

  if (profileGate.status === "STUDENT_ONBOARDING_REQUIRED") {
    return "/onboarding?intent=student";
  }

  switch (primaryRole) {
    case ROLES.ADMIN:
      return "/admin/dashboard";
    case ROLES.DEAN:
      return "/dean/dashboard";
    case ROLES.PROGRAM_HEAD:
      return "/program-head/dashboard";
    case ROLES.FACULTY:
      return "/faculty/dashboard";
    case ROLES.STUDENT:
    case ROLES.GRADUATING_STUDENT:
      return "/student/dashboard";
    default:
      return "/dashboard";
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts`

Expected: PASS with 6 passing tests.

- [ ] **Step 5: Commit the helper slice**

```bash
git add src/modules/identity-access/services/resolve-primary-role.ts src/modules/identity-access/services/resolve-post-login-destination.ts src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts
git commit -m "feat: add role-based auth destination helpers"
```

## Task 2: Build The Enriched Auth Session Snapshot

**Files:**
- Create: `src/modules/user-lifecycle-profiles/services/resolve-profile-gate.ts`
- Create: `src/modules/identity-access/services/build-auth-session-snapshot.ts`
- Create: `src/modules/identity-access/services/resolve-auth-session.ts`
- Modify: `src/lib/auth/session.ts`
- Test: `src/__tests__/modules/identity-access/build-auth-session-snapshot.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { buildAuthSessionSnapshot } from "@/modules/identity-access/services/build-auth-session-snapshot";

describe("buildAuthSessionSnapshot", () => {
  it("marks users without roles as requiring role selection", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-1",
      email: "user@acd.edu.ph",
      roles: [],
      studentProfileId: null,
    });

    expect(session.primaryRole).toBeNull();
    expect(session.profileGate).toEqual({ status: "ROLE_SELECTION_REQUIRED" });
  });

  it("marks students without a profile as requiring onboarding", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-2",
      email: "student@acd.edu.ph",
      roles: [ROLES.STUDENT],
      studentProfileId: null,
    });

    expect(session.primaryRole).toBe(ROLES.STUDENT);
    expect(session.profileGate).toEqual({
      status: "STUDENT_ONBOARDING_REQUIRED",
      intent: "student",
    });
  });

  it("marks complete students as ready for the app", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-3",
      email: "student@acd.edu.ph",
      roles: [ROLES.STUDENT],
      studentProfileId: "profile-1",
    });

    expect(session.profileGate).toEqual({ status: "COMPLETE" });
  });

  it("allows faculty users without student profiles", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-4",
      email: "faculty@acd.edu.ph",
      roles: [ROLES.FACULTY],
      studentProfileId: null,
    });

    expect(session.primaryRole).toBe(ROLES.FACULTY);
    expect(session.profileGate).toEqual({ status: "COMPLETE" });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/__tests__/modules/identity-access/build-auth-session-snapshot.test.ts`

Expected: FAIL with missing-module errors for the new session snapshot files.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/modules/user-lifecycle-profiles/services/resolve-profile-gate.ts
import { ROLES, type Role } from "@/lib/constants/roles";

export type ProfileGate =
  | { status: "ROLE_SELECTION_REQUIRED" }
  | { status: "STUDENT_ONBOARDING_REQUIRED"; intent: "student" }
  | { status: "COMPLETE" };

export function resolveProfileGate(input: {
  roles: Role[];
  studentProfileId: string | null;
}): ProfileGate {
  if (input.roles.length === 0) {
    return { status: "ROLE_SELECTION_REQUIRED" };
  }

  const isStudentLikeRole =
    input.roles.includes(ROLES.STUDENT) || input.roles.includes(ROLES.GRADUATING_STUDENT);

  if (isStudentLikeRole && !input.studentProfileId) {
    return { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" };
  }

  return { status: "COMPLETE" };
}
```

```ts
// src/modules/identity-access/services/build-auth-session-snapshot.ts
import type { Role } from "@/lib/constants/roles";
import { resolveProfileGate } from "@/modules/user-lifecycle-profiles/services/resolve-profile-gate";
import { resolvePrimaryRole } from "./resolve-primary-role";

export type AuthSessionSnapshot = {
  userId: string;
  email: string | null;
  roles: Role[];
  primaryRole: Role | null;
  studentProfileId: string | null;
  profileGate: ReturnType<typeof resolveProfileGate>;
};

export function buildAuthSessionSnapshot(input: {
  userId: string;
  email: string | null;
  roles: Role[];
  studentProfileId: string | null;
}): AuthSessionSnapshot {
  return {
    userId: input.userId,
    email: input.email,
    roles: input.roles,
    primaryRole: resolvePrimaryRole(input.roles),
    studentProfileId: input.studentProfileId,
    profileGate: resolveProfileGate({
      roles: input.roles,
      studentProfileId: input.studentProfileId,
    }),
  };
}
```

```ts
// src/modules/identity-access/services/resolve-auth-session.ts
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/lib/constants/roles";
import { buildAuthSessionSnapshot } from "./build-auth-session-snapshot";

export async function resolveAuthSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: { include: { role: true } },
      student_profile: true,
    },
  });

  const roles = dbUser?.roles.map(({ role }) => role.name as Role) ?? [];
  const studentProfileId = dbUser?.student_profile?.id ?? null;

  return buildAuthSessionSnapshot({
    userId: user.id,
    email: user.email ?? null,
    roles,
    studentProfileId,
  });
}
```

```ts
// src/lib/auth/session.ts
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";

export async function getSession() {
  return resolveAuthSession();
}
```

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `pnpm vitest run src/__tests__/modules/identity-access/build-auth-session-snapshot.test.ts src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts`

Expected: PASS with all session and destination tests green.

- [ ] **Step 5: Commit the session slice**

```bash
git add src/modules/user-lifecycle-profiles/services/resolve-profile-gate.ts src/modules/identity-access/services/build-auth-session-snapshot.ts src/modules/identity-access/services/resolve-auth-session.ts src/lib/auth/session.ts src/__tests__/modules/identity-access/build-auth-session-snapshot.test.ts src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts
git commit -m "feat: add enriched auth session resolution"
```

## Task 3: Add Pure Role-Access Policies And Protected Route Entry Points

**Files:**
- Create: `src/modules/identity-access/policies/ensure-role-access.ts`
- Create: `src/__tests__/modules/identity-access/ensure-role-access.test.ts`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/student/layout.tsx`
- Create: `src/app/(app)/student/dashboard/page.tsx`
- Create: `src/app/(app)/faculty/layout.tsx`
- Create: `src/app/(app)/faculty/dashboard/page.tsx`
- Create: `src/app/(app)/program-head/layout.tsx`
- Create: `src/app/(app)/program-head/dashboard/page.tsx`
- Create: `src/app/(app)/dean/layout.tsx`
- Create: `src/app/(app)/dean/dashboard/page.tsx`
- Create: `src/app/(app)/admin/layout.tsx`
- Create: `src/app/(app)/admin/dashboard/page.tsx`
- Create: `src/app/unauthorized/page.tsx`

- [ ] **Step 1: Write the failing access-policy tests**

```ts
import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { ensureRoleAccess } from "@/modules/identity-access/policies/ensure-role-access";

describe("ensureRoleAccess", () => {
  it("redirects anonymous access to login", () => {
    expect(ensureRoleAccess({ primaryRole: null, allowedRoles: [ROLES.ADMIN] })).toBe("/login");
  });

  it("allows a matching role", () => {
    expect(ensureRoleAccess({ primaryRole: ROLES.ADMIN, allowedRoles: [ROLES.ADMIN] })).toBeNull();
  });

  it("blocks a mismatched role", () => {
    expect(ensureRoleAccess({ primaryRole: ROLES.STUDENT, allowedRoles: [ROLES.ADMIN] })).toBe(
      "/unauthorized"
    );
  });

  it("allows student-like dashboards to accept graduating students", () => {
    expect(
      ensureRoleAccess({
        primaryRole: ROLES.GRADUATING_STUDENT,
        allowedRoles: [ROLES.STUDENT, ROLES.GRADUATING_STUDENT],
      })
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/__tests__/modules/identity-access/ensure-role-access.test.ts`

Expected: FAIL with a missing-module error for `ensure-role-access`.

- [ ] **Step 3: Write the policy helper and route entry pages**

```ts
// src/modules/identity-access/policies/ensure-role-access.ts
import type { Role } from "@/lib/constants/roles";

export function ensureRoleAccess(input: {
  primaryRole: Role | null;
  allowedRoles: Role[];
  unauthorizedPath?: string;
}): string | null {
  if (!input.primaryRole) {
    return "/login";
  }

  if (input.allowedRoles.includes(input.primaryRole)) {
    return null;
  }

  return input.unauthorizedPath ?? "/unauthorized";
}
```

```tsx
// src/app/(app)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";

export default async function DashboardPage() {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  redirect(
    resolvePostLoginDestination({
      requestedPath: "/dashboard",
      intent: null,
      primaryRole: session.primaryRole,
      profileGate: session.profileGate,
    })
  );
}
```

```tsx
// src/app/(app)/student/layout.tsx
import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/components/auth/session-guard";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.STUDENT, ROLES.GRADUATING_STUDENT]}>{children}</SessionGuard>;
}
```

```tsx
// src/app/(app)/student/dashboard/page.tsx
export default function StudentDashboardPage() {
  return <div className="space-y-2"><h1 className="text-2xl font-bold">Student Dashboard</h1><p>Student inbox and evaluations will live here.</p></div>;
}
```

```tsx
// src/app/(app)/faculty/layout.tsx
import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/components/auth/session-guard";

export default function FacultyLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.FACULTY]}>{children}</SessionGuard>;
}
```

```tsx
// src/app/(app)/faculty/dashboard/page.tsx
export default function FacultyDashboardPage() {
  return <div className="space-y-2"><h1 className="text-2xl font-bold">Faculty Dashboard</h1><p>Faculty course and deployment tools will live here.</p></div>;
}
```

```tsx
// src/app/(app)/program-head/layout.tsx
import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/components/auth/session-guard";

export default function ProgramHeadLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.PROGRAM_HEAD]}>{children}</SessionGuard>;
}
```

```tsx
// src/app/(app)/program-head/dashboard/page.tsx
export default function ProgramHeadDashboardPage() {
  return <div className="space-y-2"><h1 className="text-2xl font-bold">Program Head Dashboard</h1><p>Program-level review and outcomes tools will live here.</p></div>;
}
```

```tsx
// src/app/(app)/dean/layout.tsx
import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/components/auth/session-guard";

export default function DeanLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.DEAN]}>{children}</SessionGuard>;
}
```

```tsx
// src/app/(app)/dean/dashboard/page.tsx
export default function DeanDashboardPage() {
  return <div className="space-y-2"><h1 className="text-2xl font-bold">Dean Dashboard</h1><p>Cross-program analytics and reports will live here.</p></div>;
}
```

```tsx
// src/app/(app)/admin/layout.tsx
import type { ReactNode } from "react";
import { ROLES } from "@/lib/constants/roles";
import { SessionGuard } from "@/components/auth/session-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SessionGuard allowedRoles={[ROLES.ADMIN]}>{children}</SessionGuard>;
}
```

```tsx
// src/app/(app)/admin/dashboard/page.tsx
export default function AdminDashboardPage() {
  return <div className="space-y-2"><h1 className="text-2xl font-bold">Admin Dashboard</h1><p>System administration tools will live here.</p></div>;
}
```

```tsx
// src/app/unauthorized/page.tsx
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">Unauthorized</h1>
      <p>You are signed in, but your current role cannot access this section.</p>
      <Link href="/dashboard" className="underline">
        Return to dashboard
      </Link>
    </main>
  );
}
```

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `pnpm vitest run src/__tests__/modules/identity-access/ensure-role-access.test.ts src/__tests__/modules/identity-access/build-auth-session-snapshot.test.ts src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts`

Expected: PASS with all identity-access tests green.

- [ ] **Step 5: Commit the access-policy slice**

```bash
git add src/modules/identity-access/policies/ensure-role-access.ts src/__tests__/modules/identity-access/ensure-role-access.test.ts src/app/(app)/dashboard/page.tsx src/app/(app)/student/layout.tsx src/app/(app)/student/dashboard/page.tsx src/app/(app)/faculty/layout.tsx src/app/(app)/faculty/dashboard/page.tsx src/app/(app)/program-head/layout.tsx src/app/(app)/program-head/dashboard/page.tsx src/app/(app)/dean/layout.tsx src/app/(app)/dean/dashboard/page.tsx src/app/(app)/admin/layout.tsx src/app/(app)/admin/dashboard/page.tsx src/app/unauthorized/page.tsx
git commit -m "feat: add protected internal dashboard entrypoints"
```

## Task 4: Integrate The New Session And Guard Logic Into The Existing App

**Files:**
- Modify: `src/components/auth/session-guard.tsx`
- Modify: `src/app/api/auth/callback/route.ts`
- Modify: `src/app/(public)/onboarding/page.tsx`
- Modify: `src/app/(public)/onboarding/student-profile-form.tsx`

- [ ] **Step 1: Write the failing integration-oriented test for the guard policy**

```ts
import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { ensureRoleAccess } from "@/modules/identity-access/policies/ensure-role-access";

describe("guard integration assumptions", () => {
  it("treats program-head routes as inaccessible to faculty", () => {
    expect(ensureRoleAccess({ primaryRole: ROLES.FACULTY, allowedRoles: [ROLES.PROGRAM_HEAD] })).toBe(
      "/unauthorized"
    );
  });

  it("treats admin routes as accessible to admins", () => {
    expect(ensureRoleAccess({ primaryRole: ROLES.ADMIN, allowedRoles: [ROLES.ADMIN] })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to confirm the current app wiring still needs the guard integration**

Run: `pnpm vitest run src/__tests__/modules/identity-access/ensure-role-access.test.ts`

Expected: PASS on the pure helper. Manual verification is still expected to fail because the route components do not yet call the new services.

- [ ] **Step 3: Refactor the app wiring to use the new services**

```tsx
// src/components/auth/session-guard.tsx
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Role } from "@/lib/constants/roles";
import { ensureRoleAccess } from "@/modules/identity-access/policies/ensure-role-access";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";

type SessionGuardProps = {
  children: ReactNode;
  allowedRoles?: Role[];
};

export async function SessionGuard({ children, allowedRoles = [] }: SessionGuardProps) {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  if (session.profileGate.status !== "COMPLETE") {
    redirect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: session.profileGate.status === "STUDENT_ONBOARDING_REQUIRED" ? "student" : null,
        primaryRole: session.primaryRole,
        profileGate: session.profileGate,
      })
    );
  }

  if (allowedRoles.length > 0) {
    const redirectPath = ensureRoleAccess({
      primaryRole: session.primaryRole,
      allowedRoles,
    });

    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  return <>{children}</>;
}
```

```ts
// src/app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth-failure`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth-failure`);
  }

  const email = data.user.email || "";
  const isAuthorized = email.endsWith("@acd.edu.ph") || email.endsWith("@acdeducation.com");

  if (!isAuthorized) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${siteUrl}/login?error=invalid_domain`);
  }

  const session = await resolveAuthSession();
  const nextUrl = resolvePostLoginDestination({
    requestedPath: searchParams.get("next") ?? "/dashboard",
    intent: searchParams.get("intent"),
    primaryRole: session?.primaryRole ?? null,
    profileGate: session?.profileGate ?? { status: "ROLE_SELECTION_REQUIRED" },
  });

  const redirectBase = !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : siteUrl;
  return NextResponse.redirect(`${redirectBase}${nextUrl}`);
}
```

```tsx
// src/app/(public)/onboarding/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";
import { createClient } from "@/lib/supabase/server";
import { StudentProfileForm } from "./student-profile-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const session = await resolveAuthSession();
  if (session && session.profileGate.status === "COMPLETE") {
    redirect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: session.primaryRole,
        profileGate: session.profileGate,
      })
    );
  }

  const programs = await prisma.program.findMany({ include: { majors: true } });
  const yearLevels = await prisma.yearLevel.findMany({ orderBy: { order: "asc" } });
  const resolvedParams = await searchParams;
  const intent = resolvedParams?.intent as string | undefined;
  const meta = user.user_metadata || {};
  const firstNameFallback = meta.full_name ? meta.full_name.split(" ")[0] : "";
  const lastNameFallback = meta.full_name ? meta.full_name.split(" ").slice(1).join(" ") : "";

  if (intent === "student") {
    return (
      <div className="mx-auto w-full max-w-2xl py-8">
        <StudentProfileForm
          email={user.email!}
          initialFirstName={firstNameFallback}
          initialLastName={lastNameFallback}
          programs={programs}
          yearLevels={yearLevels}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="overflow-hidden border-border shadow-card text-center">
        <div className="h-2 w-full bg-gradient-to-r from-primary to-info" />
        <CardHeader className="mt-2 space-y-2 pb-6">
          <CardTitle className="font-heading text-display-sm font-bold text-text-primary">Welcome to CLOIE</CardTitle>
          <CardDescription className="mt-2 px-2 text-body-md text-text-secondary">
            Let&apos;s get your account set up. Who are you logging in as today?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link
            href="?intent=student"
            className="inline-flex h-16 items-center justify-center rounded-lg border border-primary/30 bg-background text-[17px] font-semibold shadow-sm transition-all duration-300 hover:bg-primary-soft hover:text-primary"
          >
            I am a Student
          </Link>
          <Button variant="outline" disabled className="h-16 cursor-not-allowed border-dashed bg-surface text-[17px] opacity-50 shadow-sm">
            I am a Faculty Member (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

```tsx
// src/app/(public)/onboarding/student-profile-form.tsx
const onSubmit = async (data: StudentProfileInput) => {
  setGlobalError(null);
  const result = await registerStudentProfile(data);

  if (result.error) {
    setGlobalError(result.error);
    return;
  }

  router.push("/dashboard");
  router.refresh();
}
```

- [ ] **Step 4: Run focused tests and app-level verification**

Run: `pnpm vitest run src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts src/__tests__/modules/identity-access/build-auth-session-snapshot.test.ts src/__tests__/modules/identity-access/ensure-role-access.test.ts`

Expected: PASS.

Run: `pnpm dev`

Expected manual checks:
- student sign-in without a role lands on `/onboarding?intent=student` when using the student button
- completing student onboarding redirects through `/dashboard` to `/student/dashboard`
- admin or faculty test accounts land on their real dashboard pages
- visiting `/admin/dashboard` as a student redirects to `/unauthorized`

- [ ] **Step 5: Commit the app integration slice**

```bash
git add src/components/auth/session-guard.tsx src/app/api/auth/callback/route.ts src/app/(public)/onboarding/page.tsx src/app/(public)/onboarding/student-profile-form.tsx
git commit -m "feat: integrate domain-based access routing"
```

## Task 5: Run Full Verification For The Slice

**Files:**
- Modify: none
- Verify: whole changed slice

- [ ] **Step 1: Run the targeted test suite**

Run: `pnpm vitest run src/__tests__/modules/identity-access/resolve-post-login-destination.test.ts src/__tests__/modules/identity-access/build-auth-session-snapshot.test.ts src/__tests__/modules/identity-access/ensure-role-access.test.ts src/__tests__/schemas/student-profile.test.ts`

Expected: PASS.

- [ ] **Step 2: Run the full unit test suite**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`

Expected: PASS with no new ESLint errors.

- [ ] **Step 4: Review the changed route map manually**

Check these URLs in the browser after logging in with representative accounts:

- `/dashboard`
- `/student/dashboard`
- `/faculty/dashboard`
- `/program-head/dashboard`
- `/dean/dashboard`
- `/admin/dashboard`
- `/unauthorized`

Expected:

- valid users reach exactly one allowed dashboard
- incomplete students are redirected to onboarding
- forbidden role access is redirected to `/unauthorized`

- [ ] **Step 5: Commit the verified slice**

```bash
git add src/modules src/app src/components/auth/session-guard.tsx src/lib/auth/session.ts src/__tests__/modules
git commit -m "test: verify foundation access routing slice"
```

## Self-Review Checklist

- Spec coverage: this plan covers the first implementation slice of `identity-access` and `user-lifecycle-profiles`, including session enrichment, onboarding gating, role routing, and protected route groups.
- Placeholder scan: no unfinished placeholder markers remain in the task steps.
- Type consistency: `ProfileGate`, `Role`, `resolveAuthSession`, `resolvePrimaryRole`, `resolvePostLoginDestination`, and `ensureRoleAccess` use the same names across all tasks.
