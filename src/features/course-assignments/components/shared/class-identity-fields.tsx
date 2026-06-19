"use client";

import { YearLevel, StudentSection } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { YEAR_LEVEL_OPTIONS, STUDENT_SECTION_OPTIONS } from "@/lib/constants/academic";
import { getYearLevelDisplay } from "@/lib/constants/year-levels";

interface ClassIdentityFieldsProps {
  programId: string;
  yearLevel: YearLevel;
  section: StudentSection | null;
  availablePrograms: Array<{ id: string; code: string; name: string }>;
  onProgramChange: (value: string) => void;
  onYearLevelChange: (value: YearLevel) => void;
  onSectionChange: (value: StudentSection | null) => void;
  disabled?: boolean;
  suggestedYearLevel?: YearLevel | null;
}

export function ClassIdentityFields({
  programId,
  yearLevel,
  section,
  availablePrograms,
  onProgramChange,
  onYearLevelChange,
  onSectionChange,
  disabled = false,
  suggestedYearLevel,
}: ClassIdentityFieldsProps) {
  const showsHint = suggestedYearLevel != null && yearLevel === suggestedYearLevel;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="program">Program</Label>
        <Select value={programId} onValueChange={(value) => value && onProgramChange(value)} disabled={disabled}>
          <SelectTrigger id="program">
            <SelectValue placeholder="Select program">
              {programId
                ? (() => {
                    const p = availablePrograms.find((p) => p.id === programId);
                    return p ? `${p.code} — ${p.name}` : null;
                  })()
                : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availablePrograms.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.code} — {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="year-level">Year Level</Label>
            {showsHint && (
              <Badge variant="secondary" className="text-xs">
                Course default: {getYearLevelDisplay(suggestedYearLevel)}
              </Badge>
            )}
          </div>
          <Select
            value={yearLevel}
            onValueChange={(value) => onYearLevelChange(value as YearLevel)}
            disabled={disabled}
          >
            <SelectTrigger id="year-level">
              <SelectValue placeholder="Select year">
                {yearLevel
                  ? (YEAR_LEVEL_OPTIONS.find((o) => o.value === yearLevel)?.label ?? null)
                  : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {YEAR_LEVEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          <Select
            value={section ?? ""}
            onValueChange={(value) => onSectionChange(value as StudentSection)}
            disabled={disabled}
          >
            <SelectTrigger id="section">
              <SelectValue placeholder="Select section">
                {section
                  ? (STUDENT_SECTION_OPTIONS.find((o) => o.value === section)?.label ?? null)
                  : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STUDENT_SECTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
