"use client";

import { useState, ElementType } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/utils/site-url";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ShieldAlert, 
  CheckCircle2, 
  Lock,
  ShieldCheck,
  GraduationCap,
  Users,
  BookOpen,
  Briefcase,
  Building2,
  UserCog
} from "lucide-react";
import { RoleCardConfig } from "../lib/role-card-config";

const ICON_MAP: Record<string, ElementType> = {
  ShieldCheck,
  GraduationCap,
  Users,
  BookOpen,
  Briefcase,
  Building2,
  UserCog,
};

interface RoleSelectionCardProps {
  config: RoleCardConfig;
}

export function RoleSelectionCard({ config }: RoleSelectionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const Icon = ICON_MAP[config.iconName] || ShieldCheck;

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const intentParam = `?intent=${config.role.toLowerCase().replace("_", "-")}`;
      const redirectTo = `${getSiteUrl()}/api/auth/callback${intentParam}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

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

  const isSelfService = config.category === "self_service_internal" || config.category === "self_service_external";
  const needsAcdEmail = config.category === "self_service_internal" || config.category === "provisioned_faculty" || config.category === "pre_provisioned_admin";

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center justify-center size-12 rounded-xl bg-primary-soft text-primary shrink-0">
          <Icon className="size-6" />
        </div>
        <div>
          <h3 className="text-title-md font-semibold text-text-primary">{config.title}</h3>
          {!isSelfService && config.category === "pre_provisioned_admin" && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-medium tracking-wide uppercase">
              <Lock className="size-3" />
              Pre-Provisioned
            </span>
          )}
        </div>
      </div>

      <p className="text-body-sm text-text-secondary flex-1 mb-6">
        {config.description}
      </p>

      <div className="space-y-4 mt-auto">
        {/* Domain Indicator */}
        <div className="text-caption text-text-muted flex items-start gap-2 bg-background p-3 rounded-lg border border-border/50">
          {needsAcdEmail ? (
            <>
              <ShieldAlert className="size-4 text-primary shrink-0 mt-0.5" />
              <span>ACD email required (@acd.edu.ph or @acdeducation.com)</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
              <span>Any Google account accepted</span>
            </>
          )}
        </div>

        {/* Action Area */}
        <Button 
          onClick={handleSignIn} 
          disabled={isLoading}
          className="w-full bg-white text-text-primary border border-border hover:bg-surface-hover shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <svg className="size-4 mr-2" aria-hidden="true" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {isLoading ? "Connecting..." : `Continue as ${config.title}`}
        </Button>
      </div>
    </div>
  );
}
