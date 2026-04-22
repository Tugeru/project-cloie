"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, CheckCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReviewModal } from "./review-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { buildStudentEvaluationAnswerKey } from "@/features/responses/answer-keys";
import type { StudentEvaluationSection } from "@/features/responses/types";

interface WizardShellProps {
  assignmentId: string;
  title: string;
  courseTitle?: string;
  sections: StudentEvaluationSection[];
  initialAnswers?: Record<string, number | string>;
  onSaveDraft?: (input: {
    assignmentId: string;
    sectionKey: string;
    answers: Record<string, number | string>;
  }) => Promise<{ success: boolean; savedAt?: string; error?: string }>;
  onSubmitResponse?: (input: {
    assignmentId: string;
    answers: Record<string, number | string>;
  }) => Promise<{ success: boolean; responseId?: string; error?: string }>;
}

export function WizardShell({ 
  assignmentId, 
  title, 
  courseTitle,
  sections,
  initialAnswers = {},
  onSaveDraft,
  onSubmitResponse,
}: WizardShellProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number | string>>(initialAnswers);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  
  const router = useRouter();
  const totalSteps = sections.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentSection = sections[currentStep];

  const scrollToTop = () => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleValueChange = (itemKey: string, value: number | string) => {
    const firstItem = currentSection.items.find((item) =>
      item.kind === "quantitative" ? item.itemKey === itemKey : item.promptKey === itemKey,
    );

    if (!firstItem) {
      return;
    }

    const answerKey = buildStudentEvaluationAnswerKey(
      currentSection.id,
      firstItem.kind,
      itemKey,
    );
    setAnswers(prev => ({
      ...prev,
      [answerKey]: value
    }));
    setValidationError(null);
  };

  const validateCurrentSection = () => {
    const requiredItems = currentSection.items.filter(item => item.kind === "quantitative");
    const unanswered = requiredItems.filter(item => {
      const answerKey = buildStudentEvaluationAnswerKey(currentSection.id, "quantitative", item.itemKey);
      return !answers[answerKey];
    });
    
    if (unanswered.length > 0) {
      setValidationError(`Please answer all questions in this section before proceeding (${unanswered.length} remaining).`);
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSaveDraft = React.useCallback(async () => {
    if (!onSaveDraft) return;
    
    setIsSaving(true);
    try {
      const sectionAnswers: Record<string, number | string> = {};
      for (const [key, value] of Object.entries(answers)) {
        if (key.startsWith(`${currentSection.id}:`)) {
          sectionAnswers[key] = value;
        }
      }
      
      const result = await onSaveDraft({
        assignmentId,
        sectionKey: currentSection.id,
        answers: sectionAnswers,
      });
      
      if (result.success) {
        setLastSaved(new Date());
      }
    } finally {
      setIsSaving(false);
    }
  }, [onSaveDraft, assignmentId, currentSection.id, answers]);

  const handleNext = async () => {
    if (validateCurrentSection()) {
      await handleSaveDraft();
      
      if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
        scrollToTop();
      } else {
        setIsReviewOpen(true);
      }
    } else {
      scrollToTop();
    }
  };

  const handlePrevious = () => {
    void handleSaveDraft();
    setCurrentStep(prev => Math.max(0, prev - 1));
    setValidationError(null);
    scrollToTop();
  };

  const handleSubmit = async () => {
    if (!onSubmitResponse) {
      setIsReviewOpen(false);
      setIsSubmitted(true);
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await onSubmitResponse({
        assignmentId,
        answers,
      });
      
      if (result.success) {
        setIsReviewOpen(false);
        setIsSubmitted(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const savedTimeText = lastSaved 
    ? lastSaved.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "Not saved";

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-500">
        <div className="size-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="size-10 text-success" />
        </div>
        <h1 className="text-3xl font-black mb-2 font-heading">Evaluation Submitted!</h1>
        <p className="text-text-secondary max-w-md mb-8">
          Thank you for completing the {title}. Your feedback has been recorded and will help us improve our quality of service.
        </p>
        <Button onClick={() => router.push("/student/dashboard")} className="font-bold px-8">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] relative">
      {/* Sticky Wizard Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pb-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
            <ArrowLeft className="mr-2 size-4" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-wider">
            <Save className="size-3" /> {isSaving ? "Saving..." : savedTimeText}
          </div>
        </div>
        <h1 className="text-xl font-black mb-3 font-heading">{title}</h1>
        {courseTitle && <p className="text-sm text-text-secondary mb-3">{courseTitle}</p>}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase text-text-muted">
            <span>Section {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Section Content */}
      <div className="flex-1 pb-32">
        {validationError && (
          <Alert variant="destructive" className="mb-6 animate-in slide-in-from-top-2">
            <AlertCircle className="size-4" />
            <AlertDescription className="font-medium">{validationError}</AlertDescription>
          </Alert>
        )}

        <h2 className="text-lg font-bold mb-4">{currentSection.name}</h2>
        <p className="text-sm text-text-secondary mb-8">{currentSection.description}</p>
        
        <div className="space-y-8">
          {currentSection.items.map((item) => {
            if (item.kind === "quantitative") {
              const typedAnswerKey = buildStudentEvaluationAnswerKey(currentSection.id, "quantitative", item.itemKey);
              const currentValue = answers[typedAnswerKey];
              
              return (
                <fieldset 
                  key={item.itemKey} 
                  className={cn(
                    "p-4 bg-surface rounded-xl border transition-colors",
                    validationError && !currentValue ? "border-danger bg-danger-soft/30" : "border-border"
                  )}
                >
                  <legend className="font-semibold mb-4 px-1">{item.prompt}</legend>
                  <div role="radiogroup" aria-label={item.prompt} className="flex flex-wrap gap-4 sm:gap-6">
                    {item.scale.map(v => (
                      <label key={v} className="flex flex-col items-center gap-1 cursor-pointer group">
                        <input 
                          type="radio" 
                          name={`q-${item.itemKey}`} 
                          value={v} 
                          checked={currentValue === v}
                          onChange={() => handleValueChange(item.itemKey, v)}
                          className="sr-only peer" 
                        />
                        <div className="size-12 rounded-full border-2 border-border flex items-center justify-center text-lg font-bold peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white hover:bg-primary-soft hover:border-primary transition-all active:scale-90">
                          {v}
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            } else {
              const answerKey = buildStudentEvaluationAnswerKey(currentSection.id, "qualitative", item.promptKey);
              const currentValue = answers[answerKey] as string || "";
              
              return (
                <fieldset 
                  key={item.promptKey} 
                  className="p-4 bg-surface rounded-xl border border-border"
                >
                  <legend className="font-semibold mb-4 px-1">{item.prompt}</legend>
                  <textarea
                    value={currentValue}
                    onChange={(e) => handleValueChange(item.promptKey, e.target.value)}
                    placeholder="Enter your response..."
                    className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </fieldset>
              );
            }
          })}
        </div>
      </div>

      {/* Sticky Wizard Footer */}
      <div className="fixed bottom-0 inset-x-0 lg:left-64 bg-surface/80 backdrop-blur-md border-t border-border p-4 z-[60]">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="font-bold"
          >
            <ArrowLeft className="mr-2 size-4" /> Previous
          </Button>
          
          <div className="hidden sm:flex gap-2">
            <Button variant="ghost" className="text-text-muted font-bold" onClick={handleSaveDraft} disabled={isSaving}>
              <Save className="mr-2 size-4" /> Save Draft
            </Button>
          </div>

          <Button 
            onClick={handleNext}
            className="font-bold min-w-[160px]"
            disabled={isSaving}
          >
            {currentStep === totalSteps - 1 ? (
              <span className="flex items-center">Review & Submit <CheckCircle className="ml-2 size-4" /></span>
            ) : (
              <span className="flex items-center">Next Section <ArrowRight className="ml-2 size-4" /></span>
            )}
          </Button>
        </div>
      </div>

      <ReviewModal 
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
        sections={sections}
        answers={answers}
      />
    </div>
  );
}
