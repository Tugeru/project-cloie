import { createClient } from "@/lib/supabase/server";

export async function getSession() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Basic representation. In the next steps, we will enrich this
  // with the user's role from the Prisma schema.
  return {
    id: user.id,
    email: user.email,
  };
}
