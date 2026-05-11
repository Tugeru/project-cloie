# Student Dashboard & Evaluation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the responsive student dashboard and hybrid sectioned-wizard evaluation form using mock data for UI/UX validation.

**Architecture:** Role-based navigation using a client-side configuration, combined with a step-based form wizard that manages local evaluation state.

**Tech Stack:** React (Next.js), Tailwind CSS, Lucide React, Shadcn/UI (Dialog, Sheet, Progress, Tabs, Card), React Hook Form, Zod.

---

### Task 1: Responsive Layout & Sidebar Integration

**Files:**
- Modify: `src/app/(app)/student/layout.tsx`
- Modify: `src/components/layout/app-shell.tsx`

- [ ] **Step 1: Update Student Layout to use AppShell**
- [ ] **Step 2: Update AppShell to pass props to Sidebar, Topbar, and MobileNav**
- [ ] **Step 3: Commit**

### Task 2: Student Dashboard Home Components

**Files:**
- Create: `src/components/student/dashboard/hero-card.tsx`
- Create: `src/components/student/dashboard/stat-cards.tsx`
- Create: `src/components/student/dashboard/evaluation-card.tsx`
- Modify: `src/app/(app)/student/dashboard/page.tsx`

- [ ] **Step 1: Create Hero Card Component**
- [ ] **Step 2: Create Stat Cards Component**
- [ ] **Step 3: Update Dashboard Page**
- [ ] **Step 4: Commit**

### Task 3: Evaluation Card & Dashboard Lists

**Files:**
- Create: `src/components/student/dashboard/evaluation-list-card.tsx`
- Modify: `src/app/(app)/student/dashboard/page.tsx`

- [ ] **Step 1: Create Evaluation List Card**
- [ ] **Step 2: Add Active List to Dashboard**
- [ ] **Step 3: Commit**

### Task 4: Hybrid Evaluation Wizard Page

**Files:**
- Create: `src/app/(app)/student/evaluations/[id]/page.tsx`
- Create: `src/components/student/evaluations/wizard-shell.tsx`

- [ ] **Step 1: Create Evaluation Wizard Shell**
- [ ] **Step 2: Create Mock Evaluation Page**
- [ ] **Step 3: Commit**

### Task 5: Final Review Modal & Submission Success

**Files:**
- Create: `src/components/student/evaluations/review-modal.tsx`
- Modify: `src/components/student/evaluations/wizard-shell.tsx`

- [ ] **Step 1: Create Review Modal**
- [ ] **Step 2: Connect Modal to Wizard Shell**
- [ ] **Step 3: Commit**
