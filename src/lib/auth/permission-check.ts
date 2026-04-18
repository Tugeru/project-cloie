import { type Role, ROLE_LEVELS } from "@/lib/constants/roles";

export function canAccess(userRole: Role | null, requiredRoleLevel: number): boolean {
  if (!userRole) return false;
  
  const currentLevel = ROLE_LEVELS[userRole];
  return currentLevel >= requiredRoleLevel;
}

export function isExactRole(userRole: Role | null, targetRole: Role): boolean {
  return userRole === targetRole;
}
