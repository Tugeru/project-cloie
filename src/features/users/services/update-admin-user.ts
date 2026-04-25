import { prisma } from "@/lib/db/prisma";
import type { UpdateAdminUserInput } from "../schemas/update-user";

type ServiceResult = { success: true } | { success: false; error: string };

export async function updateAdminUser(
  input: UpdateAdminUserInput,
): Promise<ServiceResult> {
  const { id, first_name, last_name } = input;

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return { success: false, error: "User not found." };
  }

  await prisma.user.update({
    where: { id },
    data: {
      first_name,
      last_name,
    },
  });

  return { success: true };
}
