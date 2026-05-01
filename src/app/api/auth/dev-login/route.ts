import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEV_AUTH_COOKIE_NAME } from "@/features/auth/services/dev-auth";

export async function POST(request: Request) {
  const isDemoAllowed =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (!isDemoAllowed) {
    return NextResponse.json({ error: "Unavailable outside development." }, { status: 404 });
  }

  const { email } = (await request.json()) as { email?: string };

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      id: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Demo user not found in seed data." }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(
    DEV_AUTH_COOKIE_NAME,
    JSON.stringify({
      email: user.email,
      userId: user.id,
    }),
    {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    }
  );

  return NextResponse.json({ success: true });
}
