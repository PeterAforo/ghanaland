# Naming Rules — Ghana Lands Project
Version: 1.0.0  
Owner: Product Engineering  
Status: Active  
Applies to: `apps/web`, `apps/api`, `apps/workers`, `packages/*`, `prisma/*`

---

## Purpose
This document defines naming conventions to ensure:
- Consistent, searchable code
- Predictable folder structure
- Low friction onboarding
- Clean API contracts and DB schemas
- Minimal refactor churn as the project scales

These rules are binding. Deviations require an ADR entry.

---

## Global Naming Principles (Non-Negotiable)
1. **Semantic over generic.** Names must describe the domain intent.
2. **Consistency over creativity.** Prefer predictable patterns.
3. **No temporary names.** `Temp*`, `Test*`, `New*`, `Card2` are forbidden.
4. **Match domain language.** Use agreed terms: `listing`, `verificationRequest`, `escrow`, `permit`, `tenant`, `org`.
5. **Avoid abbreviations** unless they are standard domain terms (`RBAC`, `JWT`, `GIS`, `API`, `ID`).

---

## Case Conventions (By Context)

### Files and Folders
- **kebab-case** for files and folders:
  - `listing-summary-card.tsx`
  - `verification-seal-badge.tsx`
  - `payment-status-timeline.tsx`

Exceptions (framework-required):
- Next.js route files:
  - `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- Config files:
  - `tailwind.config.ts`, `next.config.js`, etc.

### React Components
- **PascalCase**:
  - `ListingSummaryCard`
  - `VerificationSealBadge`
  - `PermitSubmissionStepper`

### TypeScript Variables, Functions, Methods
- **camelCase**:
  - `createListing()`
  - `getVerificationStatus()`
  - `formatCurrency()`

### Constants
- **SCREAMING_SNAKE_CASE**:
  - `DEFAULT_PAGE_SIZE`
  - `MAX_UPLOAD_SIZE_MB`
  - `ALLOWED_DOCUMENT_TYPES`

### Types / Interfaces / Enums
- **PascalCase**:
  - `Listing`
  - `VerificationRequest`
  - `PaymentStatus`
  - `UserRole`

Enum members:
- Prefer **SCREAMING_SNAKE_CASE** in backend, and map to camelCase on the client if needed:
  - `PENDING_REVIEW`, `VERIFIED`, `REJECTED`

---

## Web App (`apps/web`) Naming

### Component Files
- File name: kebab-case
- Component name: PascalCase matching file intent

Example:
- `components/listing-summary-card.tsx` exports `ListingSummaryCard`

### Route Segments (Next.js App Router)
- Route folders: kebab-case
  - `app/listings/[listing-id]/page.tsx`
  - `app/admin/audit-logs/page.tsx`

Dynamic params:
- Prefer descriptive param names:
  - `[listing-id]`, `[verification-request-id]`, `[payment-id]`
- Avoid generic `[id]` unless truly generic.

### Hooks
- File: `use-<thing>.ts`
- Function: `useThing()`

Examples:
- `use-listings.ts` → `useListings()`
- `use-verification-timeline.ts` → `useVerificationTimeline()`

### API Client
- File: kebab-case per resource:
  - `listings.api.ts`
  - `payments.api.ts`

Method names:
- `getListings`, `getListingById`, `createListing`, `updateListing`, `publishListing`

---

## API (`apps/api`) Naming (NestJS)

### Modules
- Folder: kebab-case
- Module class: PascalCase + `Module`

Example:
- `modules/listings/listings.module.ts` exports `ListingsModule`

### Controllers
- File: `*.controller.ts`
- Class: `<Resource>Controller`

Example:
- `listings.controller.ts` → `ListingsController`

Controller routes:
- `/api/v1/listings` (resource is plural)

### Services
- File: `*.service.ts`
- Class: `<Resource>Service`

Example:
- `verification-requests.service.ts` → `VerificationRequestsService`

### DTOs
- File: `*.dto.ts`
- DTO class naming pattern:
  - `Create<Resource>Dto`
  - `Update<Resource>Dto`
  - `List<Resource>QueryDto`
  - `Action<Resource>Dto` (for explicit actions)

Examples:
- `create-listing.dto.ts` → `CreateListingDto`
- `list-listings-query.dto.ts` → `ListListingsQueryDto`

### Guards and Decorators
- Guards: `*.guard.ts`
  - `auth.guard.ts`, `permission.guard.ts`, `ownership.guard.ts`
- Decorators: `*.decorator.ts`
  - `current-user.decorator.ts`, `permissions.decorator.ts`

### Events (Domain Events)
- Event names must be stable and dot-delimited:
  - `listing.created`
  - `listing.published`
  - `verification-request.submitted`
  - `payment.completed`
  - `escrow.released`

Event payload names:
- `listingId`, `tenantId`, `actorUserId`, `requestId` (where applicable)

---

## Workers (`apps/workers`) Naming

### Queue Names
- Use dot-delimited domains:
  - `notifications`
  - `documents`
  - `exports`
  - `search`
  - `verification`

### Job Names
- Use `domain.action`:
  - `notifications.send_sms`
  - `notifications.send_email`
  - `documents.process`
  - `exports.generate_pdf`
  - `exports.generate_excel`
  - `search.index_listing`
  - `verification.run_checks`

### Job Payload Fields
Standard required fields (where applicable):
- `tenantId`
- `actorUserId` (if user-triggered)
- `requestId`
- `idempotencyKey` or `jobId`
- `<entity>Id` (e.g., `listingId`, `paymentId`)

---

## Database Naming (Postgres + Prisma)

### Tables
- **snake_case**, plural:
  - `users`
  - `tenants`
  - `listings`
  - `verification_requests`
  - `payments`
  - `audit_logs`
  - `role_permissions`

### Columns
- **snake_case**:
  - `created_at`, `updated_at`
  - `tenant_id`, `org_id`
  - `verified_at`, `rejected_at`

Primary keys:
- `id` (UUID preferred)
Foreign keys:
- `<entity>_id`:
  - `listing_id`, `user_id`

### Join Tables
- `user_roles`
- `role_permissions`

### Status Columns
- Use `_status` suffix:
  - `listing_status`
  - `verification_status`
  - `payment_status`

Status values:
- Use consistent enums (documented in API):
  - `draft`, `active`, `archived`
  - `pending`, `in_review`, `verified`, `rejected`
  - `initiated`, `processing`, `completed`, `failed`

---

## API Field Naming (JSON)
- **camelCase** for JSON response/request fields:
  - `listingId`, `tenantId`, `createdAt`, `verificationStatus`

Rule:
- DB snake_case maps to API camelCase at the service/serializer layer.

---

## Forbidden Names (Hard Rule)
The following are forbidden anywhere in production code:
- `temp`, `tmp`, `test` (unless in test files)
- `Card2`, `ModalNew`, `NewComponent`, `Foo`, `Bar`
- `whatever`, `thing`, `stuff`
- `finalFinal`, `latest`, `v2final`

Allowed only in test directories:
- `__tests__`, `*.spec.ts`, `*.test.ts`

---

## Domain Terms (Canonical Glossary)
Use these canonical terms consistently across UI, API, DB:

- `listing` — land posting
- `verificationRequest` — verification submission
- `verification` — the workflow and status
- `escrow` — funds held pending conditions
- `installmentPlan` — structured payment schedule
- `permit` — building/land permit process
- `professional` — marketplace service provider (agent/surveyor/legal/etc.)
- `tenant` — top-level account boundary
- `org` — organization within tenant (optional)
- `auditLog` — append-only record of sensitive actions

---

## Examples (Good vs Bad)

### Good
- `VerificationSealBadge`
- `verification-seal-badge.tsx`
- `verification_requests`
- `CreateListingDto`
- `search.index_listing`

### Bad
- `Badge2`
- `newModal.tsx`
- `tbl_ver_req`
- `ListingDTO2`
- `indexListingJob`

---

## Change Log / Decisions (ADR)
All deviations or new naming patterns require an ADR.

### ADR Template
- **ADR-### Title**
  - Problem:
  - Decision:
  - Alternatives:
  - Consequences:
  - Date:
  - Owner:

### ADR-001 — camelCase for API, snake_case for DB
- Problem: need consistent DB conventions while preserving clean JSON payloads.
- Decision: snake_case in DB, camelCase in API payloads.
- Alternatives: camelCase everywhere; snake_case everywhere.
- Consequences: explicit mapping layer required; clearer DB readability.
- Date: 2026-01-25
- Owner: Product Engineering
