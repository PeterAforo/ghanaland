// Ghana Lands - Shared Zod Schemas

import { z } from 'zod';
import {
  LandCategory,
  LandType,
  TenureType,
  ListingStatus,
  VerificationStatus,
  PaymentType,
} from './enums';

// ============================================================================
// Auth Schemas
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

// ============================================================================
// Listing Schemas
// ============================================================================

export const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().max(5000).optional(),
  category: z.nativeEnum(LandCategory),
  landType: z.nativeEnum(LandType),
  tenureType: z.nativeEnum(TenureType),
  leasePeriodYears: z.number().int().positive().optional(),
  sizeAcres: z.number().positive('Size must be positive'),
  priceGhs: z.number().positive('Price must be positive'),
  region: z.string().min(1, 'Region is required'),
  district: z.string().min(1, 'District is required'),
  town: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const listingSearchSchema = z.object({
  query: z.string().optional(),
  category: z.nativeEnum(LandCategory).optional(),
  landType: z.nativeEnum(LandType).optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minSize: z.coerce.number().positive().optional(),
  maxSize: z.coerce.number().positive().optional(),
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================================================
// Transaction Schemas
// ============================================================================

export const createTransactionSchema = z.object({
  listingId: z.string().cuid(),
  agreedPriceGhs: z.number().positive(),
});

export const initiatePaymentSchema = z.object({
  transactionId: z.string().cuid(),
  type: z.nativeEnum(PaymentType),
  amountGhs: z.number().positive(),
  idempotencyKey: z.string().uuid(),
});

// ============================================================================
// Verification Schemas
// ============================================================================

export const createVerificationRequestSchema = z.object({
  listingId: z.string().cuid(),
  notes: z.string().max(2000).optional(),
});

export const reviewVerificationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(2000).optional(),
  rejectionReason: z.string().max(1000).optional(),
});

// ============================================================================
// Document Schemas
// ============================================================================

export const uploadDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  documentType: z.string(),
  listingId: z.string().cuid().optional(),
  verificationRequestId: z.string().cuid().optional(),
});

// ============================================================================
// Pagination Schema
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingSearchInput = z.infer<typeof listingSearchSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type CreateVerificationRequestInput = z.infer<typeof createVerificationRequestSchema>;
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
