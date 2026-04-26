import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/features/auth/components/google-signin-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, GraduationCap, Users } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 zoom-in-95 relative z-10 mx-auto w-full max-w-md duration-500">
      {/* Header Section */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2563eb]/20 to-[#d49900]/20 blur-xl" />
          <Image
            src="/logos/cloie-logo.png"
            alt="CLOIE Logo"
            width={80}
            height={80}
            className="relative rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
            priority
          />
        </div>
        <h1 className="text-display-md font-bold tracking-tight text-[#2563eb]">
          CLOIE
        </h1>
        <p className="mt-2 text-center text-[#64748b]">
          Comprehensive Learning Outcomes
          <br />
          and Instructional Evaluation
        </p>
        <p className="mt-1 text-sm font-medium text-[#2563eb]">
          Assumption College of Davao
        </p>
      </div>

      {/* Error Alerts */}
      {error === "invalid_domain" && (
        <Alert
          variant="destructive"
          className="mb-6 animate-in slide-in-from-top-2 border-red-500/20 bg-red-50/80 backdrop-blur-sm duration-300"
        >
          <AlertCircle className="size-5 shrink-0 text-red-500" />
          <div className="ml-3">
            <AlertTitle className="text-red-700">Access Restricted</AlertTitle>
            <AlertDescription className="text-red-600/90">
              Please use your official{" "}
              <span className="font-semibold">@acd.edu.ph</span> or{" "}
              <span className="font-semibold">@acdeducation.com</span> email.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {error === "auth-failure" && (
        <Alert
          variant="destructive"
          className="mb-6 animate-in slide-in-from-top-2 border-red-500/20 bg-red-50/80 backdrop-blur-sm duration-300"
        >
          <AlertCircle className="size-5 shrink-0 text-red-500" />
          <div className="ml-3">
            <AlertTitle className="text-red-700">Authentication Failed</AlertTitle>
            <AlertDescription className="text-red-600/90">
              There was a problem signing you in. Please try again.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Main Card */}
      <Card className="overflow-hidden border border-[#e2e8f0]/60 bg-white/95 shadow-xl backdrop-blur-sm transition-shadow duration-300 hover:shadow-2xl">
        <CardHeader className="space-y-3 pb-6 pt-8 text-center">
          <CardTitle className="text-heading-lg font-bold text-[#0f172a]">
            Welcome Back! 
          </CardTitle>
          <CardDescription className="mx-auto max-w-[280px] text-body-md text-[#64748b]">
            Sign in with your institutional Google account to access your dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {/* Faculty/Staff Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#334155]">
              <Users className="size-4 text-[#2563eb]" />
              <span></span>
            </div>
            <GoogleSignInButton />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#e2e8f0]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
                or
              </span>
            </div>
          </div>

          {/* Student Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#334155]">
              <GraduationCap className="size-4 text-[#d49900]" />
              <span>New Students</span>
            </div>
            <GoogleSignInButton intent="student" />
          </div>

          {/* Footer Links */}
          <div className="pt-4 text-center">
            <p className="text-caption text-[#94a3b8]">
              By signing in, you agree to our{" "}
              <a href="#" className="underline-offset-2 transition-colors hover:text-[#2563eb] hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="underline-offset-2 transition-colors hover:text-[#2563eb] hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Help Link */}
      <p className="mt-6 text-center text-sm text-[#64748b]">
        Need help?{" "}
        <a
          href="mailto:support@acdeducation.com"
          className="font-medium text-[#2563eb] underline-offset-2 transition-colors hover:text-[#1d4ed8] hover:underline"
        >
          Contact IT Support
        </a>
      </p>
    </div>
  );
}
