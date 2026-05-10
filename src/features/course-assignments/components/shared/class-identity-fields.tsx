"use client";

import { YearLevel, StudentSection } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { YEAR_LEVEL_OPTIONS, STUDENT_SECTION_OPTIONS } from "@/lib/constants/academic";

interface ClassIdentityFieldsProps {
  programId: string;
  yearLevel: YearLevel;
  section: StudentSection | null;
  availablePrograms: Array<{ id: string; code: string; name: string }>;
  onProgramChange: (value: string) => void;
  onYearLevelChange: (value: YearLevel) => void;
  onSectionChange: (value: StudentSection | null) => void;
  disabled?: boolean;
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
}: ClassIdentityFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="program">Program</Label>
        <Select value={programId} onValueChange={(value) => value && onProgramChange(value)} disabled={disabled}>
          <SelectTrigger id="program">
            <SelectValue placeholder="Select program" />
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

      <div className="space-y-2">
        <Label htmlFor="year-level">Year Level</Label>
        <Select
          value={yearLevel}
          onValueChange={(value) => onYearLevelChange(value as YearLevel)}
          disabled={disabled}
        >
          <SelectTrigger id="year-level">
            <SelectValue placeholder="Select year" />
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
        <Label htmlFor="section">Section (Optional)</Label>
        <Select
          value={section ?? "none"}
          onValueChange={(value) => onSectionChange(value === "none" ? null : (value as StudentSection))}
          disabled={disabled}
        >
          <SelectTrigger id="section">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {STUDENT_SECTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
