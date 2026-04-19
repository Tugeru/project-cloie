import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function EvaluationListCard({ title, course, program, deadline, progress, status }: any) {
  const isResuming = status === "IN_PROGRESS";
  
  return (
    <div className="bg-surface p-5 rounded-xl border border-border shadow-sm hover:border-primary/30 transition-colors group">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={status === "DUE_SOON" ? "warning" : "secondary"} className="text-[10px] uppercase">
              {status === "DUE_SOON" ? "Closing Soon" : `Deadline: ${deadline}`}
            </Badge>
          </div>
          <h4 className="text-lg font-bold group-hover:text-primary transition-colors mb-1">{title}</h4>
          <p className="text-sm text-text-secondary font-medium">{course} • {program}</p>
        </div>
        <div className="flex flex-col md:items-end justify-center gap-2">
          {isResuming && (
            <>
              <div className="text-xs font-bold text-text-muted">
                <span className="text-secondary">{progress}% Complete</span>
              </div>
              <Progress value={progress} className="w-full md:w-48 h-1.5" />
            </>
          )}
          <Button asChild className="w-full md:w-auto mt-2">
            <Link href={`/student/evaluations/mock-id`}>
              {isResuming ? "Resume" : "Start Evaluation"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
