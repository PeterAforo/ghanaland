# Professional Services & Service Requests Flow

## Overview

The Ghana Lands platform connects clients (buyers/sellers) with professionals (surveyors, lawyers, architects, etc.) through a structured service request workflow with escrow-protected payments.

---

## Key Models

### 1. ServiceCatalog (Admin-Managed)
- **Purpose**: Admin-controlled list of approved services
- **Fields**: `professionalType`, `name`, `description`, `priceGhs` (suggested), `durationDays`, `isActive`
- **Access**: Admin creates/manages; Professionals select from catalog

### 2. ProfessionalService (Professional's Offerings)
- **Purpose**: Services a professional offers with their custom pricing
- **Fields**: `profileId`, `catalogId`, `name`, `priceGhs`, `priceType`, `durationDays`
- **Relation**: Links to `ServiceCatalog` via `catalogId`

### 3. ServiceRequest (Client-Professional Transaction)
- **Purpose**: Tracks a service engagement from request to completion
- **Fields**: `clientId`, `professionalId`, `serviceId`, `status`, `agreedPriceGhs`, `paymentStatus`

---

## Service Request Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE REQUEST LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────────────────┘

1. CLIENT INITIATES REQUEST
   ├── Browses /professionals page
   ├── Views professional profile
   ├── Selects a service
   └── Submits service request with description
       Status: PENDING

2. PROFESSIONAL REVIEWS
   ├── Receives notification
   ├── Reviews request details
   └── Either:
       ├── ACCEPTS → Sets agreed price → Status: ACCEPTED
       └── DECLINES → Status: CANCELLED

3. CLIENT FUNDS ESCROW
   ├── Receives acceptance notification
   ├── Reviews agreed price
   └── Makes payment to escrow
       Status: ESCROW_FUNDED
       PaymentStatus: ESCROW_HELD

4. PROFESSIONAL PERFORMS WORK
   ├── Starts work → Status: IN_PROGRESS
   ├── Uploads documents/deliverables
   └── Marks as delivered → Status: DELIVERED

5. CLIENT CONFIRMS COMPLETION
   ├── Reviews deliverables
   ├── Confirms work is satisfactory
   └── Status: COMPLETED

6. ESCROW RELEASE
   ├── Platform releases funds to professional
   ├── Platform fee deducted (10%)
   └── PaymentStatus: RELEASED

7. REVIEW (Optional)
   └── Client can leave rating and review
```

---

## Status Flow

```
PENDING → ACCEPTED → ESCROW_FUNDED → IN_PROGRESS → DELIVERED → COMPLETED
    │         │
    └→ CANCELLED (by either party before escrow)
              │
              └→ DISPUTED (if issues arise after escrow)
```

---

## Payment Status Flow

```
UNPAID → ESCROW_HELD → RELEASED
              │
              └→ REFUNDED (if cancelled/disputed)
```

---

## API Endpoints

### Service Catalog (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/service-catalog` | List all active catalog items |
| GET | `/api/v1/service-catalog/by-type/:type` | Get catalog by professional type |
| POST | `/api/v1/service-catalog/admin` | Create catalog item (Admin) |
| PATCH | `/api/v1/service-catalog/admin/:id` | Update catalog item (Admin) |
| DELETE | `/api/v1/service-catalog/admin/:id` | Delete/deactivate item (Admin) |
| POST | `/api/v1/service-catalog/admin/seed` | Seed default services (Admin) |

### Professional Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/professionals/me/services` | Add service to profile |
| DELETE | `/api/v1/professionals/me/services/:id` | Remove service |

### Service Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/professionals/requests` | Create service request (Client) |
| GET | `/api/v1/professionals/requests/client` | Get my requests as client |
| GET | `/api/v1/professionals/requests/professional` | Get requests for me as professional |
| GET | `/api/v1/professionals/requests/:id` | Get request details |
| PATCH | `/api/v1/professionals/requests/:id/status` | Update request status |

---

## Platform Fee Structure

- **Platform Fee**: 10% of agreed price
- **Professional Net**: 90% of agreed price
- **Fee Calculation**: Done when professional accepts and sets price

```
agreedPriceGhs = 1000
platformFeeGhs = 100 (10%)
professionalNetGhs = 900 (90%)
```

---

## Integration with Land Journey

Service requests can be linked to:
- **Listings**: When service is for a specific property listing
- **My Lands**: When service is for owned land (via `landId`)
- **Journey Stages**: Track which stage of land ownership journey the service supports

---

## Seeding Default Services

To populate the service catalog with default services:

```bash
# Call the seed endpoint (requires admin auth)
POST /api/v1/service-catalog/admin/seed
Authorization: Bearer <admin_token>
```

This creates services for all professional types:
- **SURVEYOR**: Land Survey, Boundary Demarcation, Topographic Survey, etc.
- **LAWYER**: Title Search, Indenture Preparation, Contract Review, etc.
- **ARCHITECT**: Building Design, Floor Plans, 3D Visualization, etc.
- **ENGINEER**: Structural Design, Foundation Design, etc.
- **VALUER**: Property Valuation, Market Analysis, etc.
- **PLANNER**: Development Permit, Zoning Verification, etc.
- **AGENT**: Property Listing, Property Search, Site Visit Coordination, etc.
