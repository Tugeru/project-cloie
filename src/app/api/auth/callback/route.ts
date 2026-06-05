import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthSessionFromUser } from "@/features/auth/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/features/auth/services/resolve-post-login-destination";
import { validateRoleDomain } from "@/features/auth/services/validate-role-domain";
import { SystemRole } from "@prisma/client";

const VALID_SELF_SERVICE_INTENTS: Record<string, SystemRole> = {
  student: SystemRole.STUDENT,
  alumni: SystemRole.ALUMNI,
  "industry-partner": SystemRole.INDUSTRY_PARTNER,
  "industry_partner": SystemRole.INDUSTRY_PARTNER,
  faculty: SystemRole.FACULTY,
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth-failure`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth-failure`);
  }

  const email = data.user.email || "";
  const intentParam = searchParams.get("intent");

  if (intentParam) {
    const role = VALID_SELF_SERVICE_INTENTS[intentParam.toLowerCase()];
    if (role) {
      const validation = validateRoleDomain(email, role);
      if (!validation.valid) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${siteUrl}/login?error=invalid_domain&role=${intentParam}`
        );
      }
    } else {
      // Treat unknown intent (like 'admin' etc.) as invalid intent and fall back to default domain enforcement
      const isAuthorized = email.endsWith("@acd.edu.ph") || email.endsWith("@acdeducation.com");
      if (!isAuthorized) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${siteUrl}/login?error=invalid_domain`);
      }
    }
  } else {
    // Default domain enforcement (backward compatibility)
    const isAuthorized = email.endsWith("@acd.edu.ph") || email.endsWith("@acdeducation.com");
    if (!isAuthorized) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${siteUrl}/login?error=invalid_domain`);
    }
  }

  const session = await resolveAuthSessionFromUser({
    id: data.user.id,
    email: data.user.email ?? null,
  });
  const nextUrl = resolvePostLoginDestination({
    requestedPath: searchParams.get("next") ?? "/dashboard",
    intent: intentParam,
    primaryRole: session?.primaryRole ?? null,
    profileGate: session?.profileGate ?? { status: "ROLE_SELECTION_REQUIRED" },
  });

  return NextResponse.redirect(`${siteUrl}${nextUrl}`);
}

