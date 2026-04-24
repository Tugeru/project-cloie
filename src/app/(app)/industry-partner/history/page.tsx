import Link from "next/link";
import { Calendar, Eye, FileText } from "lucide-react";
import { TargetStakeholder } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listStakeholderEvaluations } from "@/features/responses/services/list-stakeholder-evaluations";

export default async function IndustryPartnerHistoryPage() {
  const { submitted } = await listStakeholderEvaluations(
    TargetStakeholder.INDUSTRY_PARTNER,
    "/industry-partner",
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-heading text-2xl font-black">Submission History</h1>
        <p className="text-sm text-text-muted">
          A permanent record of all your completed evaluation forms.
        </p>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
        <Table>
          <TableHeader className="bg-surface-muted/50">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                Evaluation Form
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                Submission Date
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submitted.map((sub) => (
              <TableRow
                key={sub.assignmentId}
                className="transition-colors hover:bg-surface-muted/30"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-text-primary">
                      {sub.evaluationTitle}
                    </span>
                    <span className="text-xs text-text-muted">
                      {sub.programLabel}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {sub.session.submittedAt ? formatDate(sub.session.submittedAt) : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge className="border-green-200 bg-green-100 text-[10px] font-bold uppercase text-green-800">
                    Submitted
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="View Answers"
                      disabled={!sub.href}
                      render={sub.href ? <Link href={sub.href} /> : undefined}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:hidden">
        {submitted.map((sub) => (
          <Card
            key={sub.assignmentId}
            className="border-border shadow-sm transition-transform active:scale-[0.98]"
          >
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="mb-1 leading-tight text-text-primary font-bold">
                    {sub.evaluationTitle}
                  </h3>
                  <p className="text-xs font-medium text-text-muted">
                    {sub.programLabel}
                  </p>
                </div>
                <Badge className="shrink-0 border-green-200 bg-green-100 text-[9px] font-bold uppercase text-green-800">
                  Submitted
                </Badge>
              </div>

              <div className="border-y border-border/50 py-3">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-text-muted" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-text-muted">
                      Date
                    </span>
                    <span className="text-xs font-bold">
                      {sub.session.submittedAt
                        ? formatDate(sub.session.submittedAt)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 text-xs font-bold"
                  disabled={!sub.href}
                  render={sub.href ? <Link href={sub.href} /> : undefined}
                >
                  <Eye className="size-3.5" /> View Answers
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {submitted.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface py-12 text-center">
          <FileText className="mx-auto mb-4 size-12 text-text-muted/20" />
          <p className="font-medium text-text-muted">No submissions recorded yet.</p>
        </div>
      )}
    </div>
  );
}
