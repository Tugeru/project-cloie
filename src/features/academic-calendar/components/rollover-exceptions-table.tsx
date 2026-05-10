"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RolloverException, RolloverExceptionType } from "../services/run-term-rollover";

interface RolloverExceptionsTableProps {
  exceptions: RolloverException[];
  onEditStudent?: (studentUserId: string) => void;
}

const EXCEPTION_TYPE_CONFIG: Record<
  RolloverExceptionType,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  GRADUATING: { label: "Graduating", variant: "secondary" },
  MISSING_DATA: { label: "Missing Data", variant: "destructive" },
  DUPLICATE: { label: "Duplicate", variant: "outline" },
};

export function RolloverExceptionsTable({
  exceptions,
  onEditStudent,
}: RolloverExceptionsTableProps) {
  if (exceptions.length === 0) {
    return (
      <div className="text-text-muted py-8 text-center text-sm">
        No exceptions - all students processed successfully.
      </div>
    );
  }

  return (
    <div className="border-border rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-surface-container-low">
          <tr className="text-text-secondary text-left text-xs font-semibold uppercase">
            <th className="px-3 py-2">Student</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Current Year</th>
            <th className="px-3 py-2">Reason</th>
            {onEditStudent && <th className="px-3 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {exceptions.map((exception) => {
            const typeConfig = EXCEPTION_TYPE_CONFIG[exception.exceptionType];

            return (
              <tr key={exception.studentUserId}>
                <td className="px-3 py-2">
                  <div>
                    <p className="font-medium">{exception.studentName}</p>
                    <p className="text-text-muted text-xs">{exception.studentEmail}</p>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                </td>
                <td className="px-3 py-2">
                  {exception.currentYearLevel.replace("_", " ")}
                </td>
                <td className="px-3 py-2 text-text-secondary">
                  {exception.message}
                </td>
                {onEditStudent && (
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditStudent(exception.studentUserId)}
                    >
                      Edit
                    </Button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
