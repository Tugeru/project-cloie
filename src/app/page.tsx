import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck, FileSpreadsheet, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const platformHighlights = [
  {
    title: "Evaluation workflows",
    description: "Coordinate outcome-based evaluations through one centralized academic workspace.",
    icon: ClipboardCheck,
  },
  {
    title: "Role-aware access",
    description:
      "Support students, faculty, program heads, and academic leaders with focused views.",
    icon: UsersRound,
  },
  {
    title: "Reporting readiness",
    description:
      "Keep evidence organized for internal review, accreditation support, and program improvement.",
    icon: FileSpreadsheet,
  },
  {
    title: "Secure sign-in",
    description:
      "Use institutional access controls built for Assumption College of Davao accounts.",
    icon: ShieldCheck,
  },
];


export default function Home() {
  return (
    <div className="bg-background relative overflow-hidden">

      <header className="border-border/80 bg-background/95 sticky top-0 z-50 border-b">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/cloie-logo.png"
              alt="CLOIE Logo"
              width={40}
              height={40}
              className="shrink-0 object-contain"
            />
            <div className="space-y-0.5">
              <p className="text-title-md text-text-primary font-bold">CLOIE</p>
              <p className="text-caption text-text-muted">Assumption College of Davao</p>
            </div>
          </div>

          <Button
            render={<Link href="/login" />}
            variant="outline"
            className="text-label-lg h-10 px-4"
          >
            Sign In
          </Button>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:px-8 lg:py-24">
          <div className="relative max-w-2xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-10 left-0 hidden opacity-[0.08] blur-[2px] sm:block"
            >
              <Image
                src="/logos/cloie-logo.png"
                alt=""
                width={280}
                height={280}
                className="h-auto w-[220px]"
              />
            </div>

            <div className="relative mt-8 space-y-6">
              <div className="space-y-4">
                <h1 className="text-display-md text-text-primary sm:text-display-lg max-w-xl">
                  System CLOIE
                </h1>
                <p className="text-label-md text-primary tracking-[0.12em] uppercase">
                  System for Comprehensive Learning Outcomes and Instructional Evaluation
                </p>
                <p className="text-body-lg text-text-secondary max-w-xl">
                  A structured home for academic evaluation across ACD.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  render={<Link href="/login" />}
                  size="lg"
                  className="text-label-lg h-12 px-6 text-white shadow-sm"
                >
                  Sign In to CLOIE
                </Button>
              </div>

              <div className="border-border bg-surface flex items-center gap-4 rounded-2xl border px-5 py-4 shadow-sm sm:max-w-md">
                <Image
                  src="/logos/acd-logo.png"
                  alt="Assumption College of Davao Logo"
                  width={52}
                  height={52}
                  className="shrink-0 object-contain"
                />
                <div>
                  <p className="text-title-sm text-text-primary">
                    Built for Assumption College of Davao
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    Designed to support academic stewardship, quality assurance, and
                    evidence-informed review.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="border-border bg-surface rounded-3xl border p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="border-border flex items-center justify-between gap-4 border-b pb-5">
                <div>
                  <p className="text-label-md text-primary">Platform snapshot</p>
                  <h2 className="text-heading-md text-text-primary mt-1">
                    Focused tools for evaluation and reporting
                  </h2>
                </div>
                <div className="bg-primary-soft text-caption text-primary rounded-full px-3 py-1">
                  Secure access
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {platformHighlights.map(({ title, description, icon: Icon }) => (
                  <div
                    key={title}
                    className="border-border bg-background flex gap-4 rounded-2xl border px-4 py-4"
                  >
                    <div className="bg-primary-soft text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-title-sm text-text-primary">{title}</h3>
                      <p className="text-body-sm text-text-secondary">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
