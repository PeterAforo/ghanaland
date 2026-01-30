# WINDSURF AUDIT + COMPLETION PROMPT — Ghana Lands Project

## Role
Act as a **Principal Product Engineer + UX Systems Auditor** for the Ghana Lands Project.  
Your job is to **audit, fix, and finish** the project so it is consistent, complete, and logically usable across all roles and modules.

You must follow these governance documents as source of truth:
- `docs/design-system.md`
- `docs/ui.rules.json`
- `docs/motion.rules.json`
- `docs/ux.flows.md`
- `docs/api.conventions.md`
- `docs/naming.rules.md`
- `docs/folder-structure.md`
- `docs/architecture.md`

If any of these files are missing, create them first using the canonical content already agreed.

---

## Goals (Must Complete All)
### 1) UI Consistency Audit + Fix
Run a full UI consistency audit across `apps/web` and fix violations.

#### What to check
- **Token usage:** no raw hex/rgb/hsl in components; no inline typography styles
- **Design system compliance:** Buttons/Cards/Badges/Dialogs match approved variants
- **Component reuse:** no page-local UI libraries; shared components must live in `apps/web/components/**`
- **State handling:** every page defines loading/empty/error/success states
- **Dark mode:** ensure bg/text/border/hover/disabled states are readable in dark mode
- **Accessibility:** icon-only buttons must have `aria-label` or `sr-only` text
- **Motion compliance:** GSAP/Lenis imports only in motion directories; durations/translate/scale follow rules; reduced motion respected

#### Output requirements
- Produce a `UI_AUDIT_REPORT.md` in `/docs` with:
  - list of violations found (file path + issue)
  - fixes applied
  - remaining known issues (if any) with reasons
- Apply all fixes directly in code (not suggestions only).

---

### 2) Feature Completeness Audit + Finish Work
Scan the entire repo and identify **any feature/module that is incomplete** (not wired end-to-end, missing UI states, missing API, missing worker, placeholder TODOs, dead routes, stub pages).

#### What counts as incomplete
- UI exists but API endpoint missing
- API exists but UI doesn’t call it
- page has blank return / no empty/error/loading state
- workflows stop at a dead end (no next action)
- forms not validated (missing Zod schema)
- actions missing RBAC checks (UI only / API missing guards)
- payments/verifications lacking idempotency or audit logs
- missing search indexing or job wiring for listings updates
- missing documents upload completion path
- TODO/HACK/TEMP markers in production code

#### Output requirements
- Produce `FEATURE_COMPLETENESS_REPORT.md` in `/docs` with:
  - module-by-module completion status (✅ complete / ⚠ partial / ❌ missing)
  - what was missing
  - what you implemented to complete it
- Then **complete each missing part** so every module is end-to-end functional.

---

### 3) Workflow Logic Audit (Modules + User Categories)
Validate that workflows make sense for every user category and module, using `docs/ux.flows.md` as canonical.

#### User categories to test
- Guest
- Buyer
- Seller
- Agent/Facilitator
- Professional (architect/surveyor/legal)
- Admin (Ops)
- Verifier
- Finance

#### Modules to validate
- Auth / Onboarding
- Listings (create, publish, search, detail)
- Verification (request, timeline, approve/reject)
- Payments / Escrow (initiate, callback, receipts, status)
- Documents (upload, attach, download access control)
- Permits (submit, status timeline, requests for info)
- Marketplace (browse professionals, request service, milestone tracking)
- Admin (RBAC, audit logs, approvals)

#### What to check
- Each flow has a clear start, middle, end (no dead ends)
- Each screen shows next step and status clearly
- RBAC matches role expectations (no forbidden access)
- Error recovery exists at every critical step
- High-risk actions include confirmation + audit trail
- Verification seal is displayed only when verified status exists
- Payment flow includes “processing” state and safe return behavior

#### Output requirements
- Produce `WORKFLOW_AUDIT_REPORT.md` in `/docs` with:
  - workflow-by-role matrix (role → accessible modules → key actions)
  - workflow issues found
  - corrections implemented
- Apply fixes directly in UI routes, guards, navigation, and API permissions.

---

## Implementation Rules
1. **Do not introduce new UI patterns** unless you also update `docs/design-system.md` + ADR.
2. **Do not create new component variants** outside approved ones.
3. **No partial snippets**: implement complete working code paths.
4. **No hardcoded bypasses** for RBAC, payments, verification, or state.
5. **Use the response envelope** `{ success, data, meta, error }` for all API responses.
6. **All side effects go through queues** where already architected (notifications, exports, indexing, verification checks).
7. **Add/update tests minimally** for the most critical flows (auth, create listing, payment callback, verification decision).

---

## Execution Plan (Do This In Order)
1. Run doc presence check; ensure governance docs exist.
2. Run UI audit; fix token/typography/component/state/dark mode/a11y issues; write `UI_AUDIT_REPORT.md`.
3. Run feature completeness scan; complete missing features end-to-end; write `FEATURE_COMPLETENESS_REPORT.md`.
4. Run workflow audit by role/module; fix dead ends, RBAC mismatches, unclear states; write `WORKFLOW_AUDIT_REPORT.md`.
5. Final sanity pass:
   - `docker compose up` works
   - Swagger loads
   - Web loads dashboard + protected routes
   - Create listing triggers search indexing job
   - Verification flow shows timeline and seal only when verified
   - Payment callback updates status and creates receipt/notifications

---

## Definition of Done (Hard Acceptance Criteria)
The project passes when:
- UI is consistent with the design system and rules (no raw colors/inline typography)
- Every module is end-to-end usable (UI ↔ API ↔ DB/Workers where applicable)
- Workflows are coherent for all user categories (no dead ends, correct permissions)
- All critical actions have confirmation + audit logging
- Dark mode readability is fixed across the app
- Reports are written in `/docs` and reflect actual code changes
