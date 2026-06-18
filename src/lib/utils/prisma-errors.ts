import { Prisma } from "@prisma/client";

/**
 * Check if an unknown error is a Prisma unique constraint violation (P2002).
 * Uses instanceof to ensure the type predicate is sound — callers can safely
 * access PrismaClientKnownRequestError properties (meta, clientVersion, etc.)
 * after this guard passes.
 */
export function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
