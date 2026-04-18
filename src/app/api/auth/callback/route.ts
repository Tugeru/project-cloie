import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryRole } from "@/lib/auth/role-resolution";
import { getLandingPageForRole } from "@/lib/auth/redirects";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  
  // Resolve base URL safely for deployed environments
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  // if "next" is set in URL, we use it as the redirect payload
  let nextUrl = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // 1. Domain Constraint Check (Only @acd.edu.ph and @acdeducation.com allowed)
      const email = data.user.email || "";
      const isAuthorized = email.endsWith("@acd.edu.ph") || email.endsWith("@acdeducation.com");

      if (!isAuthorized) {
        // Purge the backend session instantly for unauthorized domains
        await supabase.auth.signOut();
        return NextResponse.redirect(`${siteUrl}/login?error=invalid_domain`);
      }

      // Determine user's role and redirect accordingly if no specific "next" is set
      if (nextUrl === "/dashboard") {
        const primaryRole = await getPrimaryRole(data.user.id);
        if (!primaryRole) {
          const intentParam = searchParams.get("intent") ? `?intent=${searchParams.get("intent")}` : "";
          nextUrl = `/onboarding${intentParam}`;
        } else {
          nextUrl = getLandingPageForRole(primaryRole);
        }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${siteUrl}${nextUrl}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${nextUrl}`);
      } else {
        return NextResponse.redirect(`${siteUrl}${nextUrl}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${siteUrl}/login?error=auth-failure`);
}
