"use client";

import { useState, type FormEvent } from "react";
import type {
  FacultyCourseContext,
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationResult,
} from "@/modules/deployments-and-targeting/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type YearLevelOption = {
  id: string;
  name: string;
  order: number;
};

interface PublishCourseBoundEvaluationFormProps {
  courseContexts: FacultyCourseContext[];
  yearLevels: YearLevelOption[];
  publishAction: (payload: PublishCourseBoundEvaluationInput) => Promise<PublishCourseBoundEvaluationResult>;
}

export function PublishCourseBoundEvaluationForm({
  courseContexts,
  yearLevels,
  publishAction,
}: PublishCourseBoundEvaluationFormProps) {
  const [courseId, setCourseId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("1ST");
  const [term, setTerm] = useState("PRELIM");
  const [activationSchedule, setActivationSchedule] = useState("");
  const [deadline, setDeadline] = useState("");
  const [targetCilos, setTargetCilos] = useState("");
  const [selectedYearLevelIds, setSelectedYearLevelIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

  const fallbackPublishErrorMessage = "Unable to publish evaluation right now. Please try again.";

  const handleYearLevelToggle = (yearLevelId: string, checked: boolean) => {
    setSelectedYearLevelIds((previous) => {
      if (checked) {
        if (previous.includes(yearLevelId)) {
          return previous;
        }

        return [...previous, yearLevelId];
      }

      return previous.filter((id) => id !== yearLevelId);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cilos = targetCilos
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((description) => ({ description }));

    if (!courseId) {
      setError("Please select a course context.");
      return;
    }

    if (!academicYear.trim()) {
      setError("Please provide an academic year.");
      return;
    }

    if (selectedYearLevelIds.length === 0) {
      setError("Please select at least one target year level.");
      return;
    }

    if (cilos.length === 0) {
      setError("Please provide at least one CILO.");
      return;
    }

    const payload: PublishCourseBoundEvaluationInput = {
      academicYear: academicYear.trim(),
      activationAt: activationSchedule ? new Date(activationSchedule) : null,
      cilos,
      courseId,
      deadlineAt: deadline ? new Date(deadline) : null,
      semester,
      term,
      yearLevelIds: selectedYearLevelIds,
    };

    setIsSubmitting(true);
    try {
      const result = await publishAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccessMessage(
        `Evaluation published successfully. ${result.targetCount} target(s), ${result.assignmentCount} assignment(s), status: ${result.status}.`,
      );
    } catch {
      setError(fallbackPublishErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Publish CILO Evaluation</h1>
        <p className="text-sm text-text-muted">
          Set the course context, target year levels, and CILOs for this publication.
        </p>
      </div>

      <form className="space-y-6 rounded-xl border border-border bg-surface p-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="course-context">Course Context</Label>
            <select
              id="course-context"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              <option value="">Select a course context</option>
              {courseContexts.map((context) => (
                <option key={context.courseId} value={context.courseId}>
                  {context.courseCode} - {context.courseTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic-year">Academic Year</Label>
            <Input
              id="academic-year"
              placeholder="e.g. 2026-2027"
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <select
              id="semester"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
            >
              <option value="1ST">1ST</option>
              <option value="2ND">2ND</option>
              <option value="SUMMER">SUMMER</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <select
              id="term"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            >
              <option value="PRELIM">PRELIM</option>
              <option value="MIDTERM">MIDTERM</option>
              <option value="FINALS">FINALS</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activation-schedule">Activation Schedule</Label>
            <Input
              id="activation-schedule"
              type="datetime-local"
              value={activationSchedule}
              onChange={(event) => setActivationSchedule(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>
        </div>

        <fieldset className="space-y-3 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Target Year Levels</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {yearLevels.map((yearLevel) => (
              <label key={yearLevel.id} className="flex items-center gap-2 text-sm" htmlFor={`year-${yearLevel.id}`}>
                <input
                  id={`year-${yearLevel.id}`}
                  type="checkbox"
                  checked={selectedYearLevelIds.includes(yearLevel.id)}
                  onChange={(event) => handleYearLevelToggle(yearLevel.id, event.target.checked)}
                />
                {yearLevel.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="target-cilos">Target CILOs</Label>
          <Textarea
            id="target-cilos"
            placeholder="One CILO per line"
            value={targetCilos}
            onChange={(event) => setTargetCilos(event.target.value)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {successMessage && <p className="text-sm text-success">{successMessage}</p>}

        <Button type="submit" disabled={isSubmitting || courseContexts.length === 0 || yearLevels.length === 0}>
          {isSubmitting ? "Publishing..." : "Publish Evaluation"}
        </Button>
      </form>
    </div>
  );
}
