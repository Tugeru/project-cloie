"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton({ intent }: { intent?: "student" | "faculty" }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const intentParam = intent ? `?intent=${intent}` : '';
      const redirectTo = `${window.location.origin}/api/auth/callback${intentParam}`;
      console.log("[GoogleSignIn] redirectTo:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      console.log("[GoogleSignIn] response:", { data, error });

      if (error) {
        console.error("[GoogleSignIn] Auth error:", error.message);
        alert(`Sign-in error: ${error.message}`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("[GoogleSignIn] Unexpected error:", err);
      alert(`Unexpected sign-in error: ${err}`);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleSignIn} 
      disabled={isLoading}
      className="w-full text-body-md font-semibold text-text-primary h-12"
    >
      {isLoading ? (
        <span className="mr-2">Connecting...</span>
      ) : (
        <svg
          className="mr-3 size-5"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          ></path>
        </svg>
      )}
      {isLoading ? "Redirecting..." : intent === "student" ? "Sign up as Student" : "Sign in with Google"}
    </Button>
  );
}
