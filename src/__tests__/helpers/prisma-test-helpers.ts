import { Prisma } from "@prisma/client";

/**
 * Create a realistic PrismaClientKnownRequestError for testing unique constraint
 * violations (P2002). Use this instead of plain `{ code: "P2002" }` objects so
 * that `instanceof` checks in production code pass correctly in unit tests.
 *
 * @example
 * (prisma.$transaction as any).mockRejectedValue(createPrismaUniqueConstraintError());
 */
export function createPrismaUniqueConstraintError(
  message = "Unique constraint failed on the fields"
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code: "P2002",
    clientVersion: "test",
  });
}
