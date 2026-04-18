import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Note: we can't reliably get origin if we are behind a proxy, 
  // but for simple redirection login page is fine.
  const { origin } = new URL(request.url);

  await supabase.auth.signOut();

  // Return to login page after logout
  return NextResponse.redirect(`${origin}/login`);
}
