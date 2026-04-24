import {
  Book,
  GraduationCap,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { prisma } from "@/lib/db/prisma";

export default async function StudentProfilePage() {
  const session = await resolveAuthSession();

  const profile = session
    ? await prisma.studentAcademicProfile.findUnique({
        where: { user_id: session.userId },
        include: {
          major: true,
          program: true,
          user: true,
          year_level: true,
        },
      })
    : null;

  const fullName = profile
    ? `${profile.user.first_name} ${profile.user.last_name}`
    : "Student";

  return (
    <div className="max-w-4xl animate-in space-y-8 fade-in duration-500">
      <div>
        <h1 className="font-heading text-2xl font-black text-text-primary">Profile</h1>
        <p className="text-sm text-text-muted">
          Review your account information and academic classification.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="rounded-lg bg-primary-soft p-2 text-primary">
              <User className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
              <CardDescription>Basic account details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Full Name
              </label>
              <p className="text-sm font-semibold">{fullName}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Email Address
              </label>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="size-4 text-text-muted" />
                {profile?.user.email ?? "No email available"}
              </div>
            </div>
            <div className="pt-2">
              <Badge variant="secondary" className="bg-primary-soft font-bold text-primary">
                Role: Student
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="rounded-lg bg-secondary-soft p-2 text-secondary">
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
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Student ID
                </label>
                <p>{profile?.student_id_number ?? "Not set"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Year Level
                </label>
                <p>{profile?.year_level.name ?? "Not set"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Program
              </label>
              <p className="flex items-center gap-2">
                <Book className="size-4 text-text-muted" />
                {profile?.program.name ?? "Not set"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Major
                </label>
                <p>{profile?.major?.name ?? "Program-wide"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Academic Year
                </label>
                <p>{profile?.academic_year ?? "Not set"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Graduating Eligibility
              </label>
              <p>{profile?.is_graduating ? "Eligible" : "Not currently flagged"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border border-l-4 border-l-primary shadow-sm md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-lg bg-primary-soft p-2 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-text-primary">Data Privacy & Responses</h3>
                <p className="leading-relaxed text-sm text-text-secondary">
                  Your evaluation responses are handled confidentially and are reported
                  only in aggregated form. Once an evaluation is finalized and
                  submitted, it cannot be modified to protect the integrity of results.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
