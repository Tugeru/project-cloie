import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";

export async function getSession() {
  return resolveAuthSession();
}
