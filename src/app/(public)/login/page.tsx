import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/features/auth/components/google-signin-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <Image 
          src="/logos/cloie-logo.png" 
          alt="CLOIE Logo" 
          width={64} 
          height={64} 
          className="mb-4 rounded-xl shadow-sm"
        />
        <h1 className="text-display-md font-bold text-primary tracking-tight">CLOIE</h1>
        <p className="text-body-md text-text-muted mt-2 text-center">
          Assumption College of Davao
        </p>
      </div>

      {error === "invalid_domain" && (
        <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            You must use your official <b>@acd.edu.ph</b> or <b>@acdeducation.com</b> institutional email account to access CLOIE.
          </AlertDescription>
        </Alert>
      )}

      {error === "auth-failure" && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Failed</AlertTitle>
          <AlertDescription>
            There was a problem signing you in. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border shadow-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-heading-lg text-text-primary">Welcome back</CardTitle>
          <CardDescription className="text-body-sm text-text-secondary">
            Sign in with your institutional Google account to continue. Access is strictly restricted to ACD domains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <GoogleSignInButton />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-text-muted">Or</span>
              </div>
            </div>

            <GoogleSignInButton intent="student" />
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-caption text-text-muted mx-auto max-w-[250px]">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
