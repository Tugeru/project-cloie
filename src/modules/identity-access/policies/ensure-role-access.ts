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
