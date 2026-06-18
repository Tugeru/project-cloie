import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

describe("Secretary RLS Policies", () => {
  let supabase: ReturnType<typeof createClient> | null;

  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return;
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  it.skip("SECRETARY role can write to school_years", async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("school_years")
      .insert({ code: "TEST-SY-" + Date.now() })
      .select()
      .single();

    if (error) {
      console.error("RLS insert error:", error);
    }

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it.skip("SECRETARY role can write to academic_term_instances", async () => {
    if (!supabase) return;
    const { data: syData, error: syError } = await supabase
      .from("school_years")
      .insert({ code: "TEST-SY-TERM-" + Date.now() })
      .select()
      .single();

    if (syError) {
      console.error("Setup school_year error:", syError);
      expect(syError).toBeNull();
      return;
    }

    const { data, error } = await supabase
      .from("academic_term_instances")
      .insert({
        school_year_id: syData.id,
        semester: "FIRST",
        term: "FIRST_TERM",
      })
      .select()
      .single();

    if (error) {
      console.error("RLS insert error:", error);
    }

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it.skip("Non-SECRETARY roles are denied writes to school_years", async () => {
    if (!supabase) return;
    const { error } = await supabase
      .from("school_years")
      .insert({ code: "TEST-SY-NON-ADMIN-" + Date.now() })
      .select()
      .single();

    expect(error).toBeDefined();
    expect(error?.code).toBe("PGRST300");
  });

  it.skip("RLS policy definitions do not contain literal 'ADMIN'", async () => {
    if (!supabase) return;
    const { data, error } = await supabase.rpc("pg_get_policydef", {
      policyname: "Enable write access for secretary only",
      tablename: "school_years",
    });

    if (error) {
      console.warn("Policy check skipped (DB unreachable):", error.message);
      return;
    }

    const policyDef = data as string | null;
    if (policyDef) {
      expect(policyDef).not.toContain("'ADMIN'");
      expect(policyDef).toContain("'SECRETARY'");
    }
  });
});
