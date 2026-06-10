import type { Role } from "@/lib/constants/roles";

export function ensureRoleAccess(input: {
  primaryRole: Role | null;
  roles?: Role[];
  allowedRoles: Role[];
  unauthorizedPath?: string;
}): string | null {
  if (!input.primaryRole) {
    return "/portal";
  }

  const rolesToCheck = input.roles && input.roles.length > 0 ? input.roles : [input.primaryRole];

  if (rolesToCheck.some((role) => input.allowedRoles.includes(role))) {
    return null;
  }

  return input.unauthorizedPath ?? "/unauthorized";
}
