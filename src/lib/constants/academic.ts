import { AcademicSemester, AcademicTerm } from "@prisma/client";

export const SEMESTER_OPTIONS = [
  { label: "1st Semester", value: AcademicSemester.FIRST },
  { label: "2nd Semester", value: AcademicSemester.SECOND },
  { label: "Summer", value: AcademicSemester.SUMMER },
] as const;

export const TERM_OPTIONS = [
  { label: "1st Term", value: AcademicTerm.FIRST_TERM },
  { label: "2nd Term", value: AcademicTerm.SECOND_TERM },
] as const;

export function getSemesterLabel(value: AcademicSemester | null | undefined) {
  return SEMESTER_OPTIONS.find((option) => option.value === value)?.label ?? "Unknown Semester";
}

export function getTermLabel(value: AcademicTerm | null | undefined) {
  return TERM_OPTIONS.find((option) => option.value === value)?.label ?? "Unknown Term";
}
