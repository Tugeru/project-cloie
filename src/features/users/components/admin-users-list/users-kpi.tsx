"use client";

import { Users, GraduationCap, UsersRound, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminUsersKPI } from "../../services/list-admin-users-summary";

interface UsersKPIProps {
  kpi: AdminUsersKPI;
}

export function UsersKPI({ kpi }: UsersKPIProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="motion-safe:transition-shadow motion-safe:duration-200 motion-safe:hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpi.totalUsers}</div>
          <CardDescription className="text-xs">Across all roles</CardDescription>
        </CardContent>
      </Card>

      <Card className="motion-safe:transition-shadow motion-safe:duration-200 motion-safe:hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Students</CardTitle>
          <GraduationCap className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpi.totalStudents}</div>
          <CardDescription className="text-xs">Enrolled learners</CardDescription>
        </CardContent>
      </Card>

      <Card className="motion-safe:transition-shadow motion-safe:duration-200 motion-safe:hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alumni</CardTitle>
          <UsersRound className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpi.totalAlumni}</div>
          <CardDescription className="text-xs">Graduates</CardDescription>
        </CardContent>
      </Card>

      <Card className="motion-safe:transition-shadow motion-safe:duration-200 motion-safe:hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Industry</CardTitle>
          <Briefcase className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpi.totalIndustryPartners}</div>
          <CardDescription className="text-xs">External partners</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
