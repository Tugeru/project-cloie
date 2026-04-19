import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Question {
  id: number;
  text: string;
}

interface Section {
  name: string;
  description: string;
  questions: Question[];
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  sections: Section[];
  answers: Record<number, number>;
  isSubmitting?: boolean;
}

export function ReviewModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  sections, 
  answers,
  isSubmitting = false 
}: ReviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle className="text-xl font-black font-heading flex items-center gap-2">
            <CheckCircle2 className="text-success size-5" />
            Review Your Answers
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-8">
            {sections.map((s, idx) => (
              <div key={idx}>
                <h3 className="font-bold text-primary mb-4 uppercase text-[10px] tracking-widest">{s.name}</h3>
                <div className="space-y-4">
                  {s.questions.map((q) => (
                    <div key={q.id} className="flex justify-between items-start gap-4 py-3 border-b border-border/50">
                      <span className="text-sm text-text-secondary">{q.text}</span>
                      <span className="font-black text-primary px-3 py-1 bg-primary-soft rounded-md shrink-0">
                        {answers[q.id] || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3">
             <AlertCircle className="size-5 text-amber-600 shrink-0" />
             <p className="text-xs text-amber-800 font-medium leading-relaxed">
               Please review your answers carefully. By clicking submit, your responses will be finalized and locked. You cannot edit them after this step.
             </p>
          </div>
        </div>

        <DialogFooter className="p-6 border-t shrink-0 gap-3 sm:gap-0 bg-surface">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="font-bold">Go Back</Button>
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-hover font-bold px-8 min-w-[140px]"
          >
            {isSubmitting ? "Submitting..." : "Confirm & Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
