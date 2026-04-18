import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">Unauthorized</h1>
      <p>You are signed in, but your current role cannot access this section.</p>
      <Link href="/dashboard" className="underline">
        Return to dashboard
      </Link>
    </main>
  );
}
