import { ROLES, type Role } from "@/lib/constants/roles";

export function getLandingPageForRole(role: Role | null): string {
  if (!role) return "/login";

  switch (role) {
    case ROLES.ADMIN:
      return "/admin/dashboard";
    case ROLES.DEAN:
    case ROLES.PROGRAM_HEAD:
      return "/academic/dashboard";
    case ROLES.FACULTY:
      return "/faculty/dashboard";
    case ROLES.STUDENT:
    case ROLES.GRADUATING_STUDENT:
      return "/student/dashboard";
    case ROLES.ALUMNI:
    case ROLES.INDUSTRY_PARTNER:
      return "/external/dashboard";
    default:
      return "/dashboard";
  }
}
