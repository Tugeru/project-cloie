import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryRole } from "@/lib/auth/role-resolution";
import { getLandingPageForRole } from "@/lib/auth/redirects";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  
  // if "next" is set in URL, we use it as the redirect payload
  let nextUrl = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Determine user's role and redirect accordingly if no specific "next" is set
      if (nextUrl === "/dashboard") {
        const primaryRole = await getPrimaryRole(data.user.id);
        nextUrl = getLandingPageForRole(primaryRole);
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${nextUrl}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${nextUrl}`);
      } else {
        return NextResponse.redirect(`${origin}${nextUrl}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-failure`);
}
