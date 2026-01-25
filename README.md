# Ghana Lands Project

A modern land marketplace platform for Ghana with secure escrow transactions, verification workflows, and professional services.

## Architecture

- **Modular Monolith** - Single deployable backend with clear domain boundaries
- **Queue-backed side effects** - BullMQ for notifications, exports, search indexing
- **Service-ready** - Designed for future microservice extraction

## Tech Stack

### Frontend (`apps/web`)
- Next.js 14 (App Router) + TypeScript
- TailwindCSS + shadcn/ui components
- TanStack Query for server state
- React Hook Form + Zod validation

### Backend (`apps/api`)
- NestJS + TypeScript
- REST + OpenAPI/Swagger
- JWT authentication with refresh tokens
- RBAC + ABAC authorization

### Data Layer
- PostgreSQL + PostGIS (geospatial)
- Prisma ORM
- Redis (cache + queues)
- Meilisearch (search)
- S3-compatible storage (MinIO locally)

### Workers (`apps/workers`)
- BullMQ job processors
- Notifications, exports, search indexing

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Setup

1. **Clone and install dependencies**
```bash
cd ghana-lands
npm install
```

2. **Start infrastructure services**
```bash
docker compose up -d
```

This starts:
- PostgreSQL + PostGIS (port 5432)
- Redis (port 6379)
- Meilisearch (port 7700)
- MinIO (ports 9000, 9001)

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your values
```

4. **Setup database**
```bash
npm run db:generate
npm run db:push
npm run db:seed  # Optional: seed data
```

5. **Start development servers**
```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## Project Structure

```
ghana-lands/
├── apps/
│   ├── web/           # Next.js frontend
│   ├── api/           # NestJS backend
│   └── workers/       # BullMQ workers
├── packages/
│   ├── shared/        # Shared types, schemas, utils
│   └── config/        # Shared configs
├── prisma/            # Database schema & migrations
├── infra/             # Docker configs
├── docs/              # Architecture & governance docs
└── scripts/           # Utility scripts
```

## Documentation

See `/docs` for detailed documentation:

- `ARCHITECTURE.md` - System architecture
- `design-system.md` - UI design system
- `api.conventions.md` - API standards
- `ux.flows.md` - UX flow patterns
- `naming.rules.md` - Naming conventions
- `folder-structure.md` - Project structure
- `windsurf.rules.json` - AI governance rules

## Core Features

### Land Listings
- Create, search, filter listings
- Map view with parcel boundaries
- Verification status badges

### Escrow Transactions
- Secure payment holding
- Verification period
- Dispute resolution

### Verification
- Document upload
- Lands Commission workflow
- Verified seal display

### Professional Services
- Surveyors, lawyers, agents
- Service marketplace
- Rating & reviews

## Development

### Commands

```bash
# Development
npm run dev           # Start all services
npm run dev:web       # Start web only
npm run dev:api       # Start API only

# Database
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database

# Build
npm run build         # Build all
npm run build:web     # Build web
npm run build:api     # Build API

# Docker
npm run docker:up     # Start services
npm run docker:down   # Stop services
npm run docker:logs   # View logs
```

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- See `docs/naming.rules.md` for conventions

## License

Proprietary - All rights reserved
