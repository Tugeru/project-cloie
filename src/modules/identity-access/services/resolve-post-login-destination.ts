import { ROLES, type Role } from "@/lib/constants/roles";
import type { ProfileGate } from "@/modules/user-lifecycle-profiles/services/resolve-profile-gate";

type DestinationInput = {
  requestedPath?: string | null;
  intent?: string | null;
  primaryRole: Role | null;
  profileGate: ProfileGate;
};

function sanitizeRequestedPath(requestedPath?: string | null): string | null {
  if (!requestedPath || requestedPath === "/dashboard") {
    return null;
  }

  if (!requestedPath.startsWith("/") || requestedPath.startsWith("//")) {
    return null;
  }

  if (/[\u0000-\u001F\u007F\\]/.test(requestedPath)) {
    return null;
  }

  return requestedPath;
}

export function resolvePostLoginDestination({
  requestedPath,
  intent,
  primaryRole,
  profileGate,
}: DestinationInput): string {
  const sanitizedRequestedPath = sanitizeRequestedPath(requestedPath);

  if (profileGate.status === "ROLE_SELECTION_REQUIRED") {
    return intent === "student" ? "/onboarding?intent=student" : "/onboarding";
  }

  if (profileGate.status === "STUDENT_ONBOARDING_REQUIRED") {
    return "/onboarding?intent=student";
  }

  if (sanitizedRequestedPath && !sanitizedRequestedPath.startsWith("/onboarding")) {
    return sanitizedRequestedPath;
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
    case ROLES.ALUMNI:
    case ROLES.INDUSTRY_PARTNER:
      return "/unauthorized";
    default:
      return "/dashboard";
  }
}
