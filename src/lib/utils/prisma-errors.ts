import { Prisma } from "@prisma/client";

/**
 * Check if an unknown error is a Prisma unique constraint violation (P2002).
 */
export function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
