import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { origin } = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  await supabase.auth.signOut();

  // Return to login page after logout
  return NextResponse.redirect(`${siteUrl}/login`);
}

export async function GET(request: Request) {
  return POST(request);
}
