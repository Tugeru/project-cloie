export const ROLES = {
  ADMIN: "ADMIN",
  DEAN: "DEAN",
  PROGRAM_HEAD: "PROGRAM_HEAD",
  FACULTY: "FACULTY",
  STUDENT: "STUDENT",
  GRADUATING_STUDENT: "GRADUATING_STUDENT",
  ALUMNI: "ALUMNI",
  INDUSTRY_PARTNER: "INDUSTRY_PARTNER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Hierarchy for simple role-based UI access where logical
export const ROLE_LEVELS: Record<Role, number> = {
  ADMIN: 100,
  DEAN: 80,
  PROGRAM_HEAD: 70,
  FACULTY: 50,
  STUDENT: 10,
  GRADUATING_STUDENT: 15,
  ALUMNI: 20,
  INDUSTRY_PARTNER: 30,
};
