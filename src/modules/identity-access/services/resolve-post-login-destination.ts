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
