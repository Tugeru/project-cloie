import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, ShieldCheck, Mail, Book } from "lucide-react";

export default function StudentProfilePage() {
  const profile = {
    name: "Andy Student",
    email: "andy.student@acd.edu.ph",
    role: "STUDENT",
    studentId: "2022-0001",
    program: "Bachelor of Science in Information Technology",
    major: "None",
    yearLevel: "4th Year",
    section: "Section A",
    academicYear: "2025-2026",
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black font-heading text-text-primary">Profile</h1>
        <p className="text-text-muted text-sm">Manage your account information and academic classification.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="p-2 bg-primary-soft rounded-lg text-primary">
              <User className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
              <CardDescription>Basic account details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Full Name</label>
              <p className="text-sm font-semibold">{profile.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Email Address</label>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="size-4 text-text-muted" />
                {profile.email}
              </div>
            </div>
            <div className="pt-2">
              <Badge variant="secondary" className="bg-primary-soft text-primary font-bold">
                Role: Student
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Academic Context */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="p-2 bg-secondary-soft rounded-lg text-secondary">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Academic Context</CardTitle>
              <CardDescription>Your current classification</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm font-semibold">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Student ID</label>
                 <p>{profile.studentId}</p>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Year Level</label>
                 <p>{profile.yearLevel}</p>
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Program</label>
               <p className="flex items-center gap-2">
                 <Book className="size-4 text-text-muted" />
                 {profile.program}
               </p>
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Section / Academic Year</label>
               <p>{profile.section} • {profile.academicYear}</p>
             </div>
          </CardContent>
        </Card>

        {/* Permissions & Security */}
        <Card className="md:col-span-2 border-border shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex gap-4 items-start">
               <div className="p-2 bg-primary-soft rounded-lg text-primary shrink-0">
                 <ShieldCheck className="size-5" />
               </div>
               <div className="space-y-2">
                 <h3 className="font-bold text-text-primary">Data Privacy & Responses</h3>
                 <p className="text-sm text-text-secondary leading-relaxed">
                   Your evaluation responses are handled confidentially and are only reported in aggregated form. 
                   Once an evaluation is finalized and submitted, it cannot be modified to ensure the integrity of the results.
                 </p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
