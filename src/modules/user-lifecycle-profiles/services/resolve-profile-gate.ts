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
