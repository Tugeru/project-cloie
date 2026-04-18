"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { customZodResolver } from "@/lib/forms/zod-resolver";
import { studentProfileSchema, type StudentProfileInput } from "@/lib/schemas/student-profile";
import { registerStudentProfile } from "@/lib/actions/onboarding-actions";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Program = {
  id: string;
  name: string;
  code: string;
  majors: { id: string; name: string }[];
};

type YearLevel = {
  id: string;
  name: string;
  order: number;
};

type StudentProfileFormProps = {
  email: string;
  initialFirstName: string;
  initialLastName: string;
  programs: Program[];
  yearLevels: YearLevel[];
};

export function StudentProfileForm({
  email,
  initialFirstName,
  initialLastName,
  programs,
  yearLevels,
}: StudentProfileFormProps) {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentProfileInput>({
    resolver: customZodResolver(studentProfileSchema),
    defaultValues: {
      first_name: initialFirstName,
      last_name: initialLastName,
      program_id: "",
      major_id: "",
      year_level_id: "",
      student_id_number: "",
    },
  });

  const selectedProgramId = watch("program_id");
  const selectedProgramObj = programs.find((p) => p.id === selectedProgramId);
  const requiresMajor = selectedProgramObj?.majors && selectedProgramObj.majors.length > 0;

  const onSubmit = async (data: StudentProfileInput) => {
    setGlobalError(null);
    const result = await registerStudentProfile(data);

    if (result.error) {
      setGlobalError(result.error);
    } else if (result.success) {
      // Navigate cleanly to the protected dashboard
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <Card className="border-border shadow-card overflow-hidden">
      <div className="h-2 w-full bg-gradient-to-r from-brand-600 to-brand-400" />
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-display-sm text-text-primary">Complete Student Profile</CardTitle>
        <CardDescription className="text-body-md text-text-secondary">
          Please verify your academic details to provision your evaluation dashboard.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {globalError && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{globalError}</AlertDescription>
            </Alert>
          )}

          {/* Read Only Institutional Lock */}
          <div className="space-y-2">
            <Label>Institutional Email Address</Label>
            <Input 
              value={email} 
              disabled 
              readOnly 
              className="bg-surface/50 text-text-muted cursor-not-allowed border-border/80" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input 
                id="first_name" 
                {...register("first_name")} 
                className={errors.first_name ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input 
                id="last_name" 
                {...register("last_name")} 
                className={errors.last_name ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="program_id">Program of Study</Label>
            <Controller
              name="program_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={errors.program_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your program..." />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.code} - {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.program_id && <p className="text-xs text-red-500 mt-1">{errors.program_id.message}</p>}
          </div>

          {requiresMajor && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="major_id">Major / Specialization</Label>
              <Controller
                name="major_id"
                control={control}
                rules={{ required: requiresMajor ? "A major is required for this program" : false }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger className={errors.major_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select your major..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProgramObj.majors.map((major) => (
                        <SelectItem key={major.id} value={major.id}>
                          {major.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.major_id && <p className="text-xs text-red-500 mt-1">{errors.major_id.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student_id_number">Student Number</Label>
              <Input 
                id="student_id_number" 
                placeholder="e.g. 21-12345"
                {...register("student_id_number")} 
                className={errors.student_id_number ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.student_id_number && <p className="text-xs text-red-500 mt-1">{errors.student_id_number.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year_level_id">Year Level</Label>
              <Controller
                name="year_level_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.year_level_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select year level..." />
                    </SelectTrigger>
                    <SelectContent>
                      {yearLevels.map((yl) => (
                        <SelectItem key={yl.id} value={yl.id}>
                          {yl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.year_level_id && <p className="text-xs text-red-500 mt-1">{errors.year_level_id.message}</p>}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3 bg-surface/30 pt-6">
          <Button 
            type="submit" 
            className="w-full font-semibold shadow-md active:scale-[0.98] transition-transform" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Finalizing Registration..." : "Complete Registration"}
          </Button>
          
          <Button 
            type="button"
            variant="ghost" 
            className="w-full text-text-muted hover:text-text-primary hover:bg-border/30 border border-transparent hover:border-border/50 transition-colors"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/login");
            }}
          >
            Cancel & Return to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
