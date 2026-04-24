import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroCardProps {
  name: string;
  contextLabel: string;
  evaluationsHref?: string;
}

export function HeroCard({
  name,
  contextLabel,
  evaluationsHref = "/student/evaluations",
}: HeroCardProps) {
  return (
    <section className="mb-8 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary to-primary-active p-6 text-on-primary shadow-md lg:p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="mb-1 font-heading text-heading-lg font-extrabold lg:text-heading-xl">
            Welcome, {name}
          </h2>
          <p className="font-medium text-primary-muted">{contextLabel}</p>
          <p className="mt-4 inline-block rounded-full border border-primary-border/20 bg-primary-active/30 px-3 py-1.5 text-body-sm">
            Complete your assigned evaluations before their deadlines.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            render={<Link href={evaluationsHref} />}
            variant="secondary"
            className="font-semibold"
          >
            My Evaluations
          </Button>
        </div>
      </div>
    </section>
  );
}
