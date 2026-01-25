// Ghana Lands - Shared Constants

// ============================================================================
// Ghana Regions & Districts
// ============================================================================

export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
  'Oti',
  'North East',
  'Savannah',
] as const;

export type GhanaRegion = (typeof GHANA_REGIONS)[number];

// ============================================================================
// Queue Names
// ============================================================================

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  DOCUMENTS: 'documents',
  EXPORTS: 'exports',
  SEARCH: 'search',
  VERIFICATION: 'verification',
} as const;

// ============================================================================
// Job Names
// ============================================================================

export const JOB_NAMES = {
  SEND_SMS: 'notifications.send_sms',
  SEND_EMAIL: 'notifications.send_email',
  PROCESS_DOCUMENT: 'documents.process',
  GENERATE_PDF: 'exports.generate_pdf',
  GENERATE_EXCEL: 'exports.generate_excel',
  INDEX_LISTING: 'search.index_listing',
  RUN_VERIFICATION_CHECKS: 'verification.run_checks',
} as const;

// ============================================================================
// API Error Codes
// ============================================================================

export const ERROR_CODES = {
  // Auth
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',
  TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',
  TWO_FACTOR_INVALID: 'TWO_FACTOR_INVALID',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  ILLEGAL_STATE_TRANSITION: 'ILLEGAL_STATE_TRANSITION',

  // Payments
  PAYMENT_INIT_FAILED: 'PAYMENT_INIT_FAILED',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_DUPLICATE: 'PAYMENT_DUPLICATE',
  ESCROW_RELEASE_NOT_ALLOWED: 'ESCROW_RELEASE_NOT_ALLOWED',

  // Documents
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',

  // Verification
  VERIFICATION_ALREADY_SUBMITTED: 'VERIFICATION_ALREADY_SUBMITTED',
  VERIFICATION_NOT_ALLOWED: 'VERIFICATION_NOT_ALLOWED',
  VERIFICATION_REJECTED: 'VERIFICATION_REJECTED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ============================================================================
// Permissions
// ============================================================================

export const PERMISSIONS = {
  // Listings
  LISTING_CREATE: 'listing:create',
  LISTING_READ: 'listing:read',
  LISTING_UPDATE: 'listing:update',
  LISTING_DELETE: 'listing:delete',
  LISTING_PUBLISH: 'listing:publish',
  LISTING_MODERATE: 'listing:moderate',

  // Transactions
  TRANSACTION_CREATE: 'transaction:create',
  TRANSACTION_READ: 'transaction:read',
  TRANSACTION_UPDATE: 'transaction:update',
  TRANSACTION_RELEASE: 'transaction:release',
  TRANSACTION_REFUND: 'transaction:refund',

  // Verification
  VERIFICATION_REQUEST: 'verification:request',
  VERIFICATION_REVIEW: 'verification:review',
  VERIFICATION_APPROVE: 'verification:approve',

  // Users
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',

  // Admin
  ADMIN_ACCESS: 'admin:access',
  ADMIN_AUDIT_READ: 'admin:audit_read',
  ADMIN_SETTINGS: 'admin:settings',
} as const;

// ============================================================================
// Default Roles
// ============================================================================

export const DEFAULT_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  VERIFIER: 'verifier',
  SELLER: 'seller',
  BUYER: 'buyer',
  AGENT: 'agent',
  PROFESSIONAL: 'professional',
} as const;

// ============================================================================
// Platform Fees
// ============================================================================

export const PLATFORM_FEES = {
  DEFAULT_PERCENTAGE: 5,
  MIN_FEE_GHS: 50,
  MAX_FEE_GHS: 50000,
} as const;

// ============================================================================
// File Upload Limits
// ============================================================================

export const FILE_LIMITS = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_DOCUMENT_SIZE_MB: 25,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

// ============================================================================
// Pagination Defaults
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
