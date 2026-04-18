import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

interface SessionGuardProps {
  children: React.ReactNode;
}

export async function SessionGuard({ children }: SessionGuardProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Assuming successful authentication, render the protected content
  return <>{children}</>;
}
