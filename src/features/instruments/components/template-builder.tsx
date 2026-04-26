"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/toast";
import type {
  FacultyCourseContext,
  FacultyManagedCiloContext,
  FacultyManagedCiloLoadResult,
} from "@/features/evaluations/types";
import type {
  TemplateStructure,
  TemplateSection,
  TemplateQuestion,
  QuestionType,
  LikertDescriptor,
  EvaluationTemplateType,
  TemplateCiloQuestionBinding,
} from "../types";
import { DEFAULT_LIKERT_5_DESCRIPTORS, listTemplateLikertQuestions } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

const EMPTY_FACULTY_COURSE_CONTEXTS: FacultyCourseContext[] = [];

type FacultyBuilderConfig = {
  courseContexts: FacultyCourseContext[];
  initialBindings: TemplateCiloQuestionBinding[];
  loadManagedCilosAction: (
    payload: FacultyManagedCiloContext
  ) => Promise<FacultyManagedCiloLoadResult>;
  validatePublishReadinessAction: (templateId: string) => Promise<ActionResult<{ id: string }>>;
};

interface TemplateBuilderProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    template_type: EvaluationTemplateType;
    is_active: boolean;
    is_faculty_accessible: boolean;
    bound_course_id?: string | null;
    bound_program_id?: string | null;
    bound_major_id?: string | null;
    structure: TemplateStructure;
  };
  facultyConfig?: FacultyBuilderConfig;
  onSave: (data: FormData) => Promise<ActionResult<{ id: string }>>;
  programLabel: string;
  saveSuccessConfig?: {
    redirectTo: string;
    toastMessage: string;
  };
  toolsHref?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createSection(order: number): TemplateSection {
  return {
    key: crypto.randomUUID(),
    title: "",
    description: undefined,
    order,
    questions: [createQuestion(0)],
  };
}

function createQuestion(order: number): TemplateQuestion {
  return {
    key: crypto.randomUUID(),
    prompt: "",
    type: "likert",
    order,
    required: true,
    likertDescriptors: [...DEFAULT_LIKERT_5_DESCRIPTORS],
  };
}

function hasDuplicateSuggestedResponse(existingResponses: string[] | undefined, response: string) {
  const normalizedResponse = response.trim();

  if (!normalizedResponse) {
    return false;
  }

  return (existingResponses ?? []).some(
    (existingResponse) => existingResponse.trim() === normalizedResponse
  );
}

function formatProgramContextLabel(program: { code: string; name: string }) {
  return `${program.code} - ${program.name}`;
}

function formatCourseContextLabel(
  context: Pick<FacultyCourseContext, "courseCode" | "courseTitle" | "scopeLabel">
) {
  return `${context.courseCode} - ${context.courseTitle} (${context.scopeLabel})`;
}

function formatCiloOptionLabel(cilo: { description: string }, index: number) {
  return `CILO ${index + 1}: ${cilo.description}`;
}

function formatTemplateTypeLabel(type: EvaluationTemplateType): string {
  return type === "COURSE_BOUND" ? "Course-bound" : "Program-wide";
}

function formatQuestionTypeLabel(type: QuestionType): string {
  return type === "likert" ? "Likert" : "Guided Open-Ended";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TemplateBuilder({
  facultyConfig,
  initialData,
  onSave,
  programLabel,
  saveSuccessConfig,
  toolsHref = "/program-head/tools",
}: TemplateBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const templateId = initialData?.id;

  // Template metadata state
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [templateType, setTemplateType] = useState<EvaluationTemplateType>(
    initialData?.template_type ?? "PROGRAM_WIDE"
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [isFacultyAccessible, setIsFacultyAccessible] = useState(
    initialData?.is_faculty_accessible ?? false
  );

  // Structure state
  const [sections, setSections] = useState<TemplateStructure>(
    initialData?.structure?.length ? initialData.structure : [createSection(0)]
  );
  const [boundProgramId, setBoundProgramId] = useState(initialData?.bound_program_id ?? "");
  const [boundMajorId, setBoundMajorId] = useState(initialData?.bound_major_id ?? "");
  const [boundCourseId, setBoundCourseId] = useState(initialData?.bound_course_id ?? "");
  const [ciloQuestionBindings, setCiloQuestionBindings] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (facultyConfig?.initialBindings ?? []).map((binding) => [
        `${binding.sectionKey}:${binding.itemKey}`,
        binding.ciloId,
      ])
    )
  );
  const [loadedCilos, setLoadedCilos] = useState<Array<{ description: string; id: string }>>([]);
  const [isLoadingCilos, setIsLoadingCilos] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const facultyMode = Boolean(facultyConfig);
  const effectiveTemplateType: EvaluationTemplateType = facultyMode ? "COURSE_BOUND" : templateType;
  const facultyCourseContexts = facultyConfig?.courseContexts ?? EMPTY_FACULTY_COURSE_CONTEXTS;
  const loadManagedCilosAction = facultyConfig?.loadManagedCilosAction;
  const availablePrograms = useMemo(
    () => [
      ...new Map(
        facultyCourseContexts.map((context) => [
          context.programId,
          {
            code: context.programCode,
            id: context.programId,
            name: context.programName,
          },
        ])
      ).values(),
    ],
    [facultyCourseContexts]
  );
  const availableMajors = useMemo(
    () => [
      ...new Map(
        facultyCourseContexts
          .filter((context) => context.programId === boundProgramId && context.majorId)
          .map((context) => [
            context.majorId,
            { id: context.majorId!, name: context.majorName ?? "Unnamed Major" },
          ])
      ).values(),
    ],
    [boundProgramId, facultyCourseContexts]
  );
  const selectedCourseContext =
    facultyCourseContexts.find((context) => context.courseId === boundCourseId) ?? null;
  const selectedCourseType =
    selectedCourseContext?.courseType ??
    facultyCourseContexts.find((context) => context.programId === boundProgramId)?.courseType ??
    "PROGRAM_SPECIFIC";
  const [courseType, setCourseType] =
    useState<FacultyCourseContext["courseType"]>(selectedCourseType);
  const availableCourses = useMemo(
    () =>
      facultyCourseContexts.filter((context) => {
        if (context.courseType !== courseType) {
          return false;
        }

        if (boundProgramId && context.programId !== boundProgramId) {
          return false;
        }

        if (courseType === "MAJOR_SPECIFIC") {
          return Boolean(boundMajorId) && context.majorId === boundMajorId;
        }

        if (boundMajorId) {
          return context.majorId === null || context.majorId === boundMajorId;
        }

        return true;
      }),
    [boundMajorId, boundProgramId, courseType, facultyCourseContexts]
  );
  const selectedProgram = useMemo(
    () => availablePrograms.find((program) => program.id === boundProgramId) ?? null,
    [availablePrograms, boundProgramId]
  );
  const selectedMajor = useMemo(
    () => availableMajors.find((major) => major.id === boundMajorId) ?? null,
    [availableMajors, boundMajorId]
  );
  const selectedCourse = useMemo(
    () => availableCourses.find((context) => context.courseId === boundCourseId) ?? null,
    [availableCourses, boundCourseId]
  );
  const selectedCiloLabels = useMemo(() => {
    const labels = new Map<string, string>();

    loadedCilos.forEach((cilo, index) => {
      labels.set(cilo.id, formatCiloOptionLabel(cilo, index));
    });

    for (const binding of facultyConfig?.initialBindings ?? []) {
      if (!binding.ciloId || labels.has(binding.ciloId) || !binding.ciloDescriptionSnapshot) {
        continue;
      }

      labels.set(binding.ciloId, binding.ciloDescriptionSnapshot);
    }

    return labels;
  }, [facultyConfig?.initialBindings, loadedCilos]);
  const likertQuestions = useMemo(() => listTemplateLikertQuestions(sections), [sections]);
  const selectedCiloIds = useMemo(
    () => new Set(Object.values(ciloQuestionBindings).filter(Boolean)),
    [ciloQuestionBindings]
  );

  useEffect(() => {
    if (!facultyMode) {
      return;
    }

    if (!boundCourseId || !boundProgramId) {
      setLoadedCilos((current) => (current.length === 0 ? current : []));
      setIsLoadingCilos(false);
      return;
    }

    const context = facultyCourseContexts.find(
      (candidate) =>
        candidate.courseId === boundCourseId &&
        candidate.programId === boundProgramId &&
        candidate.majorId === (boundMajorId || null)
    );

    if (!context) {
      setLoadedCilos((current) => (current.length === 0 ? current : []));
      setIsLoadingCilos(false);
      return;
    }

    if (!loadManagedCilosAction) {
      return;
    }

    let isStale = false;
    setIsLoadingCilos(true);

    loadManagedCilosAction({
      courseId: context.courseId,
      majorId: context.majorId,
      programId: context.programId,
    })
      .then((result) => {
        if (isStale) {
          return;
        }

        if (!result.success) {
          setLoadedCilos([]);
          showToast(result.error, "error");
          return;
        }

        setLoadedCilos(result.items);
      })
      .catch(() => {
        if (!isStale) {
          setLoadedCilos([]);
          showToast("Unable to load saved CILOs.", "error");
        }
      })
      .finally(() => {
        if (!isStale) {
          setIsLoadingCilos(false);
        }
      });

    return () => {
      isStale = true;
    };
  }, [
    boundCourseId,
    boundMajorId,
    boundProgramId,
    facultyMode,
    facultyCourseContexts,
    loadManagedCilosAction,
  ]);

  // ─── Section Operations ──────────────────────────────────────────────

  const addSection = useCallback((insertIndex?: number) => {
    setSections((prev) => {
      const idx = insertIndex ?? prev.length;
      const newSection = createSection(idx);
      const updated = [...prev.slice(0, idx), newSection, ...prev.slice(idx)];
      return updated.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const removeSection = useCallback((key: string) => {
    setSections((prev) => {
      const filtered = prev.filter((s) => s.key !== key);
      return filtered.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const updateSection = useCallback(
    (key: string, updates: Partial<Pick<TemplateSection, "title" | "description">>) => {
      setSections((prev) => prev.map((s) => (s.key === key ? { ...s, ...updates } : s)));
    },
    []
  );

  // ─── Question Operations ─────────────────────────────────────────────

  const addQuestion = useCallback((sectionKey: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.key !== sectionKey) return s;
        const newQuestion = createQuestion(s.questions.length);
        return { ...s, questions: [...s.questions, newQuestion] };
      })
    );
  }, []);

  const removeQuestion = useCallback((sectionKey: string, questionKey: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.key !== sectionKey) return s;
        const filtered = s.questions.filter((q) => q.key !== questionKey);
        return {
          ...s,
          questions: filtered.map((q, i) => ({ ...q, order: i })),
        };
      })
    );
  }, []);

  const updateQuestion = useCallback(
    (sectionKey: string, questionKey: string, updates: Partial<TemplateQuestion>) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.key !== sectionKey) return s;
          return {
            ...s,
            questions: s.questions.map((q) => (q.key === questionKey ? { ...q, ...updates } : q)),
          };
        })
      );
    },
    []
  );

  const changeQuestionType = useCallback(
    (sectionKey: string, questionKey: string, newType: QuestionType) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.key !== sectionKey) return s;
          return {
            ...s,
            questions: s.questions.map((q) => {
              if (q.key !== questionKey) return q;
              if (newType === "likert") {
                return {
                  ...q,
                  type: newType,
                  likertDescriptors: [...DEFAULT_LIKERT_5_DESCRIPTORS],
                  suggestedResponses: undefined,
                };
              }
              return {
                ...q,
                type: newType,
                likertDescriptors: undefined,
                suggestedResponses: [],
              };
            }),
          };
        })
      );
    },
    []
  );

  // ─── Likert Descriptor Operations ────────────────────────────────────

  const updateLikertDescriptor = useCallback(
    (sectionKey: string, questionKey: string, index: number, label: string) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.key !== sectionKey) return s;
          return {
            ...s,
            questions: s.questions.map((q) => {
              if (q.key !== questionKey || !q.likertDescriptors) return q;
              const updated = [...q.likertDescriptors];
              updated[index] = { ...updated[index], label };
              return { ...q, likertDescriptors: updated };
            }),
          };
        })
      );
    },
    []
  );

  // ─── Suggested Response Operations ───────────────────────────────────

  const addSuggestedResponse = useCallback(
    (sectionKey: string, questionKey: string, response: string) => {
      const normalizedResponse = response.trim();

      if (!normalizedResponse) return;

      let hasDuplicate = false;

      setSections((prev) =>
        prev.map((s) => {
          if (s.key !== sectionKey) return s;
          return {
            ...s,
            questions: s.questions.map((q) => {
              if (q.key !== questionKey) return q;

              if (hasDuplicateSuggestedResponse(q.suggestedResponses, normalizedResponse)) {
                hasDuplicate = true;
                return q;
              }

              return {
                ...q,
                suggestedResponses: [...(q.suggestedResponses ?? []), normalizedResponse],
              };
            }),
          };
        })
      );

      if (hasDuplicate) {
        setError("Predefined responses must be unique within a question.");
        setSuccessMessage(null);
        return;
      }

      setError(null);
    },
    []
  );

  const removeSuggestedResponse = useCallback(
    (sectionKey: string, questionKey: string, index: number) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.key !== sectionKey) return s;
          return {
            ...s,
            questions: s.questions.map((q) => {
              if (q.key !== questionKey) return q;
              const updated = [...(q.suggestedResponses ?? [])];
              updated.splice(index, 1);
              return { ...q, suggestedResponses: updated };
            }),
          };
        })
      );
    },
    []
  );

  // ─── Save Handler ────────────────────────────────────────────────────

  const buildFormData = useCallback(() => {
    const formData = new FormData();

    if (templateId) {
      formData.set("id", templateId);
    }

    formData.set("name", name);
    formData.set("description", description);
    formData.set("template_type", effectiveTemplateType);
    formData.set(
      "is_faculty_accessible",
      effectiveTemplateType === "COURSE_BOUND" && isFacultyAccessible ? "true" : "false"
    );
    formData.set("structure", JSON.stringify(sections));

    if (facultyMode) {
      formData.set("bound_course_id", boundCourseId);
      formData.set("bound_major_id", boundMajorId);
      formData.set("bound_program_id", boundProgramId);
      formData.set(
        "cilo_question_bindings",
        JSON.stringify(
          Object.entries(ciloQuestionBindings)
            .filter(([, ciloId]) => ciloId)
            .map(([questionKey, ciloId]) => {
              const [sectionKey, itemKey] = questionKey.split(":");
              return { ciloId, itemKey, sectionKey };
            })
        )
      );
    }

    return formData;
  }, [
    boundCourseId,
    boundMajorId,
    boundProgramId,
    ciloQuestionBindings,
    description,
    effectiveTemplateType,
    facultyMode,
    isFacultyAccessible,
    name,
    sections,
    templateId,
    templateType,
  ]);

  const saveDraft = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);

    const result = await onSave(buildFormData());

    if (!result.success) {
      setError(result.error);
      showToast(result.error, "error");
      return null;
    }

    return result.data?.id ?? templateId ?? null;
  }, [buildFormData, onSave, templateId]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const savedId = await saveDraft();

      if (!savedId) {
        return;
      }

      if (saveSuccessConfig) {
        router.push(
          `${saveSuccessConfig.redirectTo}?toast=${encodeURIComponent(saveSuccessConfig.toastMessage)}`
        );
        return;
      }

      setSuccessMessage("Template saved successfully.");
      if (!templateId) {
        router.push(toolsHref);
      }
    });
  }, [router, saveDraft, saveSuccessConfig, templateId, toolsHref]);

  const handlePublish = useCallback(() => {
    if (!facultyConfig) {
      return;
    }

    startTransition(async () => {
      const savedId = await saveDraft();

      if (!savedId) {
        return;
      }

      const result = await facultyConfig.validatePublishReadinessAction(savedId);

      if (!result.success) {
        showToast(result.error, "error");
        setError(result.error);
        return;
      }

      router.push(`/faculty/cilo-evaluations/new?templateId=${savedId}`);
    });
  }, [facultyConfig, router, saveDraft]);

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="font-label text-text-secondary text-xs font-semibold tracking-[0.05em] uppercase">
          {programLabel}
        </p>
        <h1 className="font-headline text-heading-lg">
          {initialData?.id ? "Edit Template" : "New Template"}
        </h1>
      </div>

      {/* Error / Success Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Template Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Template Settings</CardTitle>
          <CardDescription>
            Define the identity and governance state of this template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g. Industry Partners Evaluation Tool"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">
              Template Description <span className="text-text-secondary">(optional)</span>
            </Label>
            <Textarea
              id="template-description"
              rows={3}
              placeholder="Describe the purpose and scope of this evaluation tool."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-type">Template Type</Label>
            <Select
              value={effectiveTemplateType}
              disabled={facultyMode}
              onValueChange={(value) => {
                if (facultyMode) {
                  return;
                }

                const nextType = value as EvaluationTemplateType;
                setTemplateType(nextType);
                if (nextType !== "COURSE_BOUND") {
                  setIsFacultyAccessible(false);
                }
              }}
            >
              <SelectTrigger id="template-type">
                <SelectValue>{formatTemplateTypeLabel(effectiveTemplateType)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COURSE_BOUND">Course-bound Evaluation Tool</SelectItem>
                {!facultyMode && (
                  <SelectItem value="PROGRAM_WIDE">Program-wide Evaluation Tool</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-3">
              <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="is-active" className="cursor-pointer">
                Active
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is-faculty-accessible"
                checked={isFacultyAccessible}
                disabled={templateType !== "COURSE_BOUND"}
                onCheckedChange={setIsFacultyAccessible}
              />
              <Label htmlFor="is-faculty-accessible" className="cursor-pointer">
                Faculty Access
              </Label>
            </div>
          </div>
          {effectiveTemplateType !== "COURSE_BOUND" && (
            <p className="text-text-secondary text-xs">
              Faculty access is available only for course-bound templates.
            </p>
          )}
          {facultyMode && (
            <div className="border-border grid gap-4 rounded-lg border p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="faculty-course-type">Course Type</Label>
                <Select
                  value={courseType}
                  onValueChange={(value) => {
                    setCourseType(value as FacultyCourseContext["courseType"]);
                    setBoundCourseId("");
                    setCiloQuestionBindings({});
                  }}
                >
                  <SelectTrigger id="faculty-course-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROGRAM_SPECIFIC">Program-Specific</SelectItem>
                    <SelectItem value="GENERAL_EDUCATION">General Education</SelectItem>
                    {availableMajors.length > 0 && (
                      <SelectItem value="MAJOR_SPECIFIC">Major-Specific</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty-program-context">Program Context</Label>
                <Select
                  value={boundProgramId}
                  onValueChange={(value) => {
                    setBoundProgramId(value ?? "");
                    setBoundMajorId("");
                    setBoundCourseId("");
                    setCiloQuestionBindings({});
                  }}
                >
                  <SelectTrigger id="faculty-program-context">
                    <SelectValue placeholder="Select a program">
                      {selectedProgram ? formatProgramContextLabel(selectedProgram) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {formatProgramContextLabel(program)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {availableMajors.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="faculty-major-context">Major Context</Label>
                  <Select
                    value={boundMajorId || "none"}
                    onValueChange={(value) => {
                      setBoundMajorId(!value || value === "none" ? "" : value);
                      setBoundCourseId("");
                      setCiloQuestionBindings({});
                    }}
                  >
                    <SelectTrigger id="faculty-major-context">
                      <SelectValue>
                        {selectedMajor?.name ?? "All majors / shared courses"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All majors / shared courses</SelectItem>
                      {availableMajors.map((major) => (
                        <SelectItem key={major.id} value={major.id}>
                          {major.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="faculty-course-context">Course</Label>
                <Select
                  value={boundCourseId}
                  onValueChange={(value) => {
                    const context = facultyCourseContexts.find(
                      (candidate) => candidate.courseId === value
                    );
                    setBoundCourseId(value ?? "");
                    setBoundProgramId(context?.programId ?? boundProgramId);
                    setBoundMajorId(context?.majorId ?? "");
                    setCiloQuestionBindings({});
                  }}
                >
                  <SelectTrigger id="faculty-course-context">
                    <SelectValue placeholder="Select a course">
                      {selectedCourse ? formatCourseContextLabel(selectedCourse) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((context) => (
                      <SelectItem
                        key={`${context.programId}-${context.courseId}-${context.majorId ?? "shared"}`}
                        value={context.courseId}
                      >
                        {formatCourseContextLabel(context)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-text-secondary text-xs">
                  {isLoadingCilos
                    ? "Loading saved CILOs..."
                    : loadedCilos.length > 0
                      ? `${loadedCilos.length} saved CILO(s) available for binding.`
                      : "Select a course with saved CILOs before publishing."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Section Button (top) */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => addSection(0)}
          className="text-primary hover:bg-primary/5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
          Add Section
        </button>
      </div>

      {/* Section Cards */}
      {sections.map((section, sectionIndex) => (
        <SectionCard
          key={section.key}
          section={section}
          sectionIndex={sectionIndex}
          onUpdateSection={updateSection}
          onRemoveSection={removeSection}
          onAddQuestion={addQuestion}
          onRemoveQuestion={removeQuestion}
          onUpdateQuestion={updateQuestion}
          onChangeQuestionType={changeQuestionType}
          onUpdateLikertDescriptor={updateLikertDescriptor}
          onAddSuggestedResponse={addSuggestedResponse}
          onRemoveSuggestedResponse={removeSuggestedResponse}
          ciloOptions={loadedCilos}
          ciloQuestionBindings={ciloQuestionBindings}
          selectedCiloLabels={selectedCiloLabels}
          facultyMode={facultyMode}
          onCiloBindingChange={(questionKey, ciloId) =>
            setCiloQuestionBindings((current) => ({
              ...current,
              [questionKey]: ciloId,
            }))
          }
          selectedCiloIds={selectedCiloIds}
          canRemove={sections.length > 1}
        />
      ))}

      {/* Add Section Button (bottom) */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => addSection()}
          className="text-primary hover:bg-primary/5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
          Add Section
        </button>
      </div>

      {/* Save Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.push(toolsHref)} disabled={isPending}>
          Cancel
        </Button>
        {facultyMode && (
          <Button variant="secondary" onClick={handlePublish} disabled={isPending}>
            Publish
          </Button>
        )}
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save Template"}
        </Button>
      </div>
    </div>
  );
}

// ─── Section Card Sub-component ──────────────────────────────────────────────

interface SectionCardProps {
  ciloOptions: Array<{ description: string; id: string }>;
  ciloQuestionBindings: Record<string, string>;
  selectedCiloLabels: Map<string, string>;
  section: TemplateSection;
  sectionIndex: number;
  facultyMode: boolean;
  onUpdateSection: (
    key: string,
    updates: Partial<Pick<TemplateSection, "title" | "description">>
  ) => void;
  onRemoveSection: (key: string) => void;
  onAddQuestion: (sectionKey: string) => void;
  onRemoveQuestion: (sectionKey: string, questionKey: string) => void;
  onUpdateQuestion: (
    sectionKey: string,
    questionKey: string,
    updates: Partial<TemplateQuestion>
  ) => void;
  onChangeQuestionType: (sectionKey: string, questionKey: string, type: QuestionType) => void;
  onUpdateLikertDescriptor: (
    sectionKey: string,
    questionKey: string,
    index: number,
    label: string
  ) => void;
  onAddSuggestedResponse: (sectionKey: string, questionKey: string, response: string) => void;
  onCiloBindingChange: (questionKey: string, ciloId: string) => void;
  onRemoveSuggestedResponse: (sectionKey: string, questionKey: string, index: number) => void;
  selectedCiloIds: Set<string>;
  canRemove: boolean;
}

function SectionCard({
  ciloOptions,
  ciloQuestionBindings,
  selectedCiloLabels,
  section,
  sectionIndex,
  facultyMode,
  onUpdateSection,
  onRemoveSection,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onChangeQuestionType,
  onUpdateLikertDescriptor,
  onAddSuggestedResponse,
  onCiloBindingChange,
  onRemoveSuggestedResponse,
  selectedCiloIds,
  canRemove,
}: SectionCardProps) {
  return (
    <Card className="relative overflow-visible">
      {/* Left accent bar */}
      <div className="bg-primary absolute top-8 -left-3 h-12 w-1 rounded-r" />

      <CardContent className="space-y-6 pt-6">
        {/* Section Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <input
              type="text"
              className="placeholder:text-text-secondary/50 hover:border-border focus:border-primary w-full border-0 border-b border-transparent bg-transparent py-1 text-lg font-semibold transition-colors focus:outline-none"
              placeholder={`Section ${sectionIndex + 1} title`}
              value={section.title}
              onChange={(e) => onUpdateSection(section.key, { title: e.target.value })}
            />
            <Textarea
              rows={2}
              placeholder="Section description (optional)"
              className="resize-none text-sm"
              value={section.description ?? ""}
              onChange={(e) =>
                onUpdateSection(section.key, {
                  description: e.target.value || undefined,
                })
              }
            />
          </div>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemoveSection(section.key)}
              className="text-text-secondary mt-1 rounded-md p-1.5 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Remove section"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Questions */}
        <div className="bg-surface-container-low space-y-4 rounded-xl p-4">
          {section.questions.map((question, questionIndex) => (
            <QuestionCard
              key={question.key}
              sectionKey={section.key}
              question={question}
              questionIndex={questionIndex}
              onUpdate={onUpdateQuestion}
              onRemove={onRemoveQuestion}
              onChangeType={onChangeQuestionType}
              onUpdateLikertDescriptor={onUpdateLikertDescriptor}
              onAddSuggestedResponse={onAddSuggestedResponse}
              onRemoveSuggestedResponse={onRemoveSuggestedResponse}
              ciloOptions={ciloOptions}
              facultyMode={facultyMode}
              onCiloBindingChange={onCiloBindingChange}
              selectedCiloLabel={selectedCiloLabels.get(
                ciloQuestionBindings[`${section.key}:${question.key}`] ?? ""
              )}
              selectedCiloIds={selectedCiloIds}
              selectedCiloId={ciloQuestionBindings[`${section.key}:${question.key}`] ?? ""}
              canRemove={section.questions.length > 1}
            />
          ))}

          {/* Add Question Button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => onAddQuestion(section.key)}
              className="text-primary hover:bg-primary/5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
              Add Question
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Question Card Sub-component ─────────────────────────────────────────────

interface QuestionCardProps {
  ciloOptions: Array<{ description: string; id: string }>;
  sectionKey: string;
  question: TemplateQuestion;
  questionIndex: number;
  facultyMode: boolean;
  onUpdate: (sectionKey: string, questionKey: string, updates: Partial<TemplateQuestion>) => void;
  onRemove: (sectionKey: string, questionKey: string) => void;
  onChangeType: (sectionKey: string, questionKey: string, type: QuestionType) => void;
  onUpdateLikertDescriptor: (
    sectionKey: string,
    questionKey: string,
    index: number,
    label: string
  ) => void;
  onAddSuggestedResponse: (sectionKey: string, questionKey: string, response: string) => void;
  onCiloBindingChange: (questionKey: string, ciloId: string) => void;
  onRemoveSuggestedResponse: (sectionKey: string, questionKey: string, index: number) => void;
  selectedCiloLabel?: string;
  selectedCiloId: string;
  selectedCiloIds: Set<string>;
  canRemove: boolean;
}

function QuestionCard({
  ciloOptions,
  sectionKey,
  question,
  questionIndex,
  facultyMode,
  onUpdate,
  onRemove,
  onChangeType,
  onUpdateLikertDescriptor,
  onAddSuggestedResponse,
  onCiloBindingChange,
  onRemoveSuggestedResponse,
  selectedCiloLabel,
  selectedCiloId,
  selectedCiloIds,
  canRemove,
}: QuestionCardProps) {
  const [newResponse, setNewResponse] = useState("");

  return (
    <div className="group border-border bg-surface-container-lowest space-y-4 rounded-lg border p-4">
      {/* Question Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-label text-primary text-xs font-semibold tracking-[0.05em] uppercase">
          Question {questionIndex + 1}
        </p>
        <Select
          value={question.type}
          onValueChange={(value) => onChangeType(sectionKey, question.key, value as QuestionType)}
        >
          <SelectTrigger className="w-48">
            <SelectValue>{formatQuestionTypeLabel(question.type)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="likert">Likert</SelectItem>
            <SelectItem value="guided_open_ended">Guided Open-Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <Label className="text-sm">Question title</Label>
        <Input
          placeholder="Enter question"
          value={question.prompt}
          onChange={(e) => onUpdate(sectionKey, question.key, { prompt: e.target.value })}
        />
      </div>

      {/* Type-specific UI */}
      {question.type === "likert" && question.likertDescriptors && (
        <>
          <LikertDescriptorsEditor
            descriptors={question.likertDescriptors}
            sectionKey={sectionKey}
            questionKey={question.key}
            onUpdate={onUpdateLikertDescriptor}
          />
          {facultyMode && (
            <div className="space-y-2">
              <Label htmlFor={`cilo-binding-${question.key}`} className="text-sm">
                CILO Binding
              </Label>
              <Select
                value={selectedCiloId || "none"}
                onValueChange={(value) =>
                  onCiloBindingChange(
                    `${sectionKey}:${question.key}`,
                    !value || value === "none" ? "" : value
                  )
                }
              >
                <SelectTrigger id={`cilo-binding-${question.key}`}>
                  <SelectValue placeholder="Select a CILO">
                    {selectedCiloId ? selectedCiloLabel : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No CILO assigned</SelectItem>
                  {ciloOptions.map((cilo, index) => {
                    const usedByAnotherQuestion =
                      selectedCiloIds.has(cilo.id) && selectedCiloId !== cilo.id;

                    return (
                      <SelectItem key={cilo.id} value={cilo.id} disabled={usedByAnotherQuestion}>
                        {formatCiloOptionLabel(cilo, index)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {question.type === "guided_open_ended" && (
        <div className="space-y-3">
          <Label className="text-sm">Predefined Responses</Label>

          {/* Existing responses */}
          {question.suggestedResponses && question.suggestedResponses.length > 0 && (
            <div className="space-y-2">
              {question.suggestedResponses.map((resp, idx) => (
                <div
                  key={idx}
                  className="border-border bg-surface flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="flex-1">{resp}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSuggestedResponse(sectionKey, question.key, idx)}
                    className="text-text-secondary shrink-0 rounded p-0.5 transition-colors hover:text-red-500"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add response input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a predefined response…"
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddSuggestedResponse(sectionKey, question.key, newResponse);
                  setNewResponse("");
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onAddSuggestedResponse(sectionKey, question.key, newResponse);
                setNewResponse("");
              }}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Hover-reveal footer */}
      <div className="border-border/50 flex items-center justify-between border-t pt-3">
        <div>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(sectionKey, question.key)}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor={`required-${question.key}`}
            className="text-text-secondary cursor-pointer text-xs"
          >
            Required
          </Label>
          <Switch
            id={`required-${question.key}`}
            checked={question.required}
            onCheckedChange={(checked) => onUpdate(sectionKey, question.key, { required: checked })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Likert Descriptors Editor ───────────────────────────────────────────────

interface LikertDescriptorsEditorProps {
  descriptors: LikertDescriptor[];
  sectionKey: string;
  questionKey: string;
  onUpdate: (sectionKey: string, questionKey: string, index: number, label: string) => void;
}

function LikertDescriptorsEditor({
  descriptors,
  sectionKey,
  questionKey,
  onUpdate,
}: LikertDescriptorsEditorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm">Scale Descriptors</Label>
      <div className="flex items-end gap-2">
        {descriptors.map((descriptor, idx) => (
          <div key={descriptor.value} className="flex-1 space-y-2 text-center">
            {/* Radio circle visual */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Connecting line */}
                {idx < descriptors.length - 1 && (
                  <div className="bg-border absolute top-1/2 left-full h-px w-full" />
                )}
                <div className="border-primary/40 bg-surface h-5 w-5 rounded-full border-2" />
              </div>
            </div>
            {/* Editable label */}
            <input
              type="text"
              className="text-text-secondary hover:border-border focus:border-primary w-full border-0 border-b border-transparent bg-transparent text-center text-xs transition-colors focus:outline-none"
              value={descriptor.label}
              onChange={(e) => onUpdate(sectionKey, questionKey, idx, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
