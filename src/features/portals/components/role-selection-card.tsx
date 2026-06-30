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
            <img 
              src="/logos/google-logo.svg" 
              alt="" 
              className="h-4 w-auto mr-2" 
              aria-hidden="true" 
            />
          )}
          {isLoading ? "Connecting..." : `Continue as ${config.title}`}
        </Button>
      </div>
    </div>
  );
}
