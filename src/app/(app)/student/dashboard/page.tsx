import { HeroCard } from "@/components/student/dashboard/hero-card";
import { StatCards } from "@/components/student/dashboard/stat-cards";
import { EvaluationListCard } from "@/components/student/dashboard/evaluation-list-card";
import Link from "next/link";
import { ComponentProps } from "react";

type EvaluationItem = ComponentProps<typeof EvaluationListCard>;

export default function StudentDashboardPage() {
  const activeEvals: EvaluationItem[] = [
    { 
      title: "Post-Term CILO Evaluation Tool", 
      course: "ITE 18 – Capstone 1", 
      program: "BSIT • 4th Year", 
      deadline: "May 20, 2026", 
      progress: 45, 
      status: "IN_PROGRESS" 
    },
    { 
      title: "Exit Survey for Graduating Students", 
      course: "Central Deployment", 
      program: "BSIT • 4th Year", 
      deadline: "May 25, 2026", 
      status: "DUE_SOON" 
    },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <HeroCard name="Andy" program="BSIT" year="4th Year" section="Section A" />
      <StatCards pending={3} inProgress={1} completed={12} />
      
      <section className="mt-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-extrabold font-heading">Active Evaluations</h3>
            <p className="text-sm text-text-muted font-medium">Prioritize forms closing soon</p>
          </div>
          <Link href="/student/evaluations" className="text-primary text-sm font-bold hover:underline">View All</Link>
        </div>

        <div className="grid gap-4">
          {activeEvals.map((evalItem, idx) => (
            <EvaluationListCard key={idx} {...evalItem} />
          ))}
        </div>
      </section>
    </div>
  );
}
