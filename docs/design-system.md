# Design System — Ghana Lands Project
Version: 1.0.0  
Owner: Product Engineering  
Status: Active  
Applies to: `apps/web` (Next.js), shared UI packages

---

## Purpose
This design system defines the reusable UI primitives, patterns, and constraints required to keep the Ghana Lands Project consistent across pages, modules, and teams.

Primary goals:
- Predictable UI composition (no one-offs)
- Accessible, readable UI in light/dark modes
- Fast delivery through reusable components
- Clear rules for new patterns and changes

---

## Non-Negotiable Rules
1. **No one-off patterns.** If a pattern does not exist here, it must be added here first before use.
2. **Token-driven styling only.** No raw hex/rgb/hsl colors in components. Use theme tokens and Tailwind utility tokens.
3. **One component library.** Use `shadcn/ui` components as the base, wrapped by our own components when we need consistency.
4. **Every view must support states:** loading, empty, error, success.
5. **Dark mode is mandatory.** Every shared component must define dark mode surface/text/border behavior.

---

## Design Principles
- **Clarity over decoration:** UI should reduce ambiguity in land transactions, verification, and payments.
- **Trust & legitimacy:** emphasize verification, seals, auditability, and clear steps.
- **Progressive disclosure:** show essential fields first; advanced fields are optional/expandable.
- **Consistency of flows:** creation and submission flows must follow a defined pattern.

---

## Foundations

### Typography
Single font family across the product (configured in Next.js + Tailwind).  
Approved type scale (no arbitrary sizes):

- `text-xs`: helper text, microcopy
- `text-sm`: labels, captions
- `text-base`: body text (default)
- `text-lg`: section headers
- `text-xl`: page headers
- `text-2xl`: key metrics / hero numbers

Typography rules:
- Page title: `text-xl` or `text-2xl` (only when needed)
- Section title: `text-lg`
- Body: `text-base`
- Labels: `text-sm`
- Helper: `text-xs`
- Never set inline font styles; use classes/components only.

### Spacing & Layout
Use a consistent spacing ramp (Tailwind spacing tokens):
- Primary spacing: `2, 3, 4, 6, 8, 10, 12`
- Page padding: `p-4` (mobile), `p-6` (desktop)
- Section spacing: `space-y-6` default

Grid & max width:
- Standard content width: `max-w-6xl`
- Reading width: `max-w-3xl`
- Dashboard width: full with internal sections capped as needed

### Border Radius & Shadows
- Radius: `rounded-2xl` for cards and major containers, `rounded-xl` for inputs and modals
- Shadows: subtle only (`shadow-sm` / `shadow`), never heavy unless a modal

### Color Tokens (Semantic)
All UI colors must be expressed through semantic tokens (implemented via Tailwind theme mapping).  
Do not reference raw hex values in components.

#### Core semantic tokens
- Surfaces:
  - `bg-background`
  - `bg-surface`
  - `bg-surface-muted`
  - `bg-surface-elevated`
- Text:
  - `text-foreground`
  - `text-muted-foreground`
  - `text-subtle`
- Borders:
  - `border-border`
  - `border-muted`
- Brand/Accent:
  - `text-primary`
  - `bg-primary`
  - `ring-primary`
- Status:
  - `text-success` / `bg-success`
  - `text-warning` / `bg-warning`
  - `text-danger` / `bg-danger`
  - `text-info` / `bg-info`

#### Dark mode rule
Every shared component must explicitly use surface/text/border tokens so it inherits dark mode properly.

### Iconography
- Single icon set: `lucide-react`
- Icon sizes:
  - inline: `h-4 w-4`
  - buttons: `h-4 w-4`
  - section headers: `h-5 w-5`
  - empty states: `h-10 w-10`

### Accessibility
- All interactive elements must have:
  - focus ring (visible)
  - keyboard navigability
  - proper ARIA labels for icon-only controls
- Contrast: ensure readable text on surfaces, especially in dark mode.
- Form errors must be announced and visible.

---

## Component Library

### Component Naming
Semantic names only. Examples:
- `ListingSummaryCard`
- `VerificationSealBadge`
- `PermitSubmissionStepper`
Forbidden:
- `Card2`, `NewModal`, `TempForm`

### Required Base Components (Wrappers)
These wrap shadcn primitives and enforce tokens/variants:

1. **Button**
   - Variants (only):
     - `primary`
     - `secondary`
     - `ghost`
     - `destructive`
   - Sizes:
     - `sm`, `md`, `lg`
   - Rules:
     - Only one primary button per view (recommended).
     - Destructive always requires confirmation.

2. **Card**
   - Types (only):
     - `standard`
     - `interactive`
     - `metric`
     - `empty`
   - Rules:
     - Cards use `rounded-2xl`
     - Interactive cards include hover/focus states.

3. **Badge**
   - Types:
     - `neutral`
     - `verified`
     - `pending`
     - `rejected`
     - `warning`
   - Must be used for verification statuses.

4. **Alert / Callout**
   - Types:
     - `info`
     - `success`
     - `warning`
     - `danger`
   - Used for “trust” notices and critical process messaging.

5. **Modal / Dialog**
   - Types (only):
     - `confirm`
     - `form`
     - `info`
     - `danger`
   - Rule:
     - `danger` type is mandatory for destructive actions.
     - Must include clear primary/secondary buttons.

6. **Table**
   - Standard table styles for admin, transactions, listings.
   - Must support:
     - empty state
     - loading skeleton
     - pagination
     - row actions (with permissions)

7. **Form Controls**
   - Input, Textarea, Select, Combobox, DatePicker
   - Rules:
     - All form inputs must support:
       - label
       - helper text
       - error text
     - Validation uses Zod schemas.

8. **Stepper**
   - Mandatory for multi-step create/submit flows.
   - Shows:
     - current step
     - completed steps
     - errors per step when present

9. **Toast / Notifications**
   - Use consistent toast types: `success`, `warning`, `error`, `info`
   - No silent failures.

10. **EmptyState**
   - Standard empty state component with:
     - icon
     - title
     - description
     - optional action

11. **Loading**
   - Skeleton preferred over spinners for content areas.
   - Spinners allowed only for small inline actions.

---

## UX Patterns (Approved)

### Creation & Submission Flows (Only)
All create/submit processes must use one of:

1. **Stepper**
   - Example: Create Listing, Permit Application, Verification Request

2. **Wizard**
   - Similar to stepper but with guided content blocks

3. **Review → Confirm → Submit**
   - Example: Payments, Escrow release, Rejection actions

Rule: If one module uses Stepper for creation, all other creation flows should default to Stepper unless explicitly approved.

### State Visibility
Every flow must show:
- current status
- what happens next
- whether a background job is running
- how to recover from error

### Action Hierarchy
Per view:
- Max 1 primary action
- Max 1 secondary action
- Destructive actions separated and confirmed

---

## Domain UI Standards (Ghana Lands)

### Verification Seal
A verified listing must display:
- `VerificationSealBadge` (verified)
- “Verified at Lands Commission” (or equivalent) copy
- timestamp (verified date)
- verifier entity (where applicable)

Statuses:
- `unverified`
- `pending`
- `verified`
- `rejected`

### Listings (Cards + Detail)
Listing card must include:
- location (region/district)
- land category: residential/commercial/industrial/agriculture
- land type: customary/titled/etc.
- lease period
- price + currency
- verification status badge

### Payments / Escrow
Payment UI must show:
- amount breakdown (fees, escrow, tax if applicable)
- status timeline
- receipts/documents
- next action and deadlines (if any)

### Permit Processing
Permit UI must follow stepper:
- Applicant details
- Land/Property details
- Document uploads
- Review
- Submit

---

## Map UI Standards
Map is a first-class surface and must be consistent:

### Map Views
- Search map: cluster + list sync
- Listing detail map: single marker/polygon
- Verification map: polygon overlay + boundary tools (as required)

### Map UI Rules
- Map always has:
  - legend (status badges)
  - filter drawer/panel (on desktop)
  - bottom sheet list (on mobile)
- Polygon/parcel overlays must show:
  - outline
  - hover highlight
  - selected state

---

## Content & Microcopy
Tone:
- Formal, clear, trust-building.
- Avoid slang.
- Use action-oriented microcopy.

Standard CTA verbs:
- Create, Submit, Review, Confirm, Verify, Pay, Download, Request Support

Reassurance copy required near critical CTAs:
- Payments: “Secure payment via Hubtel”
- Verification: “Verification status is logged and auditable”
- Uploads: “Files are stored securely; access is controlled”

---

## Engineering Integration Rules (UI)
- Use shared Zod schemas where possible (`packages/shared`).
- No direct fetch calls in components; use API client + TanStack Query hooks.
- No raw endpoints scattered in UI; use centralized API routes.
- RBAC affects:
  - navigation visibility
  - route protection
  - button enable/disable
  - server enforcement (never UI-only)

---

## Motion System (References)
All motion must use shared utilities defined in:
- `apps/web/lib/motion/*` or `apps/web/motion/*`

Allowed motion types:
- entrance (fade + translate ≤ 12px)
- state change (opacity / scale 0.98–1)
- progress (step transitions, loaders)
- feedback (success/error)

Duration constraint:
- 0.2s–0.6s standard

Forbidden:
- infinite loops (except loaders)
- decoration-only parallax
- motion without state meaning

---

## Change Log
All deviations, new patterns, or new component types require a recorded decision.

### Decisions / ADR
- ADR entries must include:
  1. Problem
  2. Decision
  3. Alternatives considered
  4. Consequences
  5. Date + owner

#### ADR Template
- **ADR-### Title**
  - Problem:
  - Decision:
  - Alternatives:
  - Consequences:
  - Date:
  - Owner:

---

## Appendix: Required Screens (Baseline)
Every module page must define:
- Loading state
- Empty state
- Error state
- Success state
- RBAC gating behavior

Minimum baseline pages:
- Listings search (map + list)
- Listing detail
- Create listing (stepper)
- Verification request + timeline
- Payments/escrow view
- Permit submission (stepper)
- Admin tables (users, roles, audit logs)

---
