import Image from "next/image";
import { Building2, Users } from "lucide-react";
import { PortalChoiceCard } from "@/features/portals";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-sm">
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
              <p className="text-title-md font-bold text-text-primary">CLOIE</p>
              <p className="text-caption text-text-muted">Assumption College of Davao</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Centered content */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-10">
            <h1 className="text-display-md mb-3 text-text-primary sm:text-display-lg">
              Welcome to System CLOIE
            </h1>
            <p className="text-body-lg text-text-secondary">
              Select your portal to sign in or register.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <PortalChoiceCard
              icon={<Building2 className="size-6" />}
              title="ACD Staff & Faculty"
              description="Manage evaluations, curriculum, and academic operations."
              roles={["Secretary", "Dean", "Program Head", "Faculty"]}
              href="/portal/staff"
              badge="ACD email required"
            />
            <PortalChoiceCard
              icon={<Users className="size-6" />}
              title="Students, Alumni & Partners"
              description="Participate in evaluations, surveys, and feedback programs."
              roles={["Student", "Alumni", "Industry Partner"]}
              href="/portal"
              badge="Any Google account"
            />
          </div>

          <p className="text-caption mt-10 text-text-muted">
            System for Comprehensive Learning Outcomes and Instructional Evaluation
          </p>
        </div>
      </main>
    </div>
  );
}
