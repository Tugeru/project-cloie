import { Card } from "@/components/ui/card";
import { FileText, Clock, CheckCircle } from "lucide-react";

export function StatCards({ pending, inProgress, completed }: any) {
  const stats = [
    { label: "Pending", value: pending, sub: "Awaiting submission", color: "text-primary", bg: "bg-primary-soft", icon: FileText },
    { label: "In Progress", value: inProgress, sub: "Drafts saved", color: "text-secondary", bg: "bg-secondary-soft", icon: Clock },
    { label: "Completed", value: completed, sub: "Total submissions", color: "text-success", bg: "bg-success-soft", icon: CheckCircle },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
      {stats.map((s) => (
        <Card key={s.label} className="p-5 border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{s.label}</span>
            <div className={`p-2 ${s.bg} rounded-lg ${s.color}`}>
              <s.icon className="size-5" />
            </div>
          </div>
          <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
          <div className="text-xs text-text-muted font-medium">{s.sub}</div>
        </Card>
      ))}
    </section>
  );
}
