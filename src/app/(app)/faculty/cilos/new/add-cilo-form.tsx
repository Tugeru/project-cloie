"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { FacultyCourseWithCiloCount } from "@/features/evaluations/services/list-faculty-courses-with-cilos";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type AddCiloFormProps = {
  courses: FacultyCourseWithCiloCount[];
  programs: Array<{ id: string; code: string; name: string }>;
  addAction: (
    courseId: string,
    descriptions: string[],
  ) => Promise<{ success: boolean; error?: string }>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddCiloForm({ courses, programs, addAction }: AddCiloFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [courseType, setCourseType] = useState<string>("__none__");
  const [programId, setProgramId] = useState<string>("__none__");
  const [courseId, setCourseId] = useState<string>("__none__");
  const [ciloText, setCiloText] = useState("");
  const [ciloList, setCiloList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Derive available courses based on filters
  const filteredCourses = useMemo(() => {
    let result = courses;

    if (courseType === "program_specific") {
      result = result.filter(
        (c) => c.courseScope === "PROGRAM_SPECIFIC",
      );
    } else if (courseType === "general_education") {
      result = result.filter((c) => c.courseScope === "GENERAL_EDUCATION");
    }

    if (programId !== "__none__") {
      result = result.filter(
        (c) => c.programId === programId || c.courseScope === "GENERAL_EDUCATION",
      );
    }

    return result;
  }, [courses, courseType, programId]);

  const handleAddCilo = () => {
    if (!ciloText.trim()) return;
    setCiloList((prev) => [...prev, ciloText.trim()]);
    setCiloText("");
  };

  const handleRemoveCilo = (index: number) => {
    setCiloList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (courseId === "__none__") {
      setError("Please select a course.");
      return;
    }
    if (ciloList.length === 0) {
      setError("Please add at least one CILO.");
      return;
    }

    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await addAction(courseId, ciloList);

      if (!result.success) {
        setError(result.error ?? "Failed to save CILOs.");
        return;
      }

      setSuccessMessage("CILOs added successfully!");
      setCiloList([]);
      setCiloText("");
      setCourseId("__none__");
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/faculty/cilos"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      {/* Breadcrumb */}
      <nav className="text-xs text-text-muted">
        Manage CILOs &gt; Add New CILO
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Add New CILOs</CardTitle>
          <CardDescription>
            Select a course and add one or more Course-Intended Learning
            Outcomes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {/* Course Type */}
          <div className="space-y-2">
            <Label>Course Type</Label>
            <Select
              value={courseType}
              onValueChange={(v) => {
                setCourseType(v ?? "__none__");
                setCourseId("__none__");
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {courseType === "__none__"
                    ? "Select course type..."
                    : courseType === "program_specific"
                      ? "Program-Specific"
                      : "General Education"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="program_specific">Program-Specific</SelectItem>
                <SelectItem value="general_education">General Education</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Program */}
          {courseType === "program_specific" && (
            <div className="space-y-2">
              <Label>Program</Label>
              <Select
                value={programId}
                onValueChange={(v) => {
                  setProgramId(v ?? "__none__");
                  setCourseId("__none__");
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    {programId === "__none__"
                      ? "Select program..."
                      : programs.find((p) => p.id === programId)?.code ??
                        "Select program..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Course */}
          <div className="space-y-2">
            <Label>Course</Label>
            <Select
              value={courseId}
              onValueChange={(v) => setCourseId(v ?? "__none__")}
            >
              <SelectTrigger>
                <SelectValue>
                  {courseId === "__none__"
                    ? "Select course..."
                    : filteredCourses.find((c) => c.id === courseId)?.code ??
                      "Select course..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CILO Input */}
          <div className="space-y-2">
            <Label>CILO Description</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type a CILO description..."
                value={ciloText}
                onChange={(e) => setCiloText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCilo();
                  }
                }}
              />
              <Button variant="outline" onClick={handleAddCilo}>
                <Plus className="mr-1 size-4" />
                Add
              </Button>
            </div>
          </div>

          {/* CILO List */}
          {ciloList.length > 0 && (
            <div className="space-y-2">
              <Label>CILOs to Add ({ciloList.length})</Label>
              <div className="space-y-2">
                {ciloList.map((cilo, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-sm">{cilo}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveCilo(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isPending || ciloList.length === 0}
            className="w-full"
          >
            {isPending ? "Saving..." : "Save CILOs"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
