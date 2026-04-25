"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  TemplateStructure,
  TemplateSection,
  TemplateQuestion,
  QuestionType,
  LikertDescriptor,
} from "../types";
import { DEFAULT_LIKERT_5_DESCRIPTORS } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActionResult = { success: true } | { success: false; error: string };

interface TemplateBuilderProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    is_active: boolean;
    is_faculty_accessible: boolean;
    structure: TemplateStructure;
  };
  onSave: (data: FormData) => Promise<ActionResult>;
  programLabel: string;
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

// ─── Component ───────────────────────────────────────────────────────────────

export function TemplateBuilder({
  initialData,
  onSave,
  programLabel,
}: TemplateBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Template metadata state
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [isFacultyAccessible, setIsFacultyAccessible] = useState(
    initialData?.is_faculty_accessible ?? false,
  );

  // Structure state
  const [sections, setSections] = useState<TemplateStructure>(
    initialData?.structure?.length
      ? initialData.structure
      : [createSection(0)],
  );

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ─── Section Operations ──────────────────────────────────────────────

  const addSection = useCallback((insertIndex?: number) => {
    setSections((prev) => {
      const idx = insertIndex ?? prev.length;
      const newSection = createSection(idx);
      const updated = [
        ...prev.slice(0, idx),
        newSection,
        ...prev.slice(idx),
      ];
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
      setSections((prev) =>
        prev.map((s) => (s.key === key ? { ...s, ...updates } : s)),
      );
    },
    [],
  );

  // ─── Question Operations ─────────────────────────────────────────────

  const addQuestion = useCallback((sectionKey: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.key !== sectionKey) return s;
        const newQuestion = createQuestion(s.questions.length);
        return { ...s, questions: [...s.questions, newQuestion] };
      }),
    );
  }, []);

  const removeQuestion = useCallback(
    (sectionKey: string, questionKey: string) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.key !== sectionKey) return s;
          const filtered = s.questions.filter((q) => q.key !== questionKey);
          return {
            ...s,
            questions: filtered.map((q, i) => ({ ...q, order: i })),
          };
        }),
      );
    },
    [],
  );

  const updateQuestion = useCallback(
    (
      sectionKey: string,
      questionKey: string,
      updates: Partial<TemplateQuestion>,
    ) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.key !== sectionKey) return s;
          return {
            ...s,
            questions: s.questions.map((q) =>
              q.key === questionKey ? { ...q, ...updates } : q,
            ),
          };
        }),
      );
    },
    [],
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
        }),
      );
    },
    [],
  );

  // ─── Likert Descriptor Operations ────────────────────────────────────

  const updateLikertDescriptor = useCallback(
    (
      sectionKey: string,
      questionKey: string,
      index: number,
      label: string,
    ) => {
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
        }),
      );
    },
    [],
  );

  // ─── Suggested Response Operations ───────────────────────────────────

  const addSuggestedResponse = useCallback(
    (sectionKey: string, questionKey: string, response: string) => {
      if (!response.trim()) return;
      setSections((prev) =>
        prev.map((s) => {
          if (s.key !== sectionKey) return s;
          return {
            ...s,
            questions: s.questions.map((q) => {
              if (q.key !== questionKey) return q;
              return {
                ...q,
                suggestedResponses: [
                  ...(q.suggestedResponses ?? []),
                  response.trim(),
                ],
              };
            }),
          };
        }),
      );
    },
    [],
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
        }),
      );
    },
    [],
  );

  // ─── Save Handler ────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const formData = new FormData();

      if (initialData?.id) {
        formData.set("id", initialData.id);
      }

      formData.set("name", name);
      formData.set("description", description);
      formData.set(
        "is_faculty_accessible",
        isFacultyAccessible ? "true" : "false",
      );
      formData.set("structure", JSON.stringify(sections));

      const result = await onSave(formData);

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccessMessage("Template saved successfully.");
        if (!initialData?.id) {
          router.push("/program-head/tools");
        }
      }
    });
  }, [
    name,
    description,
    isFacultyAccessible,
    sections,
    initialData?.id,
    onSave,
    router,
  ]);

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-label font-semibold tracking-[0.05em] uppercase text-text-secondary">
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
              Template Description{" "}
              <span className="text-text-secondary">(optional)</span>
            </Label>
            <Textarea
              id="template-description"
              rows={3}
              placeholder="Describe the purpose and scope of this evaluation tool."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-3">
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is-active" className="cursor-pointer">
                Active
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is-faculty-accessible"
                checked={isFacultyAccessible}
                onCheckedChange={setIsFacultyAccessible}
              />
              <Label
                htmlFor="is-faculty-accessible"
                className="cursor-pointer"
              >
                Faculty Access
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Section Button (top) */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => addSection(0)}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
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
          canRemove={sections.length > 1}
        />
      ))}

      {/* Add Section Button (bottom) */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => addSection()}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
          Add Section
        </button>
      </div>

      {/* Save Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/program-head/tools")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save Template"}
        </Button>
      </div>
    </div>
  );
}

// ─── Section Card Sub-component ──────────────────────────────────────────────

interface SectionCardProps {
  section: TemplateSection;
  sectionIndex: number;
  onUpdateSection: (
    key: string,
    updates: Partial<Pick<TemplateSection, "title" | "description">>,
  ) => void;
  onRemoveSection: (key: string) => void;
  onAddQuestion: (sectionKey: string) => void;
  onRemoveQuestion: (sectionKey: string, questionKey: string) => void;
  onUpdateQuestion: (
    sectionKey: string,
    questionKey: string,
    updates: Partial<TemplateQuestion>,
  ) => void;
  onChangeQuestionType: (
    sectionKey: string,
    questionKey: string,
    type: QuestionType,
  ) => void;
  onUpdateLikertDescriptor: (
    sectionKey: string,
    questionKey: string,
    index: number,
    label: string,
  ) => void;
  onAddSuggestedResponse: (
    sectionKey: string,
    questionKey: string,
    response: string,
  ) => void;
  onRemoveSuggestedResponse: (
    sectionKey: string,
    questionKey: string,
    index: number,
  ) => void;
  canRemove: boolean;
}

function SectionCard({
  section,
  sectionIndex,
  onUpdateSection,
  onRemoveSection,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onChangeQuestionType,
  onUpdateLikertDescriptor,
  onAddSuggestedResponse,
  onRemoveSuggestedResponse,
  canRemove,
}: SectionCardProps) {
  return (
    <Card className="relative overflow-visible">
      {/* Left accent bar */}
      <div className="absolute -left-3 top-8 w-1 h-12 bg-primary rounded-r" />

      <CardContent className="space-y-6 pt-6">
        {/* Section Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <input
              type="text"
              className="w-full bg-transparent text-lg font-semibold placeholder:text-text-secondary/50 border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors py-1"
              placeholder={`Section ${sectionIndex + 1} title`}
              value={section.title}
              onChange={(e) =>
                onUpdateSection(section.key, { title: e.target.value })
              }
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
              className="mt-1 rounded-md p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove section"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
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
              canRemove={section.questions.length > 1}
            />
          ))}

          {/* Add Question Button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => onAddQuestion(section.key)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
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
  sectionKey: string;
  question: TemplateQuestion;
  questionIndex: number;
  onUpdate: (
    sectionKey: string,
    questionKey: string,
    updates: Partial<TemplateQuestion>,
  ) => void;
  onRemove: (sectionKey: string, questionKey: string) => void;
  onChangeType: (
    sectionKey: string,
    questionKey: string,
    type: QuestionType,
  ) => void;
  onUpdateLikertDescriptor: (
    sectionKey: string,
    questionKey: string,
    index: number,
    label: string,
  ) => void;
  onAddSuggestedResponse: (
    sectionKey: string,
    questionKey: string,
    response: string,
  ) => void;
  onRemoveSuggestedResponse: (
    sectionKey: string,
    questionKey: string,
    index: number,
  ) => void;
  canRemove: boolean;
}

function QuestionCard({
  sectionKey,
  question,
  questionIndex,
  onUpdate,
  onRemove,
  onChangeType,
  onUpdateLikertDescriptor,
  onAddSuggestedResponse,
  onRemoveSuggestedResponse,
  canRemove,
}: QuestionCardProps) {
  const [newResponse, setNewResponse] = useState("");

  return (
    <div className="group space-y-4 rounded-lg border border-border bg-surface-container-lowest p-4">
      {/* Question Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-label font-semibold tracking-[0.05em] uppercase text-primary">
          Question {questionIndex + 1}
        </p>
        <Select
          value={question.type}
          onValueChange={(value) =>
            onChangeType(sectionKey, question.key, value as QuestionType)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="likert">Likert Scale</SelectItem>
            <SelectItem value="guided_open_ended">
              Guided Open-Ended
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <Label className="text-sm">Question title</Label>
        <Input
          placeholder="Enter question"
          value={question.prompt}
          onChange={(e) =>
            onUpdate(sectionKey, question.key, { prompt: e.target.value })
          }
        />
      </div>

      {/* Type-specific UI */}
      {question.type === "likert" && question.likertDescriptors && (
        <LikertDescriptorsEditor
          descriptors={question.likertDescriptors}
          sectionKey={sectionKey}
          questionKey={question.key}
          onUpdate={onUpdateLikertDescriptor}
        />
      )}

      {question.type === "guided_open_ended" && (
        <div className="space-y-3">
          <Label className="text-sm">Predefined Responses</Label>

          {/* Existing responses */}
          {question.suggestedResponses &&
            question.suggestedResponses.length > 0 && (
              <div className="space-y-2">
                {question.suggestedResponses.map((resp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <span className="flex-1">{resp}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onRemoveSuggestedResponse(
                          sectionKey,
                          question.key,
                          idx,
                        )
                      }
                      className="shrink-0 rounded p-0.5 text-text-secondary hover:text-red-500 transition-colors"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
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
                  onAddSuggestedResponse(
                    sectionKey,
                    question.key,
                    newResponse,
                  );
                  setNewResponse("");
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onAddSuggestedResponse(
                  sectionKey,
                  question.key,
                  newResponse,
                );
                setNewResponse("");
              }}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Hover-reveal footer */}
      <div className="flex items-center justify-between border-t border-border/50 pt-3">
        <div>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(sectionKey, question.key)}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
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
            className="text-xs text-text-secondary cursor-pointer"
          >
            Required
          </Label>
          <Switch
            id={`required-${question.key}`}
            checked={question.required}
            onCheckedChange={(checked) =>
              onUpdate(sectionKey, question.key, { required: checked })
            }
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
  onUpdate: (
    sectionKey: string,
    questionKey: string,
    index: number,
    label: string,
  ) => void;
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
                  <div className="absolute top-1/2 left-full h-px w-full bg-border" />
                )}
                <div className="h-5 w-5 rounded-full border-2 border-primary/40 bg-surface" />
              </div>
            </div>
            {/* Editable label */}
            <input
              type="text"
              className="w-full bg-transparent text-center text-xs text-text-secondary border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
              value={descriptor.label}
              onChange={(e) =>
                onUpdate(sectionKey, questionKey, idx, e.target.value)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
