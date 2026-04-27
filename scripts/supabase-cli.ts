import { resolveLocalBin } from "./resolve-local-bin";

export function getSupabaseCommand() {
  return resolveLocalBin("supabase");
}
