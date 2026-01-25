````md
# API Conventions — Ghana Lands Project
Version: 1.0.0  
Owner: Product Engineering  
Status: Active  
Applies to: `apps/api` (NestJS), `apps/workers` (BullMQ consumers), `apps/web` (API client)

---

## Purpose
This document defines mandatory API standards to ensure:
- Consistent request/response shapes
- Predictable error handling and recovery
- Secure authentication and authorization (RBAC/ABAC)
- Reliable payments/notifications (idempotency)
- Stable versioning and backwards compatibility

These conventions are binding. Deviations require an ADR entry.

---

## Core Principles (Non-Negotiable)
1. **Consistency over convenience.** Every endpoint follows the same envelope.
2. **Server is source of truth.** UI must not infer states; API must expose them.
3. **Errors must be actionable.** Provide codes and next-step guidance.
4. **Authorization is enforced on the server.** Never UI-only.
5. **Idempotency for money and messaging.** Prevent duplicate side effects.
6. **Auditability.** Sensitive actions must emit audit events.

---

## API Style
- Transport: **HTTPS**
- Format: **JSON**
- API Type: **REST**
- Documentation: **OpenAPI/Swagger** is mandatory and kept current.
- Naming: **kebab-case** for paths, **camelCase** for JSON fields.

---

## Versioning
### URL-based versioning (mandatory)
All endpoints are versioned:
- `/api/v1/...`

Rules:
- Breaking changes require a new major version (e.g., `/api/v2`).
- Non-breaking additive changes allowed in the same version.
- Deprecations must include a deprecation notice and migration guidance.

---

## Endpoint Naming & Resource Design
### Resource naming
- Use plural nouns:
  - `/listings`
  - `/users`
  - `/roles`
  - `/permissions`
  - `/verification-requests`
  - `/payments`
  - `/permits`
  - `/documents`
  - `/audit-logs`

### Sub-resources
- Use nesting for ownership/scoping:
  - `/listings/{listingId}/documents`
  - `/listings/{listingId}/verification-requests`
  - `/payments/{paymentId}/receipt`

### Actions (when not a CRUD fit)
Use explicit action endpoints:
- `/listings/{id}:publish`
- `/verification-requests/{id}:approve`
- `/verification-requests/{id}:reject`
- `/payments/{id}:retry`
- `/escrow/{id}:release`

Rule:
- Action endpoints must be documented clearly with side effects and audit logs.

---

## Standard Response Envelope (Mandatory)
Every response returns:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
````

### Success response

* `success: true`
* `data`: object | array | null
* `meta`: object (may include paging, timing, requestId)
* `error: null`

### Error response

```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "req_..."
  },
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action.",
    "action": "Request access from an administrator or contact support.",
    "details": {
      "field": "optional",
      "reason": "optional"
    }
  }
}
```

Rules:

* Never return raw strings or unstructured errors.
* Always include a stable `error.code`.
* `error.action` must suggest what to do next.

---

## HTTP Status Codes

Use standard status codes consistently:

* `200 OK` — successful read/update/action
* `201 Created` — successful create
* `202 Accepted` — accepted for async processing (queue-based)
* `204 No Content` — allowed only for delete with no response body (avoid if possible; envelope preferred)
* `400 Bad Request` — validation or malformed request
* `401 Unauthorized` — missing/invalid auth
* `403 Forbidden` — authenticated but lacks permission
* `404 Not Found` — resource missing (do not leak tenant data)
* `409 Conflict` — concurrency conflict / duplicate
* `422 Unprocessable Entity` — semantic validation fails (optional; use 400 if you prefer one)
* `429 Too Many Requests` — rate limit
* `500 Internal Server Error` — unexpected

Rule:

* Even when using 4xx/5xx, the JSON envelope must still be returned.

---

## Error Codes (Canonical Set)

All modules must use consistent error codes. Extend only via ADR.

### Authentication / Authorization

* `AUTH_REQUIRED`
* `AUTH_INVALID`
* `TOKEN_EXPIRED`
* `PERMISSION_DENIED`
* `TENANT_ACCESS_DENIED`
* `TWO_FACTOR_REQUIRED`
* `TWO_FACTOR_INVALID`

### Validation / Domain

* `VALIDATION_ERROR`
* `NOT_FOUND`
* `CONFLICT`
* `RATE_LIMITED`
* `ILLEGAL_STATE_TRANSITION`

### Payments / Escrow

* `PAYMENT_INIT_FAILED`
* `PAYMENT_PROCESSING`
* `PAYMENT_FAILED`
* `PAYMENT_DUPLICATE`
* `ESCROW_RELEASE_NOT_ALLOWED`

### Documents

* `FILE_TYPE_NOT_ALLOWED`
* `FILE_TOO_LARGE`
* `UPLOAD_FAILED`

### Verification

* `VERIFICATION_ALREADY_SUBMITTED`
* `VERIFICATION_NOT_ALLOWED`
* `VERIFICATION_REJECTED`

---

## Pagination, Filtering, Sorting

### Pagination (required for list endpoints)

Default: cursor-based preferred; offset allowed for admin tables.

#### Cursor-based

Query:

* `?limit=20&cursor=...`

Response meta:

```json
"meta": {
  "pagination": {
    "limit": 20,
    "nextCursor": "abc123",
    "hasNext": true
  }
}
```

#### Offset-based (admin acceptable)

Query:

* `?page=1&pageSize=20`

Meta:

```json
"meta": {
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 534
  }
}
```

### Filtering

* Use query params:

  * `?status=verified&region=greater-accra&minPrice=...`

Rules:

* Filter fields must be documented per endpoint.
* Validation must reject unknown filters in strict mode.

### Sorting

* `?sort=createdAt:desc`
* Allow only documented sort fields.

---

## Authentication

### Token strategy

* JWT access token + rotating refresh tokens (stored securely)
* Access token: short-lived (e.g., 10–20 minutes)
* Refresh token: longer-lived (e.g., 7–30 days), rotated on use

### Headers

* `Authorization: Bearer <access_token>`

### Session endpoints (example names)

* `POST /api/v1/auth/login`
* `POST /api/v1/auth/refresh`
* `POST /api/v1/auth/logout`
* `POST /api/v1/auth/2fa/enroll`
* `POST /api/v1/auth/2fa/verify`

Rules:

* Refresh must rotate refresh tokens and invalidate prior token.
* Logout must revoke refresh token(s).

---

## Authorization (RBAC + ABAC-lite)

### RBAC

* DB-driven:

  * roles
  * permissions
  * user_roles
  * role_permissions

Server enforcement:

* Controller or route must apply guards:

  * AuthGuard
  * PermissionGuard (or RolesGuard)

### ABAC-lite (ownership)

For tenant-scoped resources:

* Enforce `tenantId/orgId` matching at query layer.
* Never rely on client to pass tenantId correctly; infer from token context.

Rules:

* 404 should be used instead of 403 where revealing existence would leak data across tenants.

---

## Multi-Tenancy Conventions

### Tenant context

* Derived from authenticated user context.
* Tenant-scoped tables include `tenantId` (and optionally `orgId`).

Rules:

* All repository queries must include `tenantId` predicate unless explicitly global.
* Admin super-user may bypass via explicit permission and audit logging.

---

## Idempotency (Mandatory for Side Effects)

Required for:

* Payment initiation
* Escrow release
* Notifications (SMS/email sends)
* Verification submissions
* Any endpoint that triggers queue jobs with external side effects

### Client header

* `Idempotency-Key: <uuid-or-hash>`

### Server behavior

* Store idempotency record keyed by:

  * tenantId
  * endpoint
  * idempotencyKey
  * request hash (optional)

Rules:

* Same key + same payload returns the same outcome.
* Same key + different payload returns `409 Conflict` with `PAYLOAD_MISMATCH`.

---

## Async Operations & Job Handling

When work is queued (BullMQ), return `202 Accepted` with a job reference:

```json
{
  "success": true,
  "data": {
    "jobId": "job_123",
    "status": "queued"
  },
  "meta": {
    "requestId": "req_..."
  },
  "error": null
}
```

Provide job status endpoint:

* `GET /api/v1/jobs/{jobId}`

Job statuses:

* `queued`
* `running`
* `completed`
* `failed`

Rules:

* All job producers must include retries/backoff.
* Consumers must be idempotent where possible.

---

## Audit Logging (Mandatory for Sensitive Actions)

Audit logs must be written for:

* Verification approvals/rejections
* Payment/escrow actions
* Role/permission changes
* Admin user changes
* Document deletions
* Any destructive action

Audit log fields (minimum):

* `actorUserId`
* `tenantId`
* `action` (string constant)
* `entityType`
* `entityId`
* `timestamp`
* `metadata` (JSON)
* `requestId`

---

## Request Correlation & Observability

### Request ID (mandatory)

Every request must have a `requestId`:

* Accept incoming `X-Request-Id` if present
* Otherwise generate one
* Return it in `meta.requestId`

### Logging

Structured logging only (JSON logs).
At minimum:

* requestId
* tenantId (if any)
* userId (if any)
* route
* statusCode
* durationMs

---

## Rate Limiting

Apply rate limits to:

* auth endpoints (login, 2fa)
* public search endpoints
* file upload endpoints

Return:

* `429 Too Many Requests`
* `error.code = RATE_LIMITED`

---

## Validation

* Validate all incoming requests via DTO + class-validator (or Zod at boundary, but be consistent).
* Return `VALIDATION_ERROR` with details:

```json
"error": {
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid.",
  "action": "Review the highlighted fields and try again.",
  "details": {
    "fields": [
      { "path": "price", "reason": "Must be a positive number" }
    ]
  }
}
```

Rules:

* Never accept unknown fields in strict mode.
* Sanitize strings that will be used in search or logs.

---

## Date/Time & Money Conventions

### Date/time

* Use ISO 8601 UTC timestamps everywhere:

  * `2026-01-25T08:10:00Z`

### Money

* Store money as integer minor units where possible (e.g., pesewas):

  * `amountMinor: 150000` for GHS 1,500.00
* Always include currency:

  * `currency: "GHS"`

---

## Geospatial Conventions (PostGIS)

* Store geometry as `geometry(MultiPolygon, 4326)` where applicable.
* Always specify SRID 4326 for parcel data.
* Derived fields:

  * `bbox` (minLng, minLat, maxLng, maxLat) for quick filtering
* Validate geometry:

  * non-self-intersecting
  * closed polygons
  * reasonable bounds

---

## File Upload Conventions

* Upload flow:

  1. `POST /documents:presign` (get signed URL)
  2. Client uploads to S3/MinIO
  3. `POST /documents:complete` (register metadata)
* Validate:

  * MIME type allowlist
  * size limit
* Return metadata and access URL (signed / time-limited)

---

## Swagger/OpenAPI Standards

* Every endpoint must include:

  * summary
  * auth requirement
  * response schema
  * error cases
* Keep schemas aligned with DTOs.

---

## Backwards Compatibility Rules

Allowed changes within same version:

* Add optional fields
* Add new endpoints
* Add new enum values only if client is tolerant

Not allowed within same version:

* Rename fields
* Change field types
* Remove fields
* Change semantics of status values

---

## Change Log / Decisions (ADR)

All exceptions and additions must be recorded here.

### ADR Template

* **ADR-### Title**

  * Problem:
  * Decision:
  * Alternatives:
  * Consequences:
  * Date:
  * Owner:

### ADR-001 — Standard Response Envelope

* Problem: inconsistent client handling and error rendering.
* Decision: enforce `{ success, data, meta, error }` on all endpoints.
* Alternatives: raw responses; mixed shapes.
* Consequences: predictable client logic, easier observability.
* Date: 2026-01-25
* Owner: Product Engineering

```
```
