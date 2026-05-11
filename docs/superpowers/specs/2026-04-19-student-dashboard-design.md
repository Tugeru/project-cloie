# Student Dashboard & Evaluation System Design

**Date:** 2026-04-19
**Status:** Approved
**Topic:** Frontend implementation of the student respondent experience, including PWA features, dashboard layout, and a hybrid sectioned-wizard evaluation form.

## 1. Objective
Build a responsive, "native-feel" PWA for students that prioritizes evaluation tasks. The system must support device-aware layouts (Desktop sidebar vs. Mobile bottom nav) and a multi-step evaluation process with a final review stage.

## 2. Architecture & Navigation

### Global Layout (PWA Responsive)
- **Desktop (>1024px)**: Fixed 264px Sidebar (Left) + Top Header (Sticky).
- **Tablet (768px-1024px)**: Collapsible Sidebar (Drawer) + Top Header.
- **Mobile (<768px)**: Bottom Navigation Bar + Top Header (Sticky).

### Page Mapping
- `/student/dashboard`: Action center with hero card, stats, and active lists.
- `/student/evaluations`: Tabbed view (Active, In Progress, Submitted, Closed).
- `/student/history`: Searchable list of all past submissions with receipt access.
- `/student/profile`: Minimal academic context and account settings.
- `/student/evaluations/[id]`: The evaluation workspace (Hybrid Wizard).

## 3. Evaluation Form: "Sectioned Wizard"
The form follows a hybrid approach to balance focus and efficiency.

### Step-by-Step Flow
1. **Section Views**: Each "step" in the wizard represents one logical Section (e.g., "Section B: CILO Evaluation").
2. **Page Scroll**: All questions belonging to the current section are displayed in a single scrollable list.
3. **Controls**:
   - **Sticky Header**: Shows Form Title, Progress Bar, and "Save Draft" indicator.
   - **Sticky Footer**: Contains `[Previous]`, `[Save Draft]`, and `[Next]`.
   - **Terminal Step**: On the last section, the `[Next]` button label changes to `[Confirm & Review]`.

### Review & Submission
1. **The Review Modal**: Triggered by "Confirm & Review".
2. **Full Summary**: Displays every question and the user's answer in a read-only, categorized list.
3. **Final Action**: A `[Submit Evaluation]` button at the bottom of the modal.
4. **Post-Submission**: Automatic transition to a Success/Receipt state with a unique Reference ID.

## 4. Components & Visual Style
- **Identity Hero Card**: High-contrast (Primary Blue) card with student classification details.
- **Stat Cards**: 3-column grid (Pending, In Progress, Completed).
- **Evaluation Cards**: Interactive cards with status badges (Not Started, In Progress, Due Soon).
- **Form Controls**: 
  - **Likert Group**: Custom radio button groups for 1-4 and 1-5 scales.
  - **Qualitative**: Textareas with auto-resize and character counts.
- **PWA Install**: A functional "Install App" button in the Topbar/Sidebar that triggers the browser's PWA installation prompt.

## 5. Mock Data Strategy
- **Instruments**: CILO Evaluation, Alumni Survey, Exit Survey, Industry Internship.
- **States**: Empty states for every section, loading skeletons, and varied badge counts.

## 6. Implementation Principles
- **Clean Code**: Reusable `EvaluationCard`, `StatusBadge`, and `WizardStep` components.
- **UX Guardrails**: No administrative or LMS-like features; strict focus on evaluation tasks.
- **PWA Support**: Responsive design verified for touch targets (44px min).
