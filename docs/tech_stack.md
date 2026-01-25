```md
# WINDSURF UPGRADE PROMPT — Ghana Lands Project Tech Stack (Speed + Long-Term Scalability)

## Objective
Update the existing Windsurf project to a “ship fast now, scale cleanly later” architecture using a modular monolith first, with explicit seams to extract microservices (search, notifications, AI, payments, USSD) as the platform grows.

## Target Architecture Summary
- **Phase 1–2:** Modular Monolith (single backend service) + background workers via queues
- **Phase 3+:** Extract microservices (Search, Notifications, AI, Payments, USSD) without refactoring the core domain

## Technology Stack (Required)
### Web (Frontend)
- **Next.js (App Router) + TypeScript**
- **TailwindCSS + shadcn/ui**
- **TanStack Query** for server state
- **React Hook Form + Zod** for forms & validation
- **Map:** Mapbox GL JS (primary); allow Leaflet as fallback if required
- **Motion:** GSAP + Lenis (Framer Motion optional only when simpler)

### API (Backend)
- **NestJS + TypeScript**
- **REST + OpenAPI (Swagger)** from day one
- Internal domain events (simple event bus pattern)
- **Workers:** BullMQ

### Data Layer
- **PostgreSQL + PostGIS** (mandatory for geospatial)
- **ORM:** Prisma + Prisma Migrate
- Spatial indexes for geometry and performance

### Queue / Cache
- **Redis**
- **BullMQ** for:
  - verification workflows
  - document processing
  - notifications
  - exports (PDF/Excel)
  - scheduled jobs (subscriptions, expiries, reminders)

### Search
- **Meilisearch** for listings and discovery
- Postgres remains the source of truth; Meilisearch sync via worker jobs

### Storage
- **S3-compatible object storage** (AWS S3 / DigitalOcean Spaces / Wasabi)
- CDN support + Signed URLs
- Store file metadata in Postgres

### Auth / RBAC / Security
- JWT access tokens + rotating refresh tokens
- DB-driven **RBAC** (roles → permissions matrix), plus optional ABAC ownership checks (tenant/org)
- **2FA (TOTP)** for admins and sensitive roles
- **Audit Logs** (append-only) for admin + financial actions

### Payments / Notifications (Ghana-Ready)
- **Hubtel** payments (escrow, installments, subscriptions)
- **mNotify** for SMS
- Email: Postmark or Mailgun (Mailcow optional fallback)

### Observability
- **Sentry** (web + api)
- OpenTelemetry-ready instrumentation (enable when multi-service begins)

### DevOps / Deployment
- Docker everywhere
- Local + staging + prod parity with Docker Compose (Phase 1)
- Nginx reverse proxy
- GitHub Actions CI/CD
- Secrets via Doppler/1Password/Vault (pick one and enforce)

## Implementation Requirements (Update the Windsurf Project)
### 1) Repo Restructure (Monorepo)
Convert the project into a monorepo with shared packages and clear boundaries:
- `apps/web` — Next.js App Router frontend
- `apps/api` — NestJS REST API
- `apps/workers` — BullMQ worker processes (can be inside api initially, but structure must allow extraction)
- `packages/shared` — shared types, Zod schemas, utilities
- `packages/config` — tsconfig/eslint/prettier shared configs
- `infra/docker` — compose files, nginx, service configs
- `prisma/` — schema, migrations, seed scripts
- `docs/` — architecture, API specs, workflows

### 2) Services to Add (Docker Compose)
Create/Update docker-compose to include:
- Postgres + PostGIS
- Redis
- Meilisearch
- MinIO (S3-compatible) for local dev storage
- API service
- Web service
- Worker service
- Nginx reverse proxy (optional for local; mandatory for prod templates)

### 3) Backend Modules (NestJS)
Create these modules as first-class Nest modules with clear boundaries:
- AuthModule (JWT + refresh, 2FA hooks)
- UsersModule
- TenancyModule (tenant/org ownership)
- RBACModule (roles, permissions, policy guards)
- ListingsModule (land postings)
- GeoModule (PostGIS queries, validation, geometry tools)
- VerificationModule (Land Commission verification workflow + seal logic)
- EscrowModule (payments, installments, ledger events)
- PermitsModule (permit processing workflow)
- MarketplaceModule (professional services marketplace)
- NotificationsModule (SMS/email queue producer)
- DocumentsModule (uploads, S3, signed URLs, metadata)
- ReportsModule (PDF/Excel exports via queue)
- AuditModule (append-only logs)
- SearchSyncModule (Meilisearch indexing pipeline)

Ensure each module includes:
- controller + service + dto + entity/schema + tests scaffold
- domain events where needed (e.g., `listing.created`, `payment.completed`, `verification.approved`)

### 4) Database (Prisma + PostGIS)
- Use Prisma with Postgres.
- Implement PostGIS geometry storage (polygon/multipolygon).
- Add spatial indexes and query helpers.
- Establish multi-tenant patterns: every tenant-scoped table includes `tenant_id` and/or `org_id`.

### 5) Authentication and Authorization
- Implement:
  - access + refresh token flow
  - token rotation and revocation
  - password hashing best practices
  - optional 2FA endpoints (TOTP enrollment/verify)
- RBAC:
  - roles table
  - permissions table
  - role_permissions join
  - user_roles join
- Guards:
  - Auth guard
  - Permission guard
  - Ownership guard (ABAC-lite: tenant/org checks)

### 6) Queue Worker Patterns (BullMQ)
- Standardize jobs:
  - `notifications.send_sms`
  - `notifications.send_email`
  - `documents.process`
  - `exports.generate_pdf`
  - `exports.generate_excel`
  - `search.index_listing`
  - `verification.run_checks`
- Include:
  - retry/backoff policies
  - dead-letter queue strategy
  - idempotency keys for payment/notification tasks

### 7) Search (Meilisearch)
- Create an indexing pipeline for listings:
  - on create/update/delete → enqueue index job
- Define search filters:
  - category (residential/commercial/industrial/agriculture)
  - land type (customary/titled/etc.)
  - lease period
  - price range
  - region/district
  - verification status (verified seal)

### 8) Storage (S3-compatible)
- Local: MinIO
- Prod: S3/Spaces/Wasabi
- Implement signed URL generation
- Store metadata in Postgres
- Enforce MIME/type checks and virus scanning hook point (optional)

### 9) Frontend Integration (Next.js)
- Create API client layer (fetch wrapper) + TanStack Query hooks
- Implement:
  - auth session handling
  - role-based route protection
  - listing search + map view
  - upload flows (documents)
  - dashboard layout foundation (admin/agent/buyer/seller)

### 10) Engineering Standards
- TypeScript strict mode across web + api
- Zod schemas shared between web and api where appropriate
- OpenAPI/Swagger docs auto-generated from NestJS
- Linting/formatting enforced (eslint + prettier)
- Minimal but real tests scaffolding (unit + API smoke)

## Deliverables Required From Windsurf
1) Updated monorepo folder structure as specified
2) Working Docker Compose environment (web/api/db/redis/meilisearch/minio/workers)
3) NestJS modules scaffolded with routing
4) Prisma schema with tenant + RBAC + listings + geometry foundations
5) Meilisearch indexing worker wired
6) Auth (JWT + refresh) implemented end-to-end
7) Baseline Next.js UI integrated with auth + a sample listing search page

## Constraints
- Optimize for shipping within Phase 1 while not blocking Phase 3 extraction.
- Avoid premature microservices; ensure every high-load concern is already queue-backed.
- Postgres/PostGIS is mandatory.
- Keep codebase production-quality (no partial snippets; complete files only).
- Ensure the architecture supports: escrow/installments, verified seal, permit workflows, marketplace, public API, mobile + USSD readiness.

## Acceptance Criteria
- `docker compose up` brings up all services without manual hacks
- API healthcheck works and Swagger loads
- Web app can authenticate, call API, show a protected dashboard
- Creating/updating a listing triggers a queue job to index it in Meilisearch
- PostGIS geometry fields exist and can store/retrieve a parcel polygon
- RBAC permissions can block/allow actions per role

Proceed to implement these changes in the existing Windsurf project.
```
