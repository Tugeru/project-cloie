import { Building2, Mail, ShieldCheck, User } from "lucide-react";
import { redirect } from "next/navigation";
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

export default async function DeanProfilePage() {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      first_name: true,
      last_name: true,
      email: true,
    },
  });

  const fullName = user
    ? `${user.first_name} ${user.last_name}`
    : "College Dean";

  return (
    <div className="max-w-4xl animate-in space-y-8 fade-in duration-500">
      <div>
        <h1 className="font-heading text-2xl font-black text-text-primary">Profile</h1>
        <p className="text-sm text-text-muted">
          Review your account information and institutional role.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
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
                {user?.email ?? "No email available"}
              </div>
            </div>
            <div className="pt-2">
              <Badge variant="secondary" className="bg-primary-soft font-bold text-primary">
                Role: College Dean
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Institutional Scope */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="rounded-lg bg-secondary-soft p-2 text-secondary">
              <Building2 className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Institutional Scope</CardTitle>
              <CardDescription>Your oversight and governance context</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm font-semibold">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Scope
              </label>
              <p className="flex items-center gap-2">
                <Building2 className="size-4 text-text-muted" />
                College-Wide
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Access Level
              </label>
              <p>All programs and academic outcomes</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Privacy Notice */}
        <Card className="border-border border-l-4 border-l-primary shadow-sm md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-lg bg-primary-soft p-2 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-text-primary">Data Privacy & Responses</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Evaluation responses are handled confidentially and are reported
                  only in aggregated form. As College Dean, you have access to
                  cross-program analytics and reporting while individual responses
                  remain anonymized.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
