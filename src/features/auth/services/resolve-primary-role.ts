import { ROLES, type Role } from "@/lib/constants/roles";

const ROLE_PRIORITY: Role[] = [
  ROLES.ADMIN,
  ROLES.DEAN,
  ROLES.PROGRAM_HEAD,
  ROLES.FACULTY,
  ROLES.INDUSTRY_PARTNER,
  ROLES.ALUMNI,
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
