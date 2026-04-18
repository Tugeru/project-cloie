import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/lib/constants/roles";

export async function getUserRoles(userId: string): Promise<Role[]> {
  try {
    // This assumes the schema in Task 9 maps UserRole -> Role correctly.
    // If Prisma schema is not yet generated, this might show an IDE tip, but it's correct.
    const userRoles = await prisma.userRole.findMany({
      where: { user_id: userId },
      include: { role: true },
    });

    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    return userRoles.map((ur: { role: { name: string } }) => ur.role.name as Role);
  } catch (error) {
    console.error("Error resolving user roles:", error);
    return [];
  }
}

export async function getPrimaryRole(userId: string): Promise<Role | null> {
  const roles = await getUserRoles(userId);
  if (roles.length === 0) return null;
  
  // For simplicity, return the first one. 
  // We can enhance this later to pick the highest privilege if a user has multiple.
  return roles[0] || null;
}
