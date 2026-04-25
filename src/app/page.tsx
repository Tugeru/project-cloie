import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background selection:bg-info/30 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-info/5 blur-[80px] rounded-full pointer-events-none -z-10" />

      {/* Navbar Minimal */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md border-b border-border/40 fixed top-0 w-full z-50 bg-surface/50">
        <div className="flex items-center gap-3">
          <Image src="/logos/cloie-logo.png" alt="CLOIE Logo" width={32} height={32} className="rounded-lg shadow-sm" />
          <span className="font-heading font-bold text-lg text-text-primary tracking-tight">CLOIE</span>
        </div>
        <Link href="/login">
          <Button variant="outline" className="font-medium shadow-sm transition-shadow hover:shadow-md">Sign In</Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full max-w-7xl mx-auto">
        <div className="mb-8 p-1.5 pr-4 pl-2 rounded-full border border-border/80 bg-surface/60 backdrop-blur-md shadow-sm flex items-center gap-3 transition-colors hover:bg-surface/80">
          <span className="flex h-5 w-5 rounded-full bg-info-soft items-center justify-center">
            <span className="flex h-2 w-2 rounded-full bg-info animate-pulse"></span>
          </span>
          <span className="text-body-sm font-medium text-text-secondary tracking-wide">Secure Evaluation Portal</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-text-primary font-heading tracking-tight max-w-4xl leading-[1.1] mb-6">
          Transforming Academic <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-info to-primary">
            Outcomes Evaluation
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-text-secondary mb-10 leading-relaxed font-body">
          The centralized platform for Comprehensive Learning Outcomes and Instructional Evaluation at the Assumption College of Davao.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 shadow-card hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300">
              Sign In to CLOIE
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-border/80 bg-surface/50 backdrop-blur-sm hover:bg-surface hover:text-text-primary transition-all">
              Learn More
            </Button>
          </Link>
        </div>

        {/* Feature Marks / Logos */}
        <div className="mt-28 pt-10 border-t border-border/40 w-full flex flex-col justify-center items-center gap-6 opacity-80 transition-all duration-500">
          <p className="text-body-sm text-text-muted font-medium uppercase tracking-wider">Trusted Architecture For</p>
          <div className="flex items-center gap-4  opacity-100">
            <Image src="/logos/acd-logo.png" alt="ACD Logo" width={56} height={56} className="object-contain drop-shadow-sm" />
            <span className="text-xl font-heading font-semibold text-text-primary">Assumption College of Davao</span>
          </div>
        </div>
      </main>
    </div>
  );
}
