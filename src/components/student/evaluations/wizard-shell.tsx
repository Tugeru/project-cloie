"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, CheckCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReviewModal } from "./review-modal";

interface Question {
  id: number;
  text: string;
}

interface Section {
  name: string;
  description: string;
  questions: Question[];
}

interface WizardShellProps {
  title: string;
  sections: Section[];
}

export function WizardShell({ title, sections }: WizardShellProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const router = useRouter();
  const totalSteps = sections.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentSection = sections[currentStep];

  const handleValueChange = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    setIsReviewOpen(false);
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
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
            <Save className="size-3" /> Draft Saved 2m ago
          </div>
        </div>
        <h1 className="text-xl font-black mb-3 font-heading">{title}</h1>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase text-text-muted">
            <span>Section {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Section Content */}
      <div className="flex-1 pb-24">
        <h2 className="text-lg font-bold mb-4">{currentSection.name}</h2>
        <p className="text-sm text-text-secondary mb-8">{currentSection.description}</p>
        
        <div className="space-y-8">
          {currentSection.questions.map((q) => (
             <fieldset key={q.id} className="p-4 bg-surface rounded-xl border border-border">
                <legend className="font-semibold mb-4 px-1">{q.text}</legend>
                <div role="radiogroup" aria-label={q.text} className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(v => (
                    <label key={v} className="flex flex-col items-center gap-1 cursor-pointer group">
                      <input 
                        type="radio" 
                        name={`q-${q.id}`} 
                        value={v} 
                        checked={answers[q.id] === v}
                        onChange={() => handleValueChange(q.id, v)}
                        className="sr-only peer" 
                        aria-label={`Rate ${v} out of 5`}
                      />
                      <div className="size-10 rounded-full border-2 border-border flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white hover:bg-primary-soft hover:border-primary transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                        {v}
                      </div>
                    </label>
                  ))}
                </div>
             </fieldset>
          ))}
        </div>
      </div>

      {/* Sticky Wizard Footer */}
      <div className="fixed bottom-0 inset-x-0 lg:left-64 bg-surface border-t border-border p-4 z-[60] shadow-lg">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => {
              setCurrentStep(prev => Math.max(0, prev - 1));
              window.scrollTo(0, 0);
            }}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 size-4" /> Previous
          </Button>
          
          <div className="hidden sm:flex gap-2">
            <Button variant="ghost">Save Draft</Button>
          </div>

          <Button 
            onClick={() => {
              if (currentStep < totalSteps - 1) {
                setCurrentStep(prev => prev + 1);
                window.scrollTo(0, 0);
              } else {
                setIsReviewOpen(true);
              }
            }}
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
        sections={sections}
        answers={answers}
      />
    </div>
  );
}
