import { ROLES } from "@/lib/constants/roles";
import type { ReviewerRole } from "../types";

export function buildReviewerEvaluationScope({
  programScope,
  reviewerId,
  reviewerRole,
}: {
  programScope: string[] | null;
  reviewerId: string;
  reviewerRole: ReviewerRole;
}) {
  return {
    ...(programScope ? { program_id: { in: programScope } } : {}),
    ...(reviewerRole === ROLES.FACULTY ? { faculty_id: reviewerId } : {}),
  };
}

export function pickReviewerRole(roles: string[] | undefined): ReviewerRole | null {
  if (!roles) {
    return null;
  }

  if (roles.includes(ROLES.DEAN)) {
    return ROLES.DEAN;
  }

  if (roles.includes(ROLES.PROGRAM_HEAD)) {
    return ROLES.PROGRAM_HEAD;
  }

  if (roles.includes(ROLES.FACULTY)) {
    return ROLES.FACULTY;
  }

  return null;
}

function hashIdentifier(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

export function buildAnonymizedRespondentLabel(identifier: string) {
  const code = String(hashIdentifier(identifier) % 1000000).padStart(6, "0");
  return `Respondent R-${code}`;
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, current) => sum + current, 0);
  return roundToTwo(total / values.length);
}
