import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";

export default function LoginPage() {
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

      <Card className="border-border shadow-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-heading-lg text-text-primary">Welcome back</CardTitle>
          <CardDescription className="text-body-sm text-text-secondary">
            Sign in with your institutional Google account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton />
          
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
