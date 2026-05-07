import { YearLevel } from "@prisma/client";

/**
 * Display mapping for YearLevel enum values.
 * Maps FIRST_YEAR → "1st Year", etc.
 */
export const YEAR_LEVEL_DISPLAY: Record<YearLevel, string> = {
  [YearLevel.FIRST_YEAR]: "1st Year",
  [YearLevel.SECOND_YEAR]: "2nd Year",
  [YearLevel.THIRD_YEAR]: "3rd Year",
  [YearLevel.FOURTH_YEAR]: "4th Year",
};

/**
 * Options array for select dropdowns.
 * Usage: <Select options={YEAR_LEVEL_OPTIONS} />
 */
export const YEAR_LEVEL_OPTIONS: { value: YearLevel; label: string }[] = [
  { value: YearLevel.FIRST_YEAR, label: "1st Year" },
  { value: YearLevel.SECOND_YEAR, label: "2nd Year" },
  { value: YearLevel.THIRD_YEAR, label: "3rd Year" },
  { value: YearLevel.FOURTH_YEAR, label: "4th Year" },
];

/**
 * Helper to get display label for a YearLevel enum value.
 */
export function getYearLevelDisplay(yearLevel: YearLevel | null | undefined): string {
  if (!yearLevel) return "—";
  return YEAR_LEVEL_DISPLAY[yearLevel] ?? yearLevel;
}
