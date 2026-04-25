import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileSpreadsheet, ShieldCheck, UsersRound } from "lucide-react";
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

const supportCards = [
  {
    eyebrow: "Outcomes evaluation",
    title: "Track instructional and learning evidence with clarity.",
    description:
      "Bring course-aligned evaluation activity into one disciplined workflow for consistent review.",
  },
  {
    eyebrow: "Centralized workflows",
    title: "Reduce fragmented coordination across roles.",
    description:
      "Keep academic stakeholders aligned through one shared platform for submissions, review, and follow-through.",
  },
  {
    eyebrow: "Evidence generation",
    title: "Prepare reports and records with less friction.",
    description:
      "Structure responses and records so academic units can review performance and support quality assurance.",
  },
];

export default function Home() {
  return (
    <div className="bg-background selection:bg-primary-soft relative overflow-hidden">
      <div className="from-primary-soft via-background to-background pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-linear-to-b" />
      <div className="bg-primary/10 pointer-events-none absolute top-20 right-[-8rem] h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-secondary/15 pointer-events-none absolute top-64 left-[-6rem] h-56 w-56 rounded-full blur-3xl" />

      <header className="border-border/80 bg-background/95 sticky top-0 z-50 border-b">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/cloie-logo.png"
              alt="CLOIE Logo"
              width={40}
              height={40}
              className="border-primary/10 bg-surface rounded-xl border p-1 shadow-sm"
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

            <div className="border-primary/15 bg-surface inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm">
              <span className="bg-primary h-2.5 w-2.5 rounded-full" />
              <span className="text-label-sm text-text-secondary">
                Institutional evaluation platform
              </span>
            </div>

            <div className="relative mt-8 space-y-6">
              <div className="space-y-4">
                <p className="text-label-md text-primary tracking-[0.18em] uppercase">
                  System for Comprehensive Learning Outcomes and Instructional Evaluation
                </p>
                <h1 className="text-display-md text-text-primary sm:text-display-lg max-w-xl">
                  A structured home for academic evaluation across ACD.
                </h1>
                <p className="text-body-lg text-text-secondary max-w-xl">
                  CLOIE helps Assumption College of Davao manage outcomes evaluation, coordinate
                  stakeholders, and keep academic records organized in one secure, role-aware
                  platform.
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
                <Button
                  render={<Link href="#how-cloie-helps" />}
                  size="lg"
                  variant="outline"
                  className="text-label-lg h-12 px-6"
                >
                  Learn more
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

              <div className="bg-primary text-text-on-dark mt-6 flex items-center justify-between rounded-2xl px-5 py-4">
                <div>
                  <p className="text-label-md text-white/80">Get started</p>
                  <p className="text-title-sm text-white">
                    Sign in with your institutional account
                  </p>
                </div>
                <ArrowRight className="size-5 shrink-0" />
              </div>
            </div>
          </div>
        </section>

        <section id="how-cloie-helps" className="border-border/80 bg-surface border-t">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl space-y-3">
              <p className="text-label-md text-primary tracking-[0.18em] uppercase">
                How CLOIE helps
              </p>
              <h2 className="text-heading-xl text-text-primary">
                Built for clear, credible academic workflows.
              </h2>
              <p className="text-body-lg text-text-secondary">
                The landing experience stays concise, but the platform message should still
                communicate why CLOIE belongs in a serious academic environment.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {supportCards.map((card) => (
                <article
                  key={card.title}
                  className="border-border bg-background rounded-3xl border p-6 shadow-sm"
                >
                  <p className="text-label-sm text-primary tracking-[0.14em] uppercase">
                    {card.eyebrow}
                  </p>
                  <h3 className="text-title-lg text-text-primary mt-4">{card.title}</h3>
                  <p className="text-body-md text-text-secondary mt-3">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
