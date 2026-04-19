import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvaluationListCard } from "@/components/student/dashboard/evaluation-list-card";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function StudentEvaluationsPage() {
  const activeEvals = [
    { title: "Post-Term CILO Evaluation Tool", course: "ITE 18 – Capstone 1", program: "BSIT • 4th Year", deadline: "May 20, 2026", progress: 45, status: "IN_PROGRESS" as const },
    { title: "Exit Survey for Graduating Students", course: "Central Deployment", program: "BSIT • 4th Year", deadline: "May 25, 2026", status: "DUE_SOON" as const },
    { title: "Course Feedback - Computer Networks", course: "ITE 12", program: "BSIT • 3rd Year", deadline: "May 30, 2026", status: "NOT_STARTED" as const },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black font-heading">My Evaluations</h1>
          <p className="text-text-muted text-sm">View and manage your assigned evaluation forms.</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-1">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-bold"
            >
              Active <span className="ml-2 bg-primary-soft text-primary px-2 py-0.5 rounded-full text-[10px]">3</span>
            </TabsTrigger>
            <TabsTrigger 
              value="submitted" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-bold"
            >
              Submitted
            </TabsTrigger>
            <TabsTrigger 
              value="closed" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-bold text-text-muted"
            >
              Closed
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-text-muted" />
              <Input placeholder="Search evaluations..." className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="icon-sm" className="shrink-0">
              <Filter className="size-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="active" className="pt-6">
          <div className="grid gap-4">
            {activeEvals.map((evalItem, idx) => (
              <EvaluationListCard key={idx} {...evalItem} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="submitted" className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-text-muted font-medium">Your submitted evaluations will appear here.</p>
          </div>
        </TabsContent>

        <TabsContent value="closed" className="pt-6">
           <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-text-muted font-medium">No closed evaluations found.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
