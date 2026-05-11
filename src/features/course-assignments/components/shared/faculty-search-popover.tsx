"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, AlertTriangle, User, ChevronDown } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFaculty = useCallback(async (searchQuery: string) => {
    setLoading(true);
    const result = await searchFacultyPoolAction(searchQuery, 0, 20);
    if (result.success) {
      setResults(result.data.items);
      setTotal(result.data.total);
    }
    setLoading(false);
  }, []);

  const debouncedSearch = useDebounce(fetchFaculty, 300);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
    if (results.length === 0 && !loading) {
      fetchFaculty("");
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSelect = (faculty: FacultySearchResult) => {
    onSelect(faculty);
    setOpen(false);
    setQuery("");
  };

  const isCrossProgram = (faculty: FacultySearchResult) => {
    if (!targetProgramId || !targetProgramName) return false;
    return !faculty.affiliations.includes(targetProgramName);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={[
          "flex h-9 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors",
          "border-input bg-transparent hover:bg-accent/50",
          open ? "ring-2 ring-ring ring-offset-1" : "",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        ].join(" ")}
      >
        {selectedFacultyId ? (
          <span className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{selectedFacultyName || "Unknown Faculty"}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Search faculty...</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {/* Inline dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border bg-popover shadow-md">
          <div className="p-2">
            <Input
              ref={inputRef}
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="max-h-[260px] overflow-y-auto px-1 pb-1">
            {loading && (
              <div className="space-y-1 p-1">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {query.trim() ? `No faculty found matching "${query}"` : "No faculty available."}
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-0.5">
                {results.map((faculty) => {
                  const isSelected = selectedFacultyId === faculty.id;
                  const isDifferentProgram = isCrossProgram(faculty);

                  return (
                    <button
                      key={faculty.id}
                      type="button"
                      onClick={() => handleSelect(faculty)}
                      className={[
                        "w-full flex items-start gap-2 rounded-md p-2 text-left transition-colors hover:bg-accent",
                        isSelected ? "bg-accent" : "",
                      ].join(" ")}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate text-sm">
                            {faculty.firstName} {faculty.lastName}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {faculty.email}
                        </div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {faculty.primaryAffiliationCode && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {faculty.primaryAffiliationCode}
                            </Badge>
                          )}
                          {isDifferentProgram && (
                            <Badge variant="destructive" className="text-xs gap-1 px-1.5 py-0">
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

            {!loading && total > results.length && (
              <div className="border-t px-2 py-1.5 text-xs text-muted-foreground text-center">
                +{total - results.length} more — type to narrow results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
