import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthSessionFromUser } from "@/modules/identity-access/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";

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
  const isAuthorized = email.endsWith("@acd.edu.ph") || email.endsWith("@acdeducation.com");

  if (!isAuthorized) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${siteUrl}/login?error=invalid_domain`);
  }

  const session = await resolveAuthSessionFromUser({
    id: data.user.id,
    email: data.user.email ?? null,
  });
  const nextUrl = resolvePostLoginDestination({
    requestedPath: searchParams.get("next") ?? "/dashboard",
    intent: searchParams.get("intent"),
    primaryRole: session?.primaryRole ?? null,
    profileGate: session?.profileGate ?? { status: "ROLE_SELECTION_REQUIRED" },
  });

  return NextResponse.redirect(`${siteUrl}${nextUrl}`);
}
