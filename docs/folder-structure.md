```md
# Folder Structure — Ghana Lands Project
Version: 1.0.0  
Owner: Product Engineering  
Status: Active  
Applies to: Entire monorepo (Windsurf-managed)

---

## Purpose
This document defines the **canonical folder structure** for the Ghana Lands Project.  
Its goals are to:

- Enforce consistency across web, API, workers, and shared packages
- Support fast delivery **without** architectural drift
- Enable clean extraction to microservices later
- Make the project readable to humans and AI agents alike
- Prevent “where should this live?” debates

This structure is **mandatory**. Any deviation requires an ADR.

---

## Architectural Principle
> **Modular Monolith first, service-ready always**

- One repo
- Clear boundaries
- No cross-layer leakage
- Queue-backed side effects
- Microservices emerge by extraction, not rewrite

---

## Top-Level Structure (Monorepo)

```

/
├─ apps/
│  ├─ web/
│  ├─ api/
│  └─ workers/
│
├─ packages/
│  ├─ shared/
│  └─ config/
│
├─ prisma/
│
├─ infra/
│  ├─ docker/
│  └─ nginx/
│
├─ docs/
│
├─ scripts/
│
├─ .env.example
├─ docker-compose.yml
├─ package.json
├─ tsconfig.base.json
└─ README.md

```

---

## `/apps` — Runtime Applications

### `/apps/web` — Frontend (Next.js App Router)

```

apps/web/
├─ app/
│  ├─ (public)/
│  ├─ (auth)/
│  ├─ dashboard/
│  ├─ admin/
│  └─ api/               # route handlers (if needed)
│
├─ components/
│  ├─ ui/                # wrapped shadcn primitives (Button, Card, Badge)
│  ├─ layout/            # Header, Sidebar, Footer
│  ├─ feedback/          # Toasts, Alerts, EmptyState, ErrorState
│  ├─ data/              # Tables, Timelines, Steppers
│  └─ domain/            # ListingCard, VerificationBadge, PaymentTimeline
│
├─ modules/
│  ├─ listings/
│  ├─ verification/
│  ├─ payments/
│  ├─ permits/
│  ├─ marketplace/
│  └─ admin/
│
├─ hooks/
│
├─ lib/
│  ├─ api/               # API client wrappers (fetch, TanStack Query)
│  ├─ auth/
│  ├─ motion/            # GSAP / Lenis utilities ONLY
│  ├─ utils/
│  └─ constants/
│
├─ styles/
│  └─ globals.css
│
├─ public/
│
├─ middleware.ts
└─ next.config.js

```

#### Rules
- **NO UI components** inside `app/**` except page composition.
- All reusable UI lives in `components/` or `modules/`.
- GSAP/Lenis code **only** in `lib/motion/`.
- Direct API calls forbidden in components; use `lib/api`.

---

### `/apps/api` — Backend API (NestJS)

```

apps/api/
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│
│  ├─ modules/
│  │  ├─ auth/
│  │  ├─ users/
│  │  ├─ tenants/
│  │  ├─ rbac/
│  │  ├─ listings/
│  │  ├─ verification/
│  │  ├─ escrow/
│  │  ├─ payments/
│  │  ├─ permits/
│  │  ├─ marketplace/
│  │  ├─ documents/
│  │  ├─ notifications/
│  │  ├─ reports/
│  │  ├─ search/
│  │  └─ audit/
│
│  ├─ common/
│  │  ├─ guards/
│  │  ├─ decorators/
│  │  ├─ filters/
│  │  ├─ interceptors/
│  │  └─ pipes/
│
│  ├─ config/
│  ├─ database/
│  └─ health/
│
├─ test/
└─ tsconfig.json

```

#### Module Internal Structure (Standard)
Every module **must** follow this pattern:

```

listings/
├─ listings.controller.ts
├─ listings.service.ts
├─ listings.module.ts
├─ dto/
├─ entities/
├─ repositories/
├─ events/
└─ policies/

```

#### Rules
- No business logic in controllers.
- Cross-module access via services only (no DB leakage).
- Guards and policies enforce RBAC/ABAC.
- Events emitted for side effects (payments, verification, indexing).

---

### `/apps/workers` — Background Workers (BullMQ)

```

apps/workers/
├─ src/
│  ├─ index.ts
│  ├─ queues/
│  │  ├─ notifications.queue.ts
│  │  ├─ documents.queue.ts
│  │  ├─ exports.queue.ts
│  │  ├─ search.queue.ts
│  │  └─ verification.queue.ts
│  │
│  ├─ processors/
│  │  ├─ send-sms.processor.ts
│  │  ├─ send-email.processor.ts
│  │  ├─ generate-pdf.processor.ts
│  │  ├─ index-listing.processor.ts
│  │  └─ run-verification.processor.ts
│  │
│  └─ utils/
│
└─ tsconfig.json

```

#### Rules
- Workers **never** serve HTTP.
- All jobs must be idempotent.
- Workers may call API services or repositories, never UI logic.

---

## `/packages` — Shared Code

### `/packages/shared`
```

packages/shared/
├─ types/
├─ schemas/          # Zod schemas
├─ constants/
├─ enums/
└─ utils/

```

Used by:
- `apps/web`
- `apps/api`
- `apps/workers`

Rules:
- No framework-specific code here.
- No side effects.
- Pure TypeScript only.

---

### `/packages/config`
```

packages/config/
├─ eslint/
├─ prettier/
├─ tsconfig/
└─ tailwind/

```

Rules:
- Centralized linting and formatting
- No duplication across apps

---

## `/prisma` — Database & Migrations

```

prisma/
├─ schema.prisma
├─ migrations/
└─ seed.ts

```

Rules:
- All schema changes go through Prisma migrations.
- No direct DB schema edits outside migrations.
- Seed data must be safe to run repeatedly.

---

## `/infra` — Infrastructure

```

infra/
├─ docker/
│  ├─ postgres/
│  ├─ redis/
│  ├─ meilisearch/
│  ├─ minio/
│  └─ api/
│
├─ nginx/
│  └─ nginx.conf

```

Rules:
- Infra configs must not contain secrets.
- Local and prod parity is mandatory.
- Compose files reference these configs.

---

## `/docs` — Governance & Architecture

```

docs/
├─ design-system.md
├─ ui.rules.json
├─ motion.rules.json
├─ ux.flows.md
├─ api.conventions.md
├─ naming.rules.md
├─ folder-structure.md
├─ architecture.md
└─ adr/

```

Rules:
- These are **authoritative**.
- Any deviation requires an ADR entry.
- AI agents must treat these as ground truth.

---

## `/scripts` — Tooling & Automation

```

scripts/
├─ db-reset.ts
├─ seed-dev.ts
├─ migrate.ts
└─ cleanup.ts

```

Rules:
- Scripts must be explicit and safe.
- No hidden side effects.

---

## Forbidden Structures (Hard Rule)
The following are **not allowed**:

- `components/` inside route folders
- `utils/` that become dumping grounds
- Deep nesting beyond 3–4 levels
- Duplicate folders for the same domain
- Business logic in UI or controllers
- Cross-app imports that bypass packages/shared

---

## When to Create a New Folder
Create a new folder **only if**:
1. It represents a real domain or responsibility
2. It will be reused or scaled
3. It maps to a backend module or UX flow

Otherwise, extend an existing module.

---

## Definition of Done (Structure)
A feature is structurally complete only if:
- Files live in the correct layer
- Naming follows `naming.rules.md`
- No cross-boundary leakage exists
- Shared logic is in `packages/shared`
- Side effects are queue-backed
- Docs updated if structure changes

---

## Change Log / ADR

### ADR-001 — Modular Monorepo Structure
- **Problem:** Fragmented repos slow development and create drift.
- **Decision:** Single monorepo with clear boundaries and extraction-ready modules.
- **Alternatives:** Multi-repo; microservices-first.
- **Consequences:** Faster iteration, simpler onboarding, clean scale path.
- **Date:** 2026-01-25
- **Owner:** Product Engineering
```

---