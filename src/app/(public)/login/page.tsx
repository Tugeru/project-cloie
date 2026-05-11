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
    <div className="relative z-10 mx-auto w-full max-w-md">
      {/* Header Section */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-5 flex items-center gap-4">
          <Image
            src="/logos/acd-logo.png"
            alt="Assumption College of Davao Logo"
            width={56}
            height={56}
            className="shrink-0 object-contain"
          />
          <Image
            src="/logos/cloie-logo.png"
            alt="CLOIE Logo"
            width={56}
            height={56}
            className="shrink-0 object-contain"
            priority
          />
        </div>
        <h1 className="text-display-md font-bold tracking-tight text-primary">System CLOIE</h1>
        <p className="mt-2 text-center text-text-secondary">
          System for Comprehensive Learning Outcomes
          <br />
          and Instructional Evaluation
        </p>
        <p className="mt-1 text-label-md text-primary">Assumption College of Davao</p>
      </div>

      {/* Error Alerts */}
      {error === "invalid_domain" && (
        <Alert
          variant="destructive"
          className="mb-6 border-danger/20 bg-danger-soft"
        >
          <AlertCircle className="size-5 shrink-0 text-danger" />
          <div className="ml-3">
            <AlertTitle className="text-danger">Access Restricted</AlertTitle>
            <AlertDescription className="text-danger/90">
              Please use your official <span className="font-semibold">@acd.edu.ph</span> or{" "}
              <span className="font-semibold">@acdeducation.com</span> email.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {error === "auth-failure" && (
        <Alert
          variant="destructive"
          className="mb-6 border-danger/20 bg-danger-soft"
        >
          <AlertCircle className="size-5 shrink-0 text-danger" />
          <div className="ml-3">
            <AlertTitle className="text-danger">Authentication Failed</AlertTitle>
            <AlertDescription className="text-danger/90">
              There was a problem signing you in. Please try again.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Main Card */}
      <Card className="border-border bg-surface shadow-lg">
        <CardHeader className="space-y-3 pt-8 pb-6 text-center">
          <CardTitle className="text-heading-lg font-bold text-text-primary">Welcome Back!</CardTitle>
          <CardDescription className="text-body-md mx-auto max-w-[280px] text-text-secondary">
            Sign in with your ACD Google account to access your dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {/* Faculty/Staff Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary">
              <Users className="size-4 text-primary" />
              
            </div>
            <GoogleSignInButton />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-4 text-label-sm font-medium tracking-wider text-text-muted uppercase">
                or
              </span>
            </div>
          </div>

          {/* Student Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary">
              <GraduationCap className="size-4 text-secondary" />
              <span>New Students</span>
            </div>
            <GoogleSignInButton intent="student" />
          </div>

          {/* Footer Links */}
          <div className="pt-4 text-center">
            <p className="text-caption text-text-muted">
              By signing in, you agree to our{" "}
              <a
                href="#"
                className="underline-offset-2 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="underline-offset-2 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Help Link */}
      <p className="mt-6 text-center text-body-sm text-text-secondary">
        Need help?{" "}
        <a
          href="mailto:support@acdeducation.com"
          className="font-medium text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
        >
          Contact IT Support
        </a>
      </p>
    </div>
  );
}
