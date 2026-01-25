# Architecture — Ghana Lands Project
Version: 1.0.0  
Owner: Product Engineering  
Status: Active  
Applies to: Monorepo (`apps/web`, `apps/api`, `apps/workers`, `packages/shared`, `prisma`, `infra`)

---

## Purpose
This document defines the reference architecture for the Ghana Lands Project to optimize for:
- **Speed to ship** (Phase 1–2)
- **Maximum long-term scalability** (Phase 3+)
- Strong **trust** guarantees (verification, escrow, auditability)
- Clean **multi-tenant** separation
- Extraction-ready seams for microservices

This architecture is binding. Deviations require an ADR entry.

---

## Executive Summary
- **Frontend:** Next.js (App Router) + TypeScript
- **Backend:** NestJS (REST + OpenAPI)
- **Data:** PostgreSQL + PostGIS (source of truth)
- **Queues/Cache:** Redis + BullMQ
- **Search:** Meilisearch (indexed from Postgres via workers)
- **Storage:** S3-compatible object store (MinIO locally)
- **Observability:** Sentry + requestId correlation
- **Style of scale:** Modular monolith now; microservices by extraction later

---

## Core Architecture Principle
> **Modular Monolith First, Service-Ready Always**

- Single deployable API in early phases
- Strict domain boundaries through NestJS modules
- Side effects (payments, notifications, exports, indexing) are **queue-backed**
- Later, high-load modules are extracted without rewriting the core domain model

---

## System Context (High-Level)

### Primary Actors
- Guest
- Buyer
- Seller
- Agent/Facilitator
- Professional (architect/surveyor/legal)
- Admin (Ops)
- Verifier (internal or Lands Commission workflow)
- Finance (escrow oversight)

### External Integrations
- Hubtel (MoMo/cards, subscriptions, escrow-related payments)
- mNotify (SMS)
- Email provider (Postmark/Mailgun; optional Mailcow)
- Lands Commission / verification workflows (internal process + future API integration)
- Mapping provider (Mapbox; fallback Leaflet)

---

## Logical Components

### Applications
1. **Web App** (`apps/web`)
   - Client UI, dashboards, workflows
   - Uses API client + TanStack Query
   - Enforces route gating based on RBAC (server remains authoritative)

2. **API** (`apps/api`)
   - REST endpoints with consistent envelope
   - Auth, RBAC, ABAC-lite enforcement
   - Emits domain events and enqueues jobs for side effects

3. **Workers** (`apps/workers`)
   - BullMQ consumers
   - Sends SMS/email, generates exports, indexes search, processes documents, runs verification checks
   - Must be idempotent and retry-safe

### Shared
- `packages/shared` — types, enums, Zod schemas, utilities
- `prisma` — schema + migrations + seed

### Infrastructure
- Postgres + PostGIS
- Redis
- Meilisearch
- S3-compatible storage (MinIO locally)
- Nginx reverse proxy (prod template)
- Docker Compose (local/staging/prod parity in Phase 1)

---

## Reference Data Flow (Canonical)

### 1) Listing Create → Search Index
1. User creates listing in Web
2. Web calls API `POST /api/v1/listings`
3. API writes to Postgres, emits `listing.created`
4. API enqueues BullMQ job: `search.index_listing`
5. Worker reads listing from Postgres and upserts into Meilisearch
6. Web listing search reads from Meilisearch; details read from API

Rule: Postgres is the source of truth; Meilisearch is derived.

---

### 2) Verification Request → Verified Seal
1. Seller/Agent submits verification request
2. API records `verification_request` and sets `verification_status = pending`
3. API enqueues `verification.run_checks`
4. Worker performs checks (document completeness, geometry validity, duplication signals)
5. Verifier (role-based) approves/rejects
6. API updates status and writes audit log
7. UI displays verified seal + timeline

Rule: Verified seal is strictly controlled by RBAC + audit logging.

---

### 3) Payment (Escrow/Installment) → Receipt + Notifications
1. Buyer initiates payment
2. API creates `payment` record with status `initiated` and returns Hubtel payment session reference
3. Hubtel callback hits API webhook endpoint
4. API validates signature + idempotency key
5. API updates `payment_status` and app ledger/escrow record (if required)
6. API enqueues notifications (`send_sms`, `send_email`) and receipt generation (`exports.generate_pdf`)
7. Worker sends notifications and generates receipt, stores it in S3, updates metadata
8. UI shows timeline + receipt download

Rule: Idempotency is mandatory for all payment-related actions.

---

## Domain Modules (Backend)
All business logic lives in modules under `apps/api/src/modules/*`.

### Core modules (Phase 1)
- `auth` (JWT + refresh + optional 2FA)
- `users`
- `tenants`
- `rbac`
- `listings` (core land postings)
- `geo` (PostGIS helpers, polygon validation; may be within listings initially)
- `documents`
- `verification`
- `payments`
- `escrow` (if separated from payments)
- `notifications` (queue producers)
- `search` (index orchestration producers)
- `audit` (append-only)

### Phase 2–3 modules
- `permits`
- `marketplace`
- `public-api`
- `ussd` (separate service later)
- `ai-insights` (separate service later)

Rules:
- Controllers are thin; services own logic.
- Cross-module calls only via service interfaces (no DB table coupling).
- Side effects always queue-backed.

---

## Multi-Tenancy Model
### Tenant boundaries
- Every tenant-scoped record includes `tenantId` (and optionally `orgId`).
- Tenant context is derived from auth token, not from client-provided params.

### Tenant data isolation
- Queries always include `tenantId` predicate.
- For cross-tenant leakage prevention:
  - return `404` where existence should not be revealed
- Admin “super access” requires explicit permissions and audit logging.

---

## Authorization Model (RBAC + ABAC-lite)
### RBAC
- Roles, permissions, role-permissions, user-roles stored in DB
- Permission guard checks `permission` strings (stable identifiers)

### ABAC-lite
Ownership checks:
- tenant ownership (`tenantId`)
- org ownership (`orgId`)
- entity ownership (`createdByUserId` where applicable)

Rule: UI hides actions, but server enforcement is always authoritative.

---

## Data Architecture (Postgres + PostGIS)

### Source of truth
Postgres holds:
- listings
- verification requests
- payments/escrow ledger
- permits
- users/roles
- audit logs
- document metadata

### Geospatial
- Parcels stored as `geometry(MultiPolygon, 4326)`
- Derived bounding box for quick filtering
- Spatial indexes required

Rule: Geometry is validated server-side.

---

## Search Architecture (Meilisearch)
- Used for high-performance listing discovery
- Indexed fields:
  - category, landType, leasePeriod, region/district
  - price and currency
  - verificationStatus
  - geo-derived fields (bbox-based filtering where feasible)

Sync strategy:
- Write to Postgres first
- Queue index jobs
- Worker syncs to Meilisearch
- Reindex tooling exists in `scripts/`

---

## Storage Architecture (S3-compatible)
- Objects stored in S3/Spaces/Wasabi (MinIO locally)
- API provides signed URLs for uploads/downloads
- File metadata stored in Postgres:
  - `documentId`, `ownerEntityType`, `ownerEntityId`, `mimeType`, `size`, `storageKey`, `createdAt`

Rule: No large binaries stored in Postgres.

---

## Queue Architecture (Redis + BullMQ)
### Why queues
Queues protect the API from:
- spikes
- slow external services
- long-running tasks (PDF, indexing)

### Queues and jobs (canonical)
Queues:
- `notifications`
- `documents`
- `exports`
- `search`
- `verification`

Jobs:
- `notifications.send_sms`
- `notifications.send_email`
- `documents.process`
- `exports.generate_pdf`
- `exports.generate_excel`
- `search.index_listing`
- `verification.run_checks`

Reliability rules:
- retries + exponential backoff
- dead-letter strategy for failed jobs
- idempotency keys where side effects occur

---

## Observability & Reliability
### Request correlation
- Every API response includes `meta.requestId`
- Logs are structured JSON and include:
  - requestId, tenantId, userId, route, statusCode, durationMs

### Error reporting
- Sentry for:
  - frontend errors
  - API errors
  - worker errors

---

## Security Architecture
### Transport
- HTTPS everywhere in production
- Strict CORS policy

### Authentication
- Access + refresh token rotation
- Optional 2FA for sensitive roles

### Payments security
- Verify Hubtel webhook signatures
- Idempotency key on payment endpoints
- Audit logging for every financial state transition

### Data protection
- Signed URLs for documents
- RBAC gating for downloads
- Avoid leaking cross-tenant identifiers

---

## Deployment Architecture (Phase 1)
### Local/staging/prod parity
- Docker Compose includes:
  - web
  - api
  - workers
  - postgres/postgis
  - redis
  - meilisearch
  - minio
  - nginx (prod template)

Rule: No “works only in prod” configurations.

---

## Evolution Path (Scalability Plan)

### Phase 1–2 (Ship fast)
- Modular monolith API
- Queue-backed side effects
- Meilisearch indexing
- Standardized design system and UX flows

### Phase 3+ (Scale by extraction)
Extract services by pressure:
1. **Notifications Service**
2. **Search Service**
3. **Payments Service** (if volume requires isolation)
4. **USSD Service**
5. **AI Insights Service**

Extraction rule:
- Keep Postgres as canonical data source
- Use event + job contracts to decouple
- Maintain API gateway routing if needed

---

## Non-Functional Requirements (NFRs)
- Availability target: define per phase (Phase 1 “best effort”; Phase 3 “SLA-bound”)
- Performance:
  - listing search should be sub-second
  - map interactions must not block UI
- Auditability:
  - all verification and financial actions are logged
- Compliance readiness:
  - data minimization and access controls

---

## ADR (Architecture Decisions)

### ADR-001 — Modular Monolith First
- Problem: microservices-first slows delivery and complicates ops.
- Decision: modular monolith with strict boundaries and queue seams.
- Alternatives: microservices-first; multi-repo.
- Consequences: faster delivery; later extraction remains straightforward.
- Date: 2026-01-25
- Owner: Product Engineering

### ADR-002 — Postgres + PostGIS as Source of Truth
- Problem: land workflows require spatial accuracy and authoritative data.
- Decision: Postgres/PostGIS is canonical; search and caches are derived.
- Alternatives: Mongo + geo; Elastic as source.
- Consequences: strong spatial queries; consistent integrity.
- Date: 2026-01-25
- Owner: Product Engineering

### ADR-003 — Queue-backed Side Effects
- Problem: external integrations and heavy tasks degrade API latency.
- Decision: BullMQ for notifications, exports, search indexing, verification checks.
- Alternatives: synchronous processing; cron-only.
- Consequences: reliability and scalability; added worker ops.
- Date: 2026-01-25
- Owner: Product Engineering
