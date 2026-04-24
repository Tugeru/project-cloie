import { Filter, Search } from "lucide-react";
import { TargetStakeholder } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listStakeholderEvaluations } from "@/features/responses/services/list-stakeholder-evaluations";
import { EvaluationListCard } from "@/features/users/components/evaluation-list-card";

export default async function IndustryPartnerEvaluationsPage() {
  const { active, submitted } = await listStakeholderEvaluations(
    TargetStakeholder.INDUSTRY_PARTNER,
    "/industry-partner",
  );
  const pending = active.filter((item) => item.status !== "IN_PROGRESS");
  const inProgress = active.filter((item) => item.status === "IN_PROGRESS");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="rounded-xl bg-surface-container-low p-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-text-primary">
          Industry Partner Evaluations
        </h1>
        <p className="mt-2 max-w-2xl text-base text-text-secondary">
          View and complete evaluations assigned to you as an industry partner.
          Complete all forms before their deadlines.
        </p>
      </section>

      <Tabs defaultValue="pending" className="w-full">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
            <TabsTrigger
              value="pending"
              className="rounded-full bg-surface px-5 py-2 text-sm font-medium text-text-secondary data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="rounded-full bg-surface px-5 py-2 text-sm font-medium text-text-secondary data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              In Progress
            </TabsTrigger>
            <TabsTrigger
              value="submitted"
              className="rounded-full bg-surface px-5 py-2 text-sm font-medium text-text-secondary data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Submitted
            </TabsTrigger>
          </TabsList>

          <div className="flex w-full gap-4 md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-text-muted" />
              <Input placeholder="Search evaluations..." className="h-10 pl-9" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              Filter
            </Button>
          </div>
        </div>

        <TabsContent value="pending" className="pt-6">
          <div className="grid gap-4">
            {pending.map((evalItem) => (
              <EvaluationListCard key={evalItem.assignmentId} {...evalItem} />
            ))}
            {pending.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                <p className="font-medium text-text-muted">
                  No pending evaluations found.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="pt-6">
          <div className="grid gap-4">
            {inProgress.map((evalItem) => (
              <EvaluationListCard key={evalItem.assignmentId} {...evalItem} />
            ))}
            {inProgress.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                <p className="font-medium text-text-muted">
                  Your in-progress evaluations will appear here.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="submitted" className="pt-6">
          <div className="grid gap-4">
            {submitted.map((evalItem) => (
              <EvaluationListCard key={evalItem.assignmentId} {...evalItem} />
            ))}
            {submitted.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                <p className="font-medium text-text-muted">
                  Your submitted evaluations will appear here.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
