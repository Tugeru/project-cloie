# CLOIE Tech Stack Document

## PROJECT CLOIE: The Development of a System for Comprehensive Learning Outcomes and Instructional Evaluation

---

## 1. Executive Tech Stack Summary

PROJECT CLOIE should use a **single-codebase, full-stack web architecture** that is practical for a **2-person capstone team**, supports a **responsive installable PWA**, and fits the system's core needs: **role-based access**, **form-heavy workflows**, **relational academic data**, **reporting**, and **dashboard-based analytics**.

### Final Recommended Stack

- **Frontend / Full-stack Framework:** Next.js
- **Programming Language:** TypeScript
- **Styling Framework:** Tailwind CSS
- **UI Component Strategy:** shadcn/ui
- **Forms:** React Hook Form
- **Validation:** Zod
- **State / Data Fetching:** TanStack Query (selective use)
- **Quantitative Visualization:** Recharts
- **Qualitative Text Processing:** winkNLP + stopword + app-level preprocessing
- **Qualitative Visualization:**`@isoterik/react-word-cloud`
- **Database:** PostgreSQL
- **Backend Platform:** Supabase
- **ORM / Data Layer:** Prisma ORM
- **Authentication:** Supabase Auth with Google OAuth
- **Authorization:** database-backed RBAC with scoped access rules
- **Report Export:** SheetJS, PDF generation library, optional Word export
- **Testing:** Vitest + Playwright
- **Deployment:** Vercel + Supabase
- **CI/CD:** GitHub + Vercel integration

### Overall Rationale

This stack is the best fit for CLOIE because it:
- keeps the architecture simple and coherent
- supports a full-stack PWA in one main application codebase
- fits relational academic data and structured reporting well
- handles role-based workflows cleanly
- is well-documented and widely used
- remains realistic for capstone-level implementation and maintenance

---

## 2. Technology Selection Criteria

The stack was selected using the following criteria:

1. **Capstone feasibility**
   - Must be manageable by a 2-person team.
   - Must avoid unnecessary infrastructure and enterprise-level complexity.

2. **PWA readiness**
   - Must support installability, responsive behavior, and native-like UX across desktop, tablet, and mobile.

3. **Relational data suitability**
   - CLOIE requires strong support for structured entities such as users, roles, programs, majors, courses, CILOs, mappings, forms, responses, and reports.

4. **Role-based security**
   - Must support secure authentication and strict role-based and scope-based access control.

5. **Form-heavy workflow support**
   - Must handle onboarding forms, evaluation forms, faculty configuration flows, and preview/confirmation flows well.

6. **Maintainability**
   - Must remain understandable, well-documented, and extendable over time.

7. **Deployment practicality**
   - Must be easy to host, demo, and update throughout development.

---

## 3. Frontend Stack

## 3.1 Next.js

**Technology:** Next.js  
**Purpose:** Main frontend framework and primary application runtime for the web app and PWA shell.  
**Why it fits CLOIE:** Next.js supports full-stack web applications, server-side rendering, route handling, and modern React-based UI development in one project. This makes it ideal for CLOIE's combination of dashboards, forms, protected pages, and responsive PWA behavior.  
**Pros:**
- One main application codebase
- Strong React ecosystem support
- Good fit for authenticated dashboards and form workflows
- Supports PWA-friendly implementation
- Excellent deployment experience on Vercel

**Cons:**
- Requires understanding of server/client rendering boundaries
- Can become messy without disciplined project structure

**Decision:** **Chosen** as the core application framework.

## 3.2 TypeScript

**Technology:** TypeScript  
**Purpose:** Main programming language for frontend and backend logic.  
**Why it fits CLOIE:** CLOIE has many entities, role rules, workflows, and data relationships. TypeScript improves safety and makes integration across forms, validation, ORM, auth, and business rules more reliable.  
**Pros:**
- Better type safety
- Easier refactoring
- Strong editor support
- Works well with Prisma and Zod

**Cons:**
- Slightly slower initial development than plain JavaScript
- Requires discipline in typing and schema design

**Decision:** **Chosen** as the main language.

---

## 4. Backend Stack

## 4.1 Supabase

**Technology:** Supabase  
**Purpose:** Managed backend platform for PostgreSQL, authentication, storage, and backend support services.  
**Why it fits CLOIE:** Supabase gives CLOIE a managed backend foundation without requiring the team to manually set up and maintain database infrastructure, authentication services, and storage from scratch. This greatly reduces DevOps burden for a capstone project.  
**Pros:**
- Managed PostgreSQL backend
- Built-in authentication support
- Optional storage support
- Good fit for rapid development
- Reduces infrastructure setup time

**Cons:**
- Requires careful security configuration
- Some capabilities depend on platform-specific patterns
- Can create architectural coupling if used carelessly

**Decision:** **Chosen** as the backend platform.

## 4.2 Next.js Server-Side Logic

**Technology:** Next.js Route Handlers / Server-side logic  
**Purpose:** Handle protected business logic, secure server operations, and controlled access to CLOIE data.  
**Why it fits CLOIE:** Even with Supabase as the managed backend platform, CLOIE still needs app-level server logic for protected operations such as role resolution, scope checking, reporting, evaluation publishing, and response submission enforcement.  
**Pros:**
- Keeps business logic inside the main app
- Avoids maintaining a separate backend codebase
- Makes same-origin protected operations easier
- Better control over confidentiality-sensitive logic

**Cons:**
- Requires careful modularization
- Not as isolated as a standalone backend service

**Decision:** **Chosen** as the main application-layer backend logic.

## 4.3 Architecture Style

**Technology:** Modular monolith  
**Purpose:** Organize the codebase into feature-based or module-based domains.  
**Why it fits CLOIE:** CLOIE is too structured for an unorganized monolithic codebase, but too small for microservices. A modular monolith is the best balance.  
**Pros:**
- Easier to understand and deploy
- Keeps responsibilities separated by module
- Good fit for small team development

**Cons:**
- Requires structure discipline
- Can become tightly coupled if not kept modular

**Decision:** **Chosen** as the overall application architecture style.

---

## 5. Database and Data Layer

## 5.1 PostgreSQL

**Technology:** PostgreSQL  
**Purpose:** Primary relational database for all structured academic and evaluation data.  
**Why it fits CLOIE:** CLOIE is a highly relational system with entities such as users, roles, programs, majors, courses, CILOs, form instances, responses, and reports. PostgreSQL is an excellent fit for relational integrity, joins, constraints, and structured reporting.  
**Pros:**
- Excellent relational model support
- Strong integrity constraints
- Good performance for structured queries and reporting
- Widely used and well-documented

**Cons:**
- Requires thoughtful schema design
- Complex reports may need optimized queries later

**Decision:** **Chosen** as the primary database.

## 5.2 Prisma ORM

**Technology:** Prisma ORM  
**Purpose:** Type-safe ORM and migration layer on top of PostgreSQL.  
**Why it fits CLOIE:** Prisma gives a much cleaner workflow for defining schema, generating types, querying relational data, and managing schema migrations. It is especially suitable for a TypeScript project like CLOIE.  
**Pros:**
- Type-safe queries
- Strong developer experience
- Good schema-to-code workflow
- Migration support through Prisma Migrate
- Helpful tooling for inspecting data

**Cons:**
- Another abstraction layer to learn
- Some advanced reporting queries may still need careful tuning

**Decision:** **Chosen** as the main ORM and data-access layer.

## 5.3 Suggested Core Data Domains

The stack should support at least the following data domains:
- users
- roles
- user_roles
- programs
- majors
- courses
- year levels
- sections / class groups
- faculty-created course-bound evaluation forms
- PLOs
- GOs
- CILOs
- CILO mappings
- evaluation instrument templates
- response records
- quantitative response items
- qualitative response items
- analytics / report metadata

---

## 6. Authentication and Authorization

## 6.1 Supabase Auth

**Technology:** Supabase Auth  
**Purpose:** Authentication service for user sign-in, session handling, and Google-based login.  
**Why it fits CLOIE:** CLOIE already leans toward Google-based institutional access for internal users. Supabase Auth supports social login, including Google OAuth, and fits naturally with the chosen Supabase backend platform.  
**Pros:**
- Built into the backend platform
- Supports OAuth providers
- Simplifies account/session management
- Good for rapid development

**Cons:**
- Still requires custom internal role logic
- Must be configured carefully for security

**Decision:** **Chosen** as the authentication layer.

## 6.2 Recommended Access Model

### Internal Users
For:
- administrator
- dean
- program head
- faculty
- student
- graduating student

Use:
- Google OAuth through Supabase Auth
- institutional email/domain validation where applicable
- internal CLOIE database role lookup after authentication

### External Users
For:
- alumni
- industry partners

Use one of these:
- pre-provisioned invited accounts
- Google-authenticated invited accounts
- alternative email-based access later if needed

## 6.3 Authorization Strategy

**Technology:** Database-backed RBAC with scoped access rules  
**Purpose:** Enforce permissions and scope-based visibility after authentication.  
**Why it fits CLOIE:** CLOIE requires more than basic login. It needs:
- role-based page/module access
- student visibility to only assigned forms
- faculty access to allowed course contexts
- dean/program-head reporting scope
- restricted qualitative comment visibility

**Pros:**
- Strong control over permissions
- Works well with relational academic data
- Supports course/program/stakeholder scoping

**Cons:**
- Requires careful schema and access-check design
- Must be enforced at server logic and database policy levels

**Decision:** **Chosen** as the authorization model.

---

## 7. PWA and Cross-Platform Support

## 7.1 PWA Implementation

**Technology:** Next.js PWA implementation with manifest, service worker, icons, and installable metadata  
**Purpose:** Deliver CLOIE as an installable responsive web application with a native-like experience.  
**Why it fits CLOIE:** The project explicitly requires installability and native-like usability across desktop, tablet, and mobile. A PWA is the best way to support this without building separate native applications.  
**Pros:**
- Single deployable web application
- Installable on supported devices
- Good for native-like repeated use
- Strong alignment with CLOIE requirements

**Cons:**
- Offline support should remain limited in MVP
- iOS install behavior has platform-specific constraints

**Decision:** **Chosen** as the platform delivery model.

## 7.2 Recommended PWA Scope for CLOIE

For MVP:
- installable manifest
- app icons
- splash / launch framing
- responsive layouts by device class
- limited app-shell behavior
- no advanced offline-first submission queue yet

This keeps the implementation realistic and avoids overbuilding.

---

## 8. UI / Styling / Component System

## 8.1 Tailwind CSS

**Technology:** Tailwind CSS  
**Purpose:** Main styling framework.  
**Why it fits CLOIE:** Tailwind allows rapid and consistent UI implementation across forms, cards, dashboards, tables, modals, and responsive layouts. It also supports translating the CLOIE design system into reusable patterns.  
**Pros:**
- Fast UI development
- Excellent responsive styling support
- Works well with design systems
- Easy to standardize spacing and layout patterns

**Cons:**
- Utility classes can become messy without abstraction
- Requires component discipline

**Decision:** **Chosen** as the styling framework.

## 8.2 shadcn/ui

**Technology:** shadcn/ui  
**Purpose:** Base component system for reusable, accessible UI components.  
**Why it fits CLOIE:** CLOIE needs consistent components for dialogs, forms, drawers, cards, filters, tables, tabs, and workflow steps. shadcn/ui gives a strong accessible base while allowing the project to own and customize component code.  
**Pros:**
- Accessible component primitives
- Flexible and customizable
- Works well with Tailwind CSS
- Good balance between speed and control

**Cons:**
- Requires manual setup and customization
- Not a complete plug-and-play design system

**Decision:** **Chosen** as the component strategy.

## 8.3 Lucide React

**Technology:** Lucide React  
**Purpose:** Icon library for app navigation, action buttons, states, and dashboard UI.  
**Why it fits CLOIE:** CLOIE needs a clean and consistent icon set for role-based navigation and operational actions. Lucide is lightweight and works well with React applications.  
**Pros:**
- Clean consistent icon style
- Simple React integration
- Good for app UIs

**Cons:**
- Another dependency to maintain

**Decision:** **Chosen** as the icon library.

## 8.4 Recharts

**Technology:** Recharts  
**Purpose:** Quantitative data visualization for dashboards and reports.  
**Why it fits CLOIE:** CLOIE needs practical charting for outcome attainment, stakeholder comparison, trend visualization, and report summaries. Recharts is sufficient for these needs and integrates well with React.  
**Pros:**
- Easy React integration
- Good for dashboard-style charts
- Enough for capstone-level analytics

**Cons:**
- Less flexible for highly advanced custom visualizations

**Decision:** **Chosen** as the charting library.

## 8.5 Word Cloud Visualization

**Technology:** `@isoterik/react-word-cloud`  
**Purpose:** Qualitative visualization for word frequency output.  
**Why it fits CLOIE:** CLOIE may benefit from a visual summary of qualitative comments, especially for report enhancement and CQI review.  
**Pros:**
- Quick qualitative visualization
- Easy to demonstrate in reports/dashboards

**Decision:** **Optional** enhancement, not a strict MVP dependency.

---

## 9. State Management and Data Fetching

## 9.1 TanStack Query

**Technology:** TanStack Query  
**Purpose:** Manage asynchronous server-state fetching, caching, and refetching.  
**Why it fits CLOIE:** CLOIE includes dashboards, filtered reports, multi-step admin/faculty flows, and data refresh patterns that benefit from cached server-state management.  
**Pros:**
- Strong server-state management
- Good support for cache and refetch behavior
- Great for report filters and dashboard interactions

**Cons:**
- Adds another abstraction layer
- Not necessary for every page

**Decision:** **Chosen selectively**, especially for interactive authenticated screens.

## 9.2 Recommended State Strategy

Use:
- local component state for simple UI state
- URL parameters for filters and navigation state where appropriate
- TanStack Query for interactive async server state
- server-side fetching for protected initial page data where appropriate

Do **not** introduce a heavy global state manager unless complexity later demands it.

---

## 10. Forms and Validation

## 10.1 React Hook Form

**Technology:** React Hook Form  
**Purpose:** Manage interactive forms efficiently.  
**Why it fits CLOIE:** CLOIE includes many forms:
- student onboarding
- faculty CILO encoding and setup
- evaluation forms
- profile forms
- preview/confirmation steps

React Hook Form is particularly well-suited for these scenarios.  
**Pros:**
- Good performance
- Well-suited for large and dynamic forms
- Strong integration with schema validation

**Cons:**
- Requires consistent reusable form component patterns

**Decision:** **Chosen** for form handling.

## 10.2 Zod

**Technology:** Zod  
**Purpose:** Schema validation for forms, input payloads, and business logic boundaries.  
**Why it fits CLOIE:** Zod fits well in a TypeScript stack and helps keep validation consistent across frontend forms and backend/server-side processing.  
**Pros:**
- Strong TypeScript integration
- Shared schema definitions possible
- Good form validation support

**Cons:**
- Needs organized schema structure to stay maintainable

**Decision:** **Chosen** for validation.

---

## 11. Text Processing and Qualitative Analytics

## 11.1 winkNLP

**Technology:** winkNLP  
**Purpose:** Tokenization, normalization, and lightweight NLP for qualitative responses.  
**Why it fits CLOIE:** CLOIE may analyze qualitative feedback for word frequency, keyword extraction, and basic preprocessing. winkNLP is lightweight and practical for capstone-scale NLP tasks.  
**Pros:**
- Lightweight
- Suitable for browser/Node usage
- Good for tokenization and normalization

**Cons:**
- Not a full advanced NLP pipeline
- Some custom preprocessing still needed

**Decision:** **Chosen** for lightweight qualitative text processing.

## 11.2 stopword

**Technology:** stopword  
**Purpose:** Remove common stop words during qualitative preprocessing.  
**Why it fits CLOIE:** Word frequency and word cloud analysis become much more useful when common filler words are removed.  
**Pros:**
- Simple and lightweight
- Useful for basic qualitative preprocessing

**Cons:**
- Needs careful tuning for context-specific words

**Decision:** **Chosen** as supporting preprocessing utility.

---

## 12. Report Export Tools

## 12.1 SheetJS

**Technology:** SheetJS  
**Purpose:** CSV and spreadsheet export for report outputs.  
**Why it fits CLOIE:** Spreadsheet and CSV export are practical, lightweight, and useful for academic reporting and further analysis.  
**Pros:**
- Flexible export formats
- Widely used
- Good for tabular reporting output

**Cons:**
- Export formatting can be tedious for complex sheets

**Decision:** **Chosen** as the primary export utility.

## 12.2 PDF Export

**Technology:** PDF generation library such as `react-pdf` or equivalent  
**Purpose:** Export reports in PDF form for sharing and documentation.  
**Why it fits CLOIE:** PDF export is useful for report sharing, panel presentation, and documentation.  
**Pros:**
- Good for fixed-format export
- Useful for presentation and printing

**Cons:**
- More effort than CSV export
- Layout work can become time-consuming

**Decision:** **Chosen** as a secondary export priority.

## 12.3 Word Export

**Technology:** `docx` or equivalent  
**Purpose:** Word document export.  
**Why it fits CLOIE:** May be useful for formal documentation outputs, but is less critical than spreadsheet and PDF export.  
**Pros:**
- Useful for editable document output

**Decision:** **Optional**, lower priority than CSV and PDF export.

---

## 13. Development Tooling

## 13.1 pnpm

**Technology:** pnpm  
**Purpose:** Package manager.  
**Why it fits CLOIE:** Fast, efficient dependency handling and good workspace support if needed later.  
**Pros:**
- Fast installs
- Efficient storage
- Good for organized projects

**Cons:**
- Slightly less universal familiarity than npm

**Decision:** **Chosen** as the package manager.

## 13.2 ESLint

**Technology:** ESLint  
**Purpose:** Linting and code quality enforcement.  
**Why it fits CLOIE:** Helps maintain consistent and safer code during fast capstone iteration.  
**Pros:**
- Catches problematic patterns early
- Supports team consistency

**Cons:**
- Requires configuration discipline

**Decision:** **Chosen**.

## 13.3 Prettier

**Technology:** Prettier  
**Purpose:** Automatic code formatting.  
**Why it fits CLOIE:** Keeps the codebase clean and consistent.  
**Pros:**
- Removes style debates
- Faster review and readability

**Cons:**
- Opinionated formatting

**Decision:** **Chosen**.

## 13.4 Environment Variable Handling

Use:
- `.env.local` for local development
- platform-managed secrets for production
- separate credentials for Supabase, OAuth, and application secrets

**Decision:** **Chosen** as the environment configuration strategy.

## 13.5 Version Control Workflow

Use:
- GitHub repository
- `main` branch as stable branch
- feature branches for development tasks
- pull-request-based merging where practical

**Decision:** **Chosen** as the version control workflow.

---

## 14. Testing

## 14.1 Vitest

**Technology:** Vitest  
**Purpose:** Unit and lightweight integration testing.  
**Why it fits CLOIE:** Useful for testing utility functions, validation schemas, permission logic, text preprocessing, and business rules.  
**Pros:**
- Fast feedback loop
- Good TypeScript support
- Lightweight compared to heavier setups

**Cons:**
- Requires structured test boundaries

**Decision:** **Chosen** for unit and integration tests.

## 14.2 Playwright

**Technology:** Playwright  
**Purpose:** End-to-end testing.  
**Why it fits CLOIE:** Useful for verifying complete flows such as:
- login
- onboarding
- student evaluation submission
- faculty evaluation form publication
- route protection

**Pros:**
- Strong browser automation
- Good for realistic user flows
- Useful for cross-platform verification

**Cons:**
- Heavier to maintain than unit tests
- Should focus only on critical workflows

**Decision:** **Chosen** for end-to-end testing.

---

## 15. Deployment and Hosting

## 15.1 Vercel

**Technology:** Vercel  
**Purpose:** Frontend and application hosting for the Next.js app.  
**Why it fits CLOIE:** Vercel offers strong support for Next.js deployment and simplifies preview deployments, updates, and production hosting.  
**Pros:**
- Excellent Next.js support
- Easy deployment pipeline
- Strong preview deployment workflow
- Good for capstone demos and iteration

**Cons:**
- Some advanced usage may increase costs later

**Decision:** **Chosen** as the main application hosting platform.

## 15.2 Supabase Deployment

**Technology:** Supabase managed services  
**Purpose:** Host database, authentication, and optional storage.  
**Why it fits CLOIE:** Keeps the backend stack managed and reduces setup/maintenance overhead.  
**Pros:**
- Managed database and auth
- Good integration with app-level services
- Low operational overhead

**Cons:**
- Still requires good security and access configuration

**Decision:** **Chosen** as the backend deployment platform.

## 15.3 Domain / DNS / SSL

**Technology:** Standard cloud domain and HTTPS/SSL setup  
**Purpose:** Provide production access, DNS mapping, and secure transport.  
**Why it fits CLOIE:** CLOIE needs secure authenticated access and should be deployable under a proper domain for testing or institutional use.  
**Pros:**
- Standard deployment practice
- Required for secure OAuth and production-like usage

**Cons:**
- Requires domain management setup

**Decision:** **Chosen** as a standard deployment requirement.

## 15.4 CI/CD

**Technology:** GitHub + Vercel integration  
**Purpose:** Automate build and deployment flow.  
**Why it fits CLOIE:** Simplifies continuous deployment during development.  
**Pros:**
- Easy to set up
- Good for preview builds and iterative releases

**Cons:**
- Still requires branch discipline

**Decision:** **Chosen** as the CI/CD strategy.

---

## 16. Monitoring, Logging, and Maintenance

## 16.1 Logging

**Technology:** Application logs + platform logs  
**Purpose:** Track errors, system events, and failures during development and deployment.  
**Why it fits CLOIE:** A lightweight logging strategy is enough for capstone scope.  
**Pros:**
- Low setup overhead
- Useful for debugging and monitoring

**Cons:**
- Less powerful than full observability platforms

**Decision:** **Chosen** as the initial logging approach.

## 16.2 Error Tracking / Monitoring

For MVP:
- use hosting logs
- use Supabase logs/monitoring tools
- add lightweight error tracking later only if needed

**Decision:** Keep this lightweight in MVP.

## 16.3 Backups and Recovery

Use:
- Supabase backup/recovery features as available
- migration-based schema management with Prisma
- database export/dump strategy before major changes

**Decision:** Use managed-service recovery plus disciplined migration handling.

## 16.4 Maintainability Strategy

Maintainability should be supported by:
- modular folder structure
- reusable UI components
- reusable validation schemas
- consistent database migrations
- documented RBAC rules
- clean separation of modules such as auth, outcomes, forms, responses, and reports

---

## 17. Security Considerations

CLOIE handles confidential evaluation data, so the chosen stack must support secure authentication, role-based access control, validation, and response protection.

### Required Security Practices
- secure authentication through Supabase Auth
- server-side role and scope checks
- route and API protection
- strict validation of all form input
- sanitization and normalization of text input where needed
- protection of confidential responses
- no client-only trust for authorization
- one-response enforcement where applicable
- preservation of finalized submissions from unintended modification
- restricted access to raw qualitative comments

### Why the Stack Supports Security Well
- Supabase supports authentication and secure session handling
- PostgreSQL supports strong relational integrity
- Prisma supports safe structured data access
- Zod supports runtime validation
- Next.js server-side logic supports central access control enforcement

---

## 18. Recommended Final Stack

### Final Stack Combination

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **React Hook Form**
- **Zod**
- **TanStack Query**
- **Recharts**
- **winkNLP + stopword**
- **PostgreSQL on Supabase**
- **Prisma ORM**
- **Supabase Auth with Google OAuth**
- **SheetJS**
- **PDF export library**
- **Vitest**
- **Playwright**
- **Vercel**
- **GitHub-based workflow**

### Why this is the best fit for CLOIE

This is the best overall stack because it balances:
- **simplicity** — one coherent full-stack web application
- **scalability** — enough structure for multi-role, multi-program growth
- **maintainability** — strong TypeScript, ORM, and modular architecture support
- **capstone feasibility** — manageable by a 2-person team
- **alignment with CLOIE requirements** — form-heavy workflows, reporting, analytics, role-based access, and PWA deployment

---

## 19. Alternatives Considered

## Alternative 1: Next.js + TypeScript + PostgreSQL + Auth.js + Prisma + Neon

**When it might be preferable:**
- if you want less platform coupling to Supabase
- if you prefer Auth.js over Supabase Auth
- if you want a more custom auth/data stack

**Why it was not chosen as main recommendation:**
- your earlier stack already centered on Supabase
- Supabase reduces more setup friction for auth + managed backend services
- staying with Supabase gives a more unified managed-platform approach

## Alternative 2: Next.js + NestJS + PostgreSQL

**When it might be preferable:**
- if the backend becomes much larger and more separate from the frontend
- if you need a more explicitly layered API service

**Why it was not chosen as main recommendation:**
- adds more infrastructure and maintenance overhead
- more complex for a 2-person capstone team
- not necessary for CLOIE’s current scale and requirements

---

## 20. Final Decision Statement

For PROJECT CLOIE, the recommended official stack is:

> **Next.js + TypeScript + Tailwind CSS + shadcn/ui + React Hook Form + Zod + TanStack Query + Recharts + PostgreSQL on Supabase + Prisma ORM + Supabase Auth + Vitest + Playwright + Vercel**

This stack is the best balance of modern development speed, structured full-stack capability, relational data support, responsive PWA delivery, and realistic capstone maintainability.
