import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroCard({ name, program, year, section }: any) {
  return (
    <section className="bg-primary rounded-2xl p-6 lg:p-8 text-white mb-8 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold mb-1 font-heading">Good morning, {name}!</h2>
          <p className="text-primary-muted font-medium">{program} • {year} • {section}</p>
          <p className="mt-4 text-sm bg-primary-active/30 inline-block px-3 py-1.5 rounded-full border border-primary-border/20">
            Complete your assigned evaluations before the deadline.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
            <Link href="/student/evaluations">My Evaluations</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
