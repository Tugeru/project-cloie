import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEV_AUTH_COOKIE_NAME } from "@/features/auth/services/dev-auth";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { origin } = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(DEV_AUTH_COOKIE_NAME);

  // Return to portal page after logout
  return NextResponse.redirect(`${siteUrl}/portal`);
}

export async function GET(request: Request) {
  return POST(request);
}
