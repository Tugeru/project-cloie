# CLOIE Design System

A formal design system for CLOIE (System for Comprehensive Learning Outcomes and Instructional Evaluation) — an academic evaluation platform for Assumption College of Davao.

## 1. Product Context

**Product Type:** Institutional SaaS / Academic Evaluation Platform  
**Target Users:** Students, Faculty, Program Heads, Deans, Alumni, Industry Partners, Administrators  
**Brand Identity:** Professional, trustworthy, institutional, academic, clear, accessible  
**Tech Stack:** Next.js (App Router), Tailwind CSS, shadcn/ui, Prisma, Supabase

---

## 2. Pattern: Institutional Dashboard

**Pattern Name:** Institutional Dashboard  
**Adapted From:** Minimal Single Column + Flat Design hybrid

### Layout Principles
- **Single-page focus:** Primary action per screen (evaluate, review, submit)
- **Role-aware navigation:** Different sidebar/nav items per user role
- **Information hierarchy:** Academic context first (program, course, year level), then actions
- **Whitespace:** Generous spacing (24px–48px sections) to reduce cognitive load
- **Mobile-first:** Bottom nav for mobile, sidebar for desktop (≥1024px)

### Page Structure (General)
1. **Header:** Logo + Role indicator + User menu (logout)
2. **Navigation:** Role-specific sidebar/bottom nav
3. **Content Area:**
   - Page title + context (program, course, academic year)
   - Primary action button
   - Data table / cards / forms
   - Empty states with helpful guidance
4. **Footer:** Minimal institutional footer (optional)

---

## 3. Style: Flat + Institutional

**Style Name:** Flat Institutional  
**Keywords:** Clean, minimal, trustworthy, no gradients, clear hierarchy, accessible  
**Philosophy:** Academic tools should fade into the background; content (evaluations, data) is the focus.

### Visual Principles
- **No gradients:** Pure flat colors only
- **Minimal shadows:** Use 1px borders for separation; shadows only for modals/dropdowns
- **Clean lines:** Simple geometric shapes
- **Typography-focused:** Let text hierarchy drive the design
- **Icon consistency:** Single icon set (Lucide) throughout

---

## 4. Color System

### Primary Palette (Aligned with CLOIE Brand)

| Role | Hex | Usage |
|------|-----|-------|
| **Primary** | `#2563EB` | Main brand blue. Buttons, links, active states, highlights |
| **Primary Hover** | `#1D4ED8` | Button hover, link hover |
| **Primary Soft** | `#EFF6FF` | Subtle backgrounds, badges, icon backgrounds |
| **Secondary** | `#3B82F6` | Secondary actions, accents |
| **CTA Success** | `#22C55E` | Success states, submitted status, positive actions |
| **CTA Warning** | `#F59E0B` | Warnings, draft status, pending actions |
| **CTA Danger** | `#EF4444` | Errors, destructive actions (delete, remove) |

### Neutral Palette

| Role | Hex | Usage |
|------|-----|-------|
| **Background** | `#FFFFFF` | Main page background |
| **Surface** | `#F8FAFC` | Cards, elevated surfaces |
| **Surface Muted** | `#F1F5F9` | Secondary backgrounds, alternating rows |
| **Border** | `#E2E8F0` | Dividers, card borders, input borders |
| **Border Light** | `#F1F5F9` | Subtle separators |
| **Text Primary** | `#0F172A` | Headings, primary text (slate-900) |
| **Text Secondary** | `#475569` | Body text, descriptions (slate-600) |
| **Text Muted** | `#94A3B8` | Placeholders, disabled text (slate-400) |
| **Text On Dark** | `#FFFFFF` | Text on primary/CTA backgrounds |

### Semantic Colors

| State | Color | Usage |
|-------|-------|-------|
| **Active/Selected** | `primary` | Active nav items, selected tabs |
| **Hover** | `primary-hover` | Interactive element hover |
| **Focus** | `primary` ring | Input focus, button focus (2px ring) |
| **Disabled** | `text-muted` + opacity | Non-interactive elements |
| **Success** | `#22C55E` | Completed evaluations, success messages |
| **Warning** | `#F59E0B` | Drafts, pending, requires attention |
| **Error** | `#EF4444` | Validation errors, failures |
| **Info** | `#3B82F6` | Informational messages, tips |

---

## 5. Typography System

### Font Stack

**Heading Font:** `Inter` (or system sans-serif)  
**Body Font:** `Inter` (or system sans-serif)  
**Monospace:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`

**Rationale:** CLOIE already uses Tailwind's default Inter/system stack. This is optimal for:
- Cross-platform consistency
- No external font loading overhead
- Excellent readability at all sizes
- Professional, neutral appearance

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `display-lg` | 48px / 3rem | 1.1 | 700 (bold) | Hero headlines (landing page) |
| `display-md` | 36px / 2.25rem | 1.2 | 700 | Page titles, major sections |
| `display-sm` | 30px / 1.875rem | 1.2 | 600 | Modal titles, important cards |
| `heading-xl` | 24px / 1.5rem | 1.3 | 600 | Section headings |
| `heading-lg` | 20px / 1.25rem | 1.3 | 600 | Card titles, subsections |
| `heading-md` | 18px / 1.125rem | 1.4 | 600 | Form section titles |
| `heading-sm` | 16px / 1rem | 1.4 | 600 | Small headings, labels |
| `title-lg` | 18px / 1.125rem | 1.5 | 500 | Important labels |
| `title-md` | 16px / 1rem | 1.5 | 500 | Emphasized text |
| `title-sm` | 14px / 0.875rem | 1.5 | 500 | Card headers, list items |
| `body-lg` | 18px / 1.125rem | 1.6 | 400 | Intro paragraphs |
| `body-md` | 16px / 1rem | 1.6 | 400 | Standard body text |
| `body-sm` | 14px / 0.875rem | 1.5 | 400 | Secondary text, descriptions |
| `label-lg` | 16px / 1rem | 1.4 | 500 | Button text, nav items |
| `label-md` | 14px / 0.875rem | 1.4 | 500 | Labels, badges |
| `label-sm` | 12px / 0.75rem | 1.4 | 500 | Tags, small labels |
| `caption` | 12px / 0.75rem | 1.4 | 400 | Metadata, timestamps |

### Typography Rules

1. **Minimum body size:** 14px (`body-sm`) — never smaller
2. **Line length:** Max 75 characters per line for readability
3. **Contrast:** Body text 4.5:1 minimum, headings 3:1 minimum
4. **All caps:** Use sparingly; only for short labels (≤3 words) with `tracking-wider`
5. **Font weights:** Use 400 (normal), 500 (medium), 600 (semibold), 700 (bold) only

---

## 6. Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing, icon padding |
| `space-2` | 8px | Inline elements, tight gaps |
| `space-3` | 12px | Small gaps, icon + text |
| `space-4` | 16px | Standard padding, card gutters |
| `space-5` | 20px | Medium spacing |
| `space-6` | 24px | Section padding, card padding |
| `space-8` | 32px | Large gaps, section separators |
| `space-10` | 40px | Major section margins |
| `space-12` | 48px | Page section spacing |
| `space-16` | 64px | Large section breaks |

### Spacing Rules

1. **Component padding:** `16px–24px` (space-4 to space-6)
2. **Card internal padding:** `20px–24px`
3. **Section margins:** `32px–48px`
4. **Page max-width:** `1280px` (max-w-7xl)
5. **Grid gaps:** `16px–24px`

---

## 7. Component Guidelines

### Buttons

**Primary Button:**
- Background: `primary` (#2563EB)
- Text: `text-on-dark` (white)
- Padding: `12px 24px` (h-12)
- Border-radius: `8px` (rounded-lg)
- Font: `label-lg` (16px, medium)
- Hover: `primary-hover` (#1D4ED8)
- Focus: `primary` ring-2 ring-offset-2

**Secondary Button (Outline):**
- Background: transparent
- Border: 1px `border`
- Text: `text-primary`
- Hover: `surface-muted` background

**Ghost Button:**
- Background: transparent
- Text: `text-secondary`
- Hover: `surface-muted`

**Destructive Button:**
- Background: `danger` (#EF4444)
- Text: white
- Hover: darker red (#DC2626)

### Cards

- Background: `surface` (#F8FAFC) or white
- Border: 1px `border` (#E2E8F0)
- Border-radius: `12px` (rounded-xl) or `16px` (rounded-2xl)
- Padding: `20px–24px`
- Shadow: none (flat design) or `shadow-sm` for elevation

### Forms / Inputs

- Background: white
- Border: 1px `border`, 1px `border-hover` on focus
- Border-radius: `8px` (rounded-lg)
- Padding: `12px 16px`
- Font: `body-md`
- Focus: `primary` ring-2
- Error: `danger` border + error text below
- Label: `label-md` above input

### Tables

- Header: `surface-muted` background
- Row border: 1px `border-light`
- Row hover: `surface-muted`
- Padding: `12px 16px` per cell
- Font: `body-sm` for data
- Striped rows: alternate `surface` and white

### Navigation

**Sidebar (Desktop ≥1024px):**
- Width: `240px`
- Background: white or `surface`
- Border: 1px right `border`
- Active item: `primary-soft` background + `primary` text + left border accent
- Inactive: `text-secondary`
- Hover: `surface-muted`

**Bottom Nav (Mobile <1024px):**
- Height: `64px`
- Background: white
- Border: 1px top `border`
- 3–5 items max
- Active: `primary` icon + label
- Labels always visible (not icon-only)

### Badges / Tags

- Small rounded pills
- Padding: `4px 12px`
- Font: `label-sm`
- Variants:
  - Primary: `primary-soft` bg + `primary` text
  - Success: green soft bg + green text
  - Warning: amber soft bg + amber text
  - Danger: red soft bg + red text
  - Neutral: `surface-muted` + `text-secondary`

### Modals / Dialogs

- Background: white
- Border-radius: `16px` (rounded-2xl)
- Shadow: `shadow-xl` (elevated)
- Padding: `24px–32px`
- Overlay: `bg-black/50` backdrop-blur-sm
- Max-width: `520px` (md), `640px` (lg)

---

## 8. Effects & Motion

### Shadows (Minimal Use)

| Token | Shadow | Usage |
|-------|--------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation, cards |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Dropdowns, popovers |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dialogs |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | Full-screen overlays |

### Animation

**Timing:**
- Micro-interactions: `150ms`
- Standard transitions: `200ms`
- Complex animations: `300ms`
- Easing: `ease-out` for enter, `ease-in` for exit

**Rules:**
1. Use `transform` and `opacity` only (no width/height animations)
2. Animate from `opacity-0` to `opacity-1` for fades
3. Use `translate-y` for slide-in effects
4. Respect `prefers-reduced-motion` — disable animations if set
5. No decorative-only animations; every motion must have purpose

---

## 9. Accessibility Requirements

### Contrast

- Normal text: **4.5:1 minimum** (WCAG AA)
- Large text (18px+): **3:1 minimum**
- Interactive elements: **3:1 minimum** against adjacent colors

### Focus States

- All interactive elements must have visible focus
- Focus ring: `2px solid primary` with `2px offset`
- Never remove focus rings without replacement

### Touch Targets

- Minimum: **44×44px** (iOS) / **48×48dp** (Android)
- Spacing between targets: **8px minimum**

### Screen Readers

- All icons have `aria-label` or `aria-hidden`
- Form inputs have associated `<label>`
- Error messages linked via `aria-describedby`
- Page titles change on navigation

### Semantic HTML

- Use correct heading hierarchy (`h1` → `h2` → `h3`)
- Use `<button>` for actions, `<a>` for navigation
- Use `<nav>`, `<main>`, `<aside>` for landmarks

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| `sm` | 640px | Minor adjustments |
| `md` | 768px | Sidebar appears, tables expand |
| `lg` | 1024px | Full desktop layout, sidebar persistent |
| `xl` | 1280px | Max container width reached |
| `2xl` | 1536px | Extra-wide adjustments |

### Mobile-First Approach

1. Design for 375px first
2. Stack all content vertically
3. Use bottom nav instead of sidebar
4. Full-width buttons
5. Touch-friendly spacing (min 44px targets)

---

## 11. Anti-Patterns to Avoid

### Visual
- ❌ Gradients on backgrounds
- ❌ Heavy shadows on cards
- ❌ Emoji as icons
- ❌ Decorative animations without purpose
- ❌ Low-contrast text (< 4.5:1)
- ❌ Text smaller than 14px

### Interaction
- ❌ Hover-only interactions (no mobile equivalent)
- ❌ Instant state changes (no transition)
- ❌ Disabled buttons without explanation
- ❌ Icon-only buttons without labels (except universally understood icons)

### Layout
- ❌ Horizontal scrolling on mobile
- ❌ Fixed pixel widths that break responsiveness
- ❌ Content hidden behind fixed headers without padding
- ❌ Touch targets smaller than 44px

---

## 12. Implementation Notes

### Tailwind Configuration

The project already uses Tailwind with custom tokens in:
- `src/styles/tokens.css`
- `tailwind.config.ts` (if exists)

Ensure these tokens map to the design system values above.

### shadcn/ui Components

CLOIE uses shadcn/ui. Customize via:
- `src/components/ui/` — component overrides
- `globals.css` — CSS variables for theming

### Icons

Use **Lucide React** exclusively:
```tsx
import { IconName } from "lucide-react";
```

Never use emoji as icons.

---

## 13. Pre-Delivery Checklist

Before shipping UI changes:

- [ ] No emojis as icons (Lucide only)
- [ ] All interactive elements have cursor-pointer
- [ ] Hover states with 150–300ms transitions
- [ ] Light mode contrast 4.5:1 verified
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive tested: 375px, 768px, 1024px, 1440px
- [ ] Touch targets ≥44px
- [ ] Safe areas respected (notch, gesture bar)
- [ ] No horizontal scroll on mobile
- [ ] Form labels present, errors near fields

---

## 14. Summary

CLOIE's design system prioritizes:
1. **Clarity** — Academic users need clear information hierarchy
2. **Trust** — Institutional platform requires professional, trustworthy aesthetics
3. **Accessibility** — Education tools must be usable by everyone
4. **Simplicity** — Flat design without gradients keeps focus on content
5. **Responsiveness** — Mobile-first for students, desktop-optimized for faculty

**Key Principles:**
- Blue (#2563EB) as primary institutional color
- Flat, no gradients
- Inter/system font stack
- 4px spacing system
- Lucide icons only
- WCAG AA accessibility minimum
