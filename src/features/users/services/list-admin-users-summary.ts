import { SystemRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { ROLE_LEVELS } from "@/lib/constants/roles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminUserSummaryItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: SystemRole[];
  primaryRole: SystemRole | null;
  programLabel: string;
  majorLabel: string;
};

export type AdminUsersKPI = {
  totalUsers: number;
  totalStudents: number;
  totalAlumni: number;
  totalIndustryPartners: number;
};

export type AdminUsersSummaryResult = {
  users: AdminUserSummaryItem[];
  kpi: AdminUsersKPI;
  programs: Array<{
    id: string;
    code: string;
    name: string;
    majors: Array<{ id: string; name: string }>;
  }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the highest-precedence role from a list of roles based on
 * the ROLE_LEVELS hierarchy (higher number = higher precedence).
 */
function resolveHighestRole(roles: SystemRole[]): SystemRole | null {
  if (roles.length === 0) return null;
  return roles.reduce((best, role) =>
    (ROLE_LEVELS[role] ?? 0) > (ROLE_LEVELS[best] ?? 0) ? role : best
  );
}

/**
 * Derives the program label for a user from their various affiliations.
 * Priority: student_profile > faculty affiliations > PH assignments > IP profile.
 */
function resolveProgramLabel(user: PrismaUserWithIncludes): string {
  // Student profile program
  if (user.student_profile?.program) {
    return user.student_profile.program.code;
  }

  // Faculty affiliations (may have multiple active programs)
  const facultyCodes = user.faculty_program_affiliations
    .filter((a) => a.is_active)
    .map((a) => a.program.code);
  if (facultyCodes.length > 0) {
    return facultyCodes.join(", ");
  }

  // Program head assignments
  const phCodes = user.program_head_assignments
    .filter((a) => a.is_active)
    .map((a) => a.program.code);
  if (phCodes.length > 0) {
    return phCodes.join(", ");
  }

  // Industry partner profile
  if (user.industry_partner_profile?.program) {
    return user.industry_partner_profile.program.code;
  }

  return "—";
}

/**
 * Derives the major label from the student profile, if any.
 */
function resolveMajorLabel(user: PrismaUserWithIncludes): string {
  return user.student_profile?.major?.name ?? "N/A";
}

// ---------------------------------------------------------------------------
// Prisma user shape (internal type for the raw query result)
// ---------------------------------------------------------------------------

type PrismaUserWithIncludes = Awaited<ReturnType<typeof queryUsers>>[number];

async function queryUsers() {
  return prisma.user.findMany({
    orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
    include: {
      roles: true,
      student_profile: {
        include: {
          program: { select: { id: true, code: true, name: true } },
          major: { select: { id: true, name: true } },
        },
      },
      faculty_program_affiliations: {
        include: {
          program: { select: { id: true, code: true, name: true } },
        },
      },
      program_head_assignments: {
        include: {
          program: { select: { id: true, code: true, name: true } },
        },
      },
      industry_partner_profile: {
        include: {
          program: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Main service function
// ---------------------------------------------------------------------------

export async function listAdminUsersSummary(): Promise<AdminUsersSummaryResult> {
  const [rawUsers, programs] = await Promise.all([
    queryUsers(),
    prisma.program.findMany({
      where: { is_active: true },
      orderBy: { code: "asc" },
      include: {
        majors: {
          where: { is_active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  // KPI accumulators
  let totalStudents = 0;
  let totalAlumni = 0;
  let totalIndustryPartners = 0;

  const users: AdminUserSummaryItem[] = rawUsers.map((u) => {
    const roleEnums = u.roles.map((r) => r.role);

    // KPI counting
    if (roleEnums.includes(SystemRole.STUDENT)) totalStudents++;
    if (roleEnums.includes(SystemRole.ALUMNI)) totalAlumni++;
    if (roleEnums.includes(SystemRole.INDUSTRY_PARTNER)) totalIndustryPartners++;

    return {
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      isActive: u.is_active,
      roles: roleEnums,
      primaryRole: resolveHighestRole(roleEnums),
      programLabel: resolveProgramLabel(u),
      majorLabel: resolveMajorLabel(u),
    };
  });

  return {
    users,
    kpi: {
      totalUsers: rawUsers.length,
      totalStudents,
      totalAlumni,
      totalIndustryPartners,
    },
    programs: programs.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      majors: p.majors,
    })),
  };
}
