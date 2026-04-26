"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function GoogleSignInButton({ intent }: { intent?: "student" | "faculty" }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const intentParam = intent ? `?intent=${intent}` : "";
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

  const isStudent = intent === "student";

  return (
    <Button
      variant="outline"
      onClick={handleSignIn}
      disabled={isLoading}
      className={`
        h-12 w-full gap-3 border-2 font-semibold transition-all duration-300
        ${
          isStudent
            ? "border-[#d49900]/30 bg-white hover:border-[#d49900] hover:bg-[#fff4d6]/50 hover:text-[#b88200]"
            : "border-[#2563eb]/30 bg-white hover:border-[#2563eb] hover:bg-[#eff6ff]/50 hover:text-[#1d4ed8]"
        }
        disabled:opacity-60
      `}
    >
      {isLoading ? (
        <Loader2
          className={`size-5 animate-spin ${isStudent ? "text-[#d49900]" : "text-[#2563eb]"}`}
        />
      ) : (
        <svg
          className={`size-5 ${isStudent ? "text-[#d49900]" : "text-[#2563eb]"}`}
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span className="text-[#334155]">
        {isLoading
          ? "Connecting..."
          : isStudent
            ? "Sign up as Student"
            : "Sign in with Google"}
      </span>
    </Button>
  );
}
