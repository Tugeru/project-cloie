import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { listStudentCourseBoundEvaluations } from "@/features/responses/services/list-student-course-bound-evaluations";
import Link from "next/link";

export default async function StudentHistoryPage() {
  const { submitted } = await listStudentCourseBoundEvaluations();

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black font-heading">Submission History</h1>
        <p className="text-text-muted text-sm">A permanent record of all your completed evaluation forms.</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-surface rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-surface-muted/50">
            <TableRow>
              <TableHead className="font-bold text-[10px] uppercase tracking-wider">Evaluation Form</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-wider">Submission Date</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submitted.map((sub) => (
              <TableRow key={sub.evaluationId} className="hover:bg-surface-muted/30 transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-text-primary">{sub.evaluationTitle}</span>
                    <span className="text-xs text-text-muted">{sub.courseTitle}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {sub.session.submittedAt ? formatDate(sub.session.submittedAt) : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-green-100 text-green-800 border-green-200">Submitted</Badge>
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

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {submitted.map((sub) => (
          <Card key={sub.evaluationId} className="border-border shadow-sm active:scale-[0.98] transition-transform">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-text-primary leading-tight mb-1">{sub.evaluationTitle}</h3>
                  <p className="text-xs text-text-muted font-medium">{sub.courseTitle}</p>
                </div>
                <Badge variant="secondary" className="text-[9px] uppercase font-bold shrink-0 bg-green-100 text-green-800 border-green-200">Submitted</Badge>
              </div>

              <div className="py-3 border-y border-border/50">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-text-muted" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-tighter">Date</span>
                    <span className="text-xs font-bold">
                      {sub.session.submittedAt ? formatDate(sub.session.submittedAt) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 font-bold gap-2 text-xs"
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
        <div className="py-12 text-center bg-surface rounded-xl border border-dashed border-border">
          <FileText className="size-12 text-text-muted/20 mx-auto mb-4" />
          <p className="text-text-muted font-medium">No submissions recorded yet.</p>
        </div>
      )}
    </div>
  );
}
