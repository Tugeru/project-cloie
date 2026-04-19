"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function WizardShell({ title, sections }: any) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const router = useRouter();
  const totalSteps = sections.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentSection = sections[currentStep];

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
          {currentSection.questions.map((q: any) => (
             <div key={q.id} className="p-4 bg-surface rounded-xl border border-border">
                <p className="font-semibold mb-4">{q.text}</p>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(v => (
                    <label key={v} className="flex flex-col items-center gap-1 cursor-pointer group">
                      <input type="radio" name={`q-${q.id}`} value={v} className="sr-only peer" />
                      <div className="size-10 rounded-full border-2 border-border flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white hover:bg-primary-soft hover:border-primary transition-colors">
                        {v}
                      </div>
                    </label>
                  ))}
                </div>
             </div>
          ))}
        </div>
      </div>

      {/* Sticky Wizard Footer */}
      <div className="fixed bottom-0 inset-x-0 lg:left-64 bg-surface border-t border-border p-4 z-30">
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
                console.log("Trigger Review Modal");
                // This will be connected in Task 5
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
    </div>
  );
}
