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
import { FileText, Eye, Download, Calendar, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentHistoryPage() {
  const submissions = [
    { id: "SUB-12345", title: "Mid-Term CILO Evaluation", course: "ITE 18", date: "Jan 15, 2026", status: "SUBMITTED" },
    { id: "SUB-12344", title: "Faculty Performance Review", course: "ITE 18", date: "Jan 14, 2026", status: "SUBMITTED" },
    { id: "SUB-12340", title: "Course Feedback", course: "ITE 12", date: "Dec 20, 2025", status: "SUBMITTED" },
  ];

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
              <TableHead className="font-bold text-[10px] uppercase tracking-wider">Receipt ID</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((sub) => (
              <TableRow key={sub.id} className="hover:bg-surface-muted/30 transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-text-primary">{sub.title}</span>
                    <span className="text-xs text-text-muted">{sub.course}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">{sub.date}</TableCell>
                <TableCell className="text-xs font-mono text-text-muted">{sub.id}</TableCell>
                <TableCell>
                  <Badge variant="success" className="text-[10px] uppercase font-bold">Submitted</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon-sm" title="View Answers">
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Download Receipt">
                      <Download className="size-4" />
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
        {submissions.map((sub) => (
          <Card key={sub.id} className="border-border shadow-sm active:scale-[0.98] transition-transform">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-text-primary leading-tight mb-1">{sub.title}</h3>
                  <p className="text-xs text-text-muted font-medium">{sub.course}</p>
                </div>
                <Badge variant="success" className="text-[9px] uppercase font-bold shrink-0">Submitted</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-text-muted" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-tighter">Date</span>
                    <span className="text-xs font-bold">{sub.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="size-3.5 text-text-muted" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-tighter">Receipt</span>
                    <span className="text-xs font-mono text-text-muted truncate">{sub.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 font-bold gap-2 text-xs">
                  <Eye className="size-3.5" /> View
                </Button>
                <Button variant="outline" size="sm" className="flex-1 font-bold gap-2 text-xs">
                  <Download className="size-3.5" /> Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className="py-12 text-center bg-surface rounded-xl border border-dashed border-border">
          <FileText className="size-12 text-text-muted/20 mx-auto mb-4" />
          <p className="text-text-muted font-medium">No submissions recorded yet.</p>
        </div>
      )}
    </div>
  );
}
