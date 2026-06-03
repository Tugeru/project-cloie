import { SystemRole } from "@prisma/client";

export interface ValidationResult {
  valid: boolean;
  reason?: "invalid_domain" | "invite-only";
}

/**
 * Validates whether the given email domain is allowed for the specified role intent.
 * 
 * - Internal roles (STUDENT, FACULTY) require institutional domains (@acd.edu.ph or @acdeducation.com).
 * - External roles (ALUMNI, INDUSTRY_PARTNER) allow any domain.
 * - Admin roles (ADMIN, DEAN, PROGRAM_HEAD) are invite-only and rejected from self-service.
 */
export function validateRoleDomain(email: string, intent: SystemRole): ValidationResult {
  const normalizedEmail = email.toLowerCase().trim();

  // Admin roles are invite-only and cannot sign up via self-service OAuth intents
  if (
    intent === SystemRole.ADMIN ||
    intent === SystemRole.DEAN ||
    intent === SystemRole.PROGRAM_HEAD
  ) {
    return {
      valid: false,
      reason: "invite-only",
    };
  }

  // Internal roles (STUDENT, FACULTY) require institutional domains
  if (intent === SystemRole.STUDENT || intent === SystemRole.FACULTY) {
    const isInstitutional =
      normalizedEmail.endsWith("@acd.edu.ph") ||
      normalizedEmail.endsWith("@acdeducation.com");
    if (!isInstitutional) {
      return {
        valid: false,
        reason: "invalid_domain",
      };
    }
  }

  // External roles (ALUMNI, INDUSTRY_PARTNER) allow any domain
  return { valid: true };
}
