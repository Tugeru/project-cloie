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
import { FileText, Eye, Download } from "lucide-react";

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

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-surface-muted/50">
            <TableRow>
              <TableHead className="font-bold">Evaluation Form</TableHead>
              <TableHead className="font-bold">Submission Date</TableHead>
              <TableHead className="font-bold">Receipt ID</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
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
                <TableCell className="text-sm">{sub.date}</TableCell>
                <TableCell className="text-xs font-mono text-text-muted">{sub.id}</TableCell>
                <TableCell>
                  <Badge variant="success" className="text-[10px] uppercase">Submitted</Badge>
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
        
        {submissions.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="size-12 text-text-muted/20 mx-auto mb-4" />
            <p className="text-text-muted font-medium">No submissions recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
