# PROJECT CLOIE

**Comprehensive Learning Outcomes and Instructional Evaluation**

A college-level digital evaluation, monitoring, and reporting platform for Assumption College of Davao. CLOIE supports multiple academic programs, their courses, faculty members, and stakeholder-based outcome evaluation processes.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** PostgreSQL on Supabase
- **ORM:** Prisma
- **Auth:** Supabase Auth (Google OAuth)
- **Testing:** Vitest + Playwright
- **Deployment:** Vercel + Supabase

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your app credentials and Prisma database URLs:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# DATABASE_URL
# DIRECT_URL

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Supabase Workflow

The project uses a single hosted Supabase project with Git-tracked SQL migrations under `supabase/`.

App runtime still requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, and `DIRECT_URL` in `.env.local`.

See `supabase/README.md` for the cloud-only workflow, including the CLI variables such as `SUPABASE_PROJECT_REF`, the baseline-only repair helper guard, and the Docker-free schema migration flow.

## Project Structure

See `docs/full-folder-structure.txt` for the complete intended architecture.

## License

This project is part of a BSIT capstone at Assumption College of Davao.
