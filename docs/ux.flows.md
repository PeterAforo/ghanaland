# UX Flows — Ghana Lands Project
Version: 1.0.0  
Owner: Product Engineering  
Status: Active  
Applies to: `apps/web` (UI flows) + `apps/api` (workflow state)

---

## Purpose
This document defines the approved UX flow patterns and the exact process rules for major journeys in the Ghana Lands Project. It is designed to:
- Keep user experiences consistent across modules
- Reduce cognitive load and errors
- Improve trust for verification and payments
- Ensure UI states map to real backend states

---

## Non-Negotiable UX Rules
1. **One flow pattern per flow type.** Creation flows default to **Stepper** unless explicitly approved otherwise.
2. **State visibility is mandatory.** Every flow must show: current step/status, next action, and recovery path.
3. **Actions must be explicit.** Max 1 primary action per view; destructive actions require confirmation.
4. **UI must not invent states.** Every UI state must map to a backend status or derived state.
5. **All flows must handle:** loading, empty, error, success.
6. **Trust cues are mandatory** for high-risk actions (verification, escrow, installment payments).

---

## Flow Pattern Library (Approved Patterns Only)

### Pattern A — Stepper (Default for Create/Submit)
Use for:
- Create Listing
- Permit Submission
- Verification Request
- Onboarding for sellers/agents

Structure:
- Steps visible at top (desktop) and in a compact header (mobile)
- Each step has validation
- Navigation: Next / Back
- Final step: Review → Submit

Required stepper features:
- Current step indicator
- Completed steps indicator
- Error state per step (where validation fails)
- Save draft (where relevant)

---

### Pattern B — Wizard (Guided Blocks)
Use for:
- Guided onboarding
- Assisted configuration (e.g., setting up a seller profile)
- Complex multi-input tasks where stepper is too rigid

Wizard rules:
- Still must expose progress
- Still must validate incrementally
- Must include Review step before final submission

---

### Pattern C — Review → Confirm → Submit
Use for:
- Payments (escrow deposit, installment)
- Approvals (verification approval/rejection)
- Escrow release/dispute resolution
- Publishing listings (final confirmation)

Rules:
- Review screen must show full summary
- Confirm requires explicit acknowledgement
- Submit triggers backend action with visible “processing” state

---

## Global Interaction Rules

### Action Hierarchy
Per view:
- **1 Primary action** maximum
- **1 Secondary action** maximum
- Destructive actions must be visually separated and confirmed

### Confirmations
Required for:
- Delete listing
- Reject verification
- Revoke access/roles
- Cancel payments
- Release escrow
- Final submit steps

Confirmation UI must include:
- What will happen
- Irreversibility note (if applicable)
- Primary confirm + secondary cancel

### Error Recovery
Errors must always provide:
- A human readable message
- A next step (“Try again”, “Contact support”, “Check details”)
- Optional request ID / reference code for support

### Loading & Background Processing
If backend processing is asynchronous (queues):
- Show “Processing” status
- Show progress indicator where feasible
- Do not allow duplicate submissions (idempotency)
- Provide “You can safely leave this page” if task continues in background

### Micro-Reassurance Copy (Required Zones)
- Payments: “Secure payment via Hubtel”
- Verification: “Verification status is logged and auditable”
- Uploads: “Files are stored securely; access is controlled”

---

## Roles & Journeys (High Level)
User types:
- Guest
- Buyer
- Seller
- Agent / Facilitator
- Professional (architect, surveyor, legal, etc.)
- Admin (operations)
- Verifier (Land Commission / internal verification)
- Finance (escrow/payment oversight)

All journeys must enforce RBAC for:
- Navigation visibility
- Route protection
- API authorization (never UI-only)

---

# Core UX Flows (Canonical)

## Flow 1 — Guest → Buyer / Seller Onboarding
**Pattern:** Wizard  
**Objective:** Convert guest into verified buyer/seller profile with minimal friction.

### Steps
1. Choose role: Buyer or Seller (or both)
2. Account creation (email/phone + password)
3. Profile basics (name, location, contact preference)
4. Identity verification (optional now; required for sensitive actions)
5. Success + next recommended actions

### Success Criteria
- User reaches dashboard with clear “next steps”
- No dead ends
- If verification is pending, user sees timeline and what’s allowed next

---

## Flow 2 — Create Land Listing
**Pattern:** Stepper (Default)  
**Objective:** Publish a complete listing with accurate geo + trust signals.

### Stepper Steps (Default)
1. **Listing Basics**
   - Title, category (residential/commercial/industrial/agriculture)
   - Land type (customary/titled/etc.)
   - Lease period (years), availability, brief description

2. **Location**
   - Region, district, town/area
   - GPS coordinates or map pin
   - Optional polygon upload/draw (if available)

3. **Pricing**
   - Price, currency
   - Payment options: outright or installment
   - Installment structure (if enabled): deposit, schedule, penalties (if applicable)

4. **Documents & Media**
   - Photos
   - Title documents/site plan uploads
   - Ownership proof (as required)

5. **Review & Publish**
   - Summary of fields
   - Verification status defaults to `unverified`
   - Confirm publish

### Backend State Mapping
- Draft: `listing_status = draft`
- Submitted/Published: `listing_status = active`
- Disabled: `listing_status = suspended` / `archived`

### Required UI Elements
- Status badge for verification (`unverified` by default)
- “Request verification” CTA after publish
- Map view on review screen

---

## Flow 3 — Listing Search (Map + List)
**Pattern:** Browse pattern + filters (not stepper)  
**Objective:** Find land quickly with trust cues.

### Components
- Search bar (location or keyword)
- Filters:
  - category
  - land type
  - lease period
  - price range
  - region/district
  - verification status (verified seal)

### Interaction Rules
- Map and list must stay synchronized
- Mobile uses bottom-sheet list pattern
- Verified listings must be clearly marked

---

## Flow 4 — Verification Request (Lands Commission / Internal)
**Pattern:** Stepper  
**Objective:** Submit documents and parcel data for verification and receive a verified seal.

### Steps
1. Select listing
2. Upload required documents
3. Confirm parcel details (map + metadata)
4. Review submission
5. Submit request

### Backend Status Timeline
- `pending` → `in_review` → (`verified` | `rejected`)
- Each transition logs an audit event

### Required UI
- Verification timeline component
- Status badge + timestamp
- “What happens next” copy
- Rejection must show reasons + resubmission path

---

## Flow 5 — Buyer Escrow Payment / Installment
**Pattern:** Review → Confirm → Submit  
**Objective:** Pay securely and see clear payment status and receipts.

### Steps
1. Review purchase terms
   - listing price
   - escrow amount
   - fees
   - installment plan (if enabled)
2. Confirm
   - explicit consent checkbox for terms
   - reassurance: “Secure payment via Hubtel”
3. Submit payment
   - show processing
   - show success receipt
   - store downloadable receipt

### Backend States
- `payment_status = initiated`
- `processing`
- `completed`
- `failed`
- `reversed` (if applicable)

### Required UI
- Payment timeline / status component
- Receipt download
- Reference code for support

---

## Flow 6 — Professional Services Marketplace (Agents, Architects, Surveyors, Legal)
**Pattern:** Browse → Request → Review → Confirm  
**Objective:** Hire a verified professional to handle permits, documentation, or services.

### Steps
1. Browse professionals
2. View profile + verification + ratings
3. Request service (scope, timeline, documents)
4. Review quote (if quoting)
5. Confirm engagement
6. Status tracking (milestones, deliverables)

### Required UI
- Professional verification badge
- Milestones timeline
- Deliverables upload/download area
- Dispute escalation path

---

## Flow 7 — Permit Processing
**Pattern:** Stepper  
**Objective:** Assemble and submit permit documentation with traceability.

### Steps
1. Applicant details
2. Property/land details
3. Documents upload
4. Review
5. Submit

### Status Timeline
- `draft` → `submitted` → `in_review` → (`approved` | `rejected` | `needs_more_info`)

### Required UI
- Timeline
- Request for more info workflow (upload + resubmit)
- Downloadable submission bundle (PDF)

---

## Flow 8 — Admin: RBAC + Audit + Enforcement
**Pattern:** Standard admin tables + Confirm for destructive actions  
**Objective:** Maintain governance and traceability.

### Admin Views Must Include
- Users table (filters + pagination)
- Roles and permissions management
- Audit logs (append-only view)
- Verification decisions
- Escrow oversight

### Critical UX Rules
- All destructive actions require confirmation
- All approvals/rejections must record:
  - reason
  - timestamp
  - actor
  - reference ID

---

# Shared Components Required by Flows
- `Stepper`
- `Timeline`
- `VerificationSealBadge`
- `StatusBadge`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `ConfirmDialog`
- `Toast`

---

# UI States (Mandatory Per Flow)
Every flow screen must define these states explicitly:
1. Loading
2. Empty (no data)
3. Error (with recovery)
4. Success (confirmation + next steps)

---

# Acceptance Criteria
A flow is compliant only if:
- It uses an approved pattern
- It maps UI states to backend states
- It shows progress/status visibly
- It enforces action hierarchy
- It provides confirmation for destructive actions
- It includes micro-reassurance for payments/verification/uploads
- It supports mobile responsiveness and dark mode

---

## Change Log / Decisions (ADR)
### ADR-001 — Default Create/Submit Flow Pattern
- Problem: inconsistent multi-step forms reduce trust and increase user error.
- Decision: standardize create/submit flows on Stepper (Pattern A).
- Alternatives: wizard-only; single-page forms.
- Consequences: faster reuse, less drift, improved user confidence.
- Date: 2026-01-25
- Owner: Product Engineering
