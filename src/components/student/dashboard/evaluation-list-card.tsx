import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface EvaluationListCardProps {
  id?: string;
  title: string;
  course: string;
  program: string;
  deadline: string;
  progress?: number;
  status: "IN_PROGRESS" | "DUE_SOON" | "NOT_STARTED";
}

export function EvaluationListCard({ 
  id = "mock-id",
  title, 
  course, 
  program, 
  deadline, 
  progress = 0, 
  status 
}: EvaluationListCardProps) {
  const isResuming = status === "IN_PROGRESS";
  
  return (
    <div className="bg-surface p-5 rounded-xl border border-border shadow-sm hover:border-primary/30 transition-colors group">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={status === "DUE_SOON" ? "warning" : "secondary"} className="text-[10px] uppercase">
              {status === "DUE_SOON" ? "Closing Soon" : `Deadline: ${deadline}`}
            </Badge>
          </div>
          <h4 className="text-lg font-bold group-hover:text-primary transition-colors mb-1 line-clamp-2" title={title}>
            {title}
          </h4>
          <p className="text-sm text-text-secondary font-medium truncate">
            {course} • {program}
          </p>
        </div>
        <div className="flex flex-col md:items-end justify-center gap-2 shrink-0">
          {isResuming && (
            <div className="w-full md:w-48 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-text-muted">
                <span className="text-secondary">{progress}% Complete</span>
              </div>
              <Progress 
                value={progress} 
                className="h-1.5" 
                aria-label={`Evaluation progress: ${progress}%`}
              />
            </div>
          )}
          <Button 
            render={<Link href={`/student/evaluations/${id}`} />} 
            className="w-full md:w-auto mt-2 font-bold"
          >
            {isResuming ? "Resume" : "Start Evaluation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
