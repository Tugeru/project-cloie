"use client";

import { useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, AlertTriangle, User } from "lucide-react";
import { searchFacultyPoolAction } from "@/lib/actions/course-assignment-actions";
import { useDebounce } from "@/hooks/use-debounce";
import type { FacultySearchResult } from "@/features/course-assignments/types";

interface FacultySearchPopoverProps {
  selectedFacultyId: string | null;
  selectedFacultyName: string | null;
  targetProgramId?: string;
  targetProgramName?: string;
  onSelect: (faculty: FacultySearchResult) => void;
  disabled?: boolean;
}

export function FacultySearchPopover({
  selectedFacultyId,
  selectedFacultyName,
  targetProgramId,
  targetProgramName,
  onSelect,
  disabled = false,
}: FacultySearchPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FacultySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(
    useCallback(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      const result = await searchFacultyPoolAction(searchQuery, 0, 10);
      
      if (result.success) {
        setResults(result.data.items);
        setTotal(result.data.total);
      }
      setLoading(false);
    }, []),
    300
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSelect = (faculty: FacultySearchResult) => {
    onSelect(faculty);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const isCrossProgram = (faculty: FacultySearchResult) => {
    if (!targetProgramId || !targetProgramName) return false;
    return !faculty.affiliations.includes(targetProgramName);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedFacultyId ? (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {selectedFacultyName || "Unknown Faculty"}
            </span>
          ) : (
            <span className="text-muted-foreground">Search faculty...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="mb-2"
          />

          {loading && (
            <div className="space-y-2 p-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {!loading && results.length === 0 && query.trim() && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No faculty found matching &quot;{query}&quot;
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1 max-h-[300px] overflow-auto">
              {results.map((faculty) => {
                const isSelected = selectedFacultyId === faculty.id;
                const isDifferentProgram = isCrossProgram(faculty);

                return (
                  <button
                    key={faculty.id}
                    onClick={() => handleSelect(faculty)}
                    className={`
                      w-full flex items-start gap-2 p-2 rounded-md text-left
                      hover:bg-accent transition-colors
                      ${isSelected ? "bg-accent" : ""}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {faculty.firstName} {faculty.lastName}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {faculty.email}
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {faculty.primaryAffiliation && (
                          <Badge variant="secondary" className="text-xs">
                            {faculty.primaryAffiliation}
                          </Badge>
                        )}
                        {isDifferentProgram && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Different Program
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {total > results.length && (
            <div className="text-xs text-muted-foreground text-center py-2">
              +{total - results.length} more results
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
