export function getSupabaseCommand(platform = process.platform) {
  return platform === "win32" ? "supabase.cmd" : "supabase";
}
