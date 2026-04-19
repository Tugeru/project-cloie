import { HeroCard } from "@/components/student/dashboard/hero-card";
import { StatCards } from "@/components/student/dashboard/stat-cards";

export default function StudentDashboardPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <HeroCard 
        name="Andy" 
        program="BSIT" 
        year="4th Year" 
        section="Section A" 
      />
      <StatCards 
        pending={3} 
        inProgress={1} 
        completed={12} 
      />
    </div>
  );
}
