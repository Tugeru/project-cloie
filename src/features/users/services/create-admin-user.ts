import { SystemRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CreateAdminUserInput } from "../schemas/create-user";

import { type ServiceResult } from "@/lib/utils/service-result";
import { isUniqueConstraintError } from "@/lib/utils/prisma-errors";

export async function createAdminUser(
  input: CreateAdminUserInput
): Promise<ServiceResult<{ id: string }>> {
  const { first_name, last_name, email, role, program_ids, program_id, major_id } = input;

  // 1. Check for duplicate email
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return { success: false, error: "A user with this email already exists." };
  }

  try {
    // 2. Atomic transaction: create user + role + role-specific records
    const user = await prisma.$transaction(async (tx) => {
      // a. Create User record
      const newUser = await tx.user.create({
        data: {
          first_name,
          last_name,
          email,
          is_active: true,
        },
      });

      // b. Create UserRole record
      await tx.userRole.create({
        data: {
          user_id: newUser.id,
          role,
        },
      });

      // c. Role-specific records
      switch (role) {
        case SystemRole.FACULTY: {
          if (program_ids && program_ids.length > 0) {
            await tx.facultyProgramAffiliation.createMany({
              data: program_ids.map((pid) => ({
                faculty_id: newUser.id,
                program_id: pid,
                is_active: true,
              })),
            });
          }
          break;
        }

        case SystemRole.PROGRAM_HEAD: {
          if (program_id) {
            await tx.programHeadAssignment.create({
              data: {
                program_head_id: newUser.id,
                program_id,
                is_active: true,
              },
            });
          }
          break;
        }

        case SystemRole.INDUSTRY_PARTNER: {
          const primaryProgramId = program_ids && program_ids.length > 0 ? program_ids[0] : null;
          await tx.industryPartnerProfile.create({
            data: {
              user_id: newUser.id,
              company_name: "(Not set)",
              program_id: primaryProgramId ?? null,
            },
          });
          break;
        }

        // STUDENT, ALUMNI, ADMIN, DEAN — just the role is sufficient
        default:
          break;
      }

      return newUser;
    });

    return { success: true, data: { id: user.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "A user with this email already exists." };
    }

    throw error;
  }
}
