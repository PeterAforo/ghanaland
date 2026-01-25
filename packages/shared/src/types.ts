// Ghana Lands - Shared Types

import type {
  AccountStatus,
  LandCategory,
  LandType,
  TenureType,
  ListingStatus,
  VerificationStatus,
  TransactionStatus,
  PaymentStatus,
  PaymentType,
} from './enums';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  meta: ApiMeta;
  error: ApiError | null;
}

export interface ApiMeta {
  requestId: string;
  timestamp?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  nextCursor?: string;
  hasNext?: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  action?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

export interface CurrentUser {
  id: string;
  tenantId: string;
  organizationId?: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
}

// ============================================================================
// User Types
// ============================================================================

export interface UserDto {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  avatarUrl?: string;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

// ============================================================================
// Listing Types
// ============================================================================

export interface ListingDto {
  id: string;
  title: string;
  description?: string;
  category: LandCategory;
  landType: LandType;
  tenureType: TenureType;
  leasePeriodYears?: number;
  sizeAcres: number;
  priceGhs: number;
  currency: string;
  region: string;
  district: string;
  town?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  listingStatus: ListingStatus;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  isFeatured: boolean;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seller?: UserDto;
  media?: ListingMediaDto[];
}

export interface ListingMediaDto {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  order: number;
}

export interface ListingSearchParams {
  query?: string;
  category?: LandCategory;
  landType?: LandType;
  region?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  verificationStatus?: VerificationStatus;
  page?: number;
  limit?: number;
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionDto {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  agreedPriceGhs: number;
  platformFeeGhs: number;
  sellerNetGhs: number;
  status: TransactionStatus;
  escrowStatus?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  listing?: ListingDto;
  buyer?: UserDto;
  seller?: UserDto;
  payments?: PaymentDto[];
}

export interface PaymentDto {
  id: string;
  transactionId: string;
  amountGhs: number;
  type: PaymentType;
  status: PaymentStatus;
  provider: string;
  providerRef?: string;
  paidAt?: string;
  createdAt: string;
}

// ============================================================================
// Verification Types
// ============================================================================

export interface VerificationRequestDto {
  id: string;
  listingId: string;
  requesterId: string;
  status: string;
  notes?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Document Types
// ============================================================================

export interface DocumentDto {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  documentType: string;
  createdAt: string;
  downloadUrl?: string;
}

// ============================================================================
// Queue Job Types
// ============================================================================

export interface BaseJobData {
  tenantId: string;
  requestId: string;
  idempotencyKey?: string;
}

export interface SendSmsJobData extends BaseJobData {
  phone: string;
  message: string;
}

export interface SendEmailJobData extends BaseJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface IndexListingJobData extends BaseJobData {
  listingId: string;
  action: 'create' | 'update' | 'delete';
}

export interface GeneratePdfJobData extends BaseJobData {
  entityType: string;
  entityId: string;
  template: string;
}
