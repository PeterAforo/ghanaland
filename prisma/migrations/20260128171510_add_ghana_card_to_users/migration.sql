-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "LandCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE');

-- CreateEnum
CREATE TYPE "LandType" AS ENUM ('CUSTOMARY', 'TITLED', 'LEASEHOLD', 'FREEHOLD', 'GOVERNMENT');

-- CreateEnum
CREATE TYPE "TenureType" AS ENUM ('FREEHOLD', 'LEASEHOLD', 'CUSTOMARY');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PUBLISHED', 'SUSPENDED', 'REJECTED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "VerificationRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('CREATED', 'ESCROW_FUNDED', 'VERIFICATION_PERIOD', 'DISPUTED', 'READY_TO_RELEASE', 'RELEASED', 'REFUNDED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING', 'FUNDED', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ESCROW_DEPOSIT', 'INSTALLMENT', 'PLATFORM_FEE', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SITE_PLAN', 'TITLE_DEED', 'INDENTURE', 'SURVEY_REPORT', 'ID_DOCUMENT', 'PROOF_OF_OWNERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'READ', 'REPLIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('TRANSACTION', 'PAYMENT', 'VERIFICATION', 'LISTING', 'INQUIRY', 'ESCROW', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ServiceDocumentType" AS ENUM ('INPUT', 'DELIVERABLE', 'REFERENCE', 'CONTRACT');

-- CreateEnum
CREATE TYPE "ServiceDocumentCategory" AS ENUM ('LAND_TITLE', 'SITE_PLAN', 'INDENTURE', 'ID_DOCUMENT', 'PROOF_OF_OWNERSHIP', 'SURVEY_REPORT', 'VALUATION_REPORT', 'ARCHITECTURAL_DRAWING', 'BUILDING_PERMIT', 'OTHER_INPUT', 'SURVEY_PLAN', 'LEGAL_OPINION', 'DRAFT_INDENTURE', 'FINAL_INDENTURE', 'ARCHITECTURAL_DESIGN', 'STRUCTURAL_DESIGN', 'VALUATION_CERTIFICATE', 'PERMIT_APPLICATION', 'INSPECTION_REPORT', 'OTHER_DELIVERABLE');

-- CreateEnum
CREATE TYPE "ConfirmationRole" AS ENUM ('CLIENT', 'PROFESSIONAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "ConfirmationType" AS ENUM ('DOCUMENTS_RECEIVED', 'WORK_STARTED', 'DELIVERABLES_UPLOADED', 'WORK_ACCEPTED', 'PAYMENT_RELEASED', 'ESCROW_RELEASED');

-- CreateEnum
CREATE TYPE "ProfessionalType" AS ENUM ('AGENT', 'SURVEYOR', 'ARCHITECT', 'LAWYER', 'ENGINEER', 'VALUER', 'PLANNER');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'HOURLY', 'NEGOTIABLE');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'ESCROW_FUNDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ServicePaymentStatus" AS ENUM ('UNPAID', 'ESCROW_PENDING', 'ESCROW_FUNDED', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PermitType" AS ENUM ('BUILDING_PERMIT', 'LAND_USE_PERMIT', 'DEVELOPMENT_PERMIT', 'SUBDIVISION_PERMIT', 'OCCUPANCY_PERMIT', 'DEMOLITION_PERMIT', 'RENOVATION_PERMIT');

-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PermitDocumentType" AS ENUM ('SITE_PLAN', 'ARCHITECTURAL_DRAWING', 'STRUCTURAL_DRAWING', 'LAND_TITLE', 'SURVEY_PLAN', 'TAX_CLEARANCE', 'ENVIRONMENTAL_ASSESSMENT', 'ID_DOCUMENT', 'PROOF_OF_OWNERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "LandJourneyStage" AS ENUM ('LAND_ACQUIRED', 'LAND_SEARCH', 'SURVEY_SITE_PLAN', 'INDENTURE_PREPARATION', 'STAMP_DUTY', 'LAND_VALUATION', 'TITLE_REGISTRATION', 'TITLE_CERTIFICATE', 'ARCHITECTURAL_DESIGN', 'STRUCTURAL_DESIGN', 'DEVELOPMENT_PERMIT', 'BUILDING_PERMIT_APPLICATION', 'SITE_INSPECTION', 'TECHNICAL_REVIEW', 'BUILDING_PERMIT_ISSUED', 'READY_TO_BUILD');

-- CreateEnum
CREATE TYPE "JourneyStageStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_PROFESSIONAL', 'PENDING_DOCUMENTS', 'PENDING_APPROVAL', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "LandDocumentType" AS ENUM ('SALE_AGREEMENT', 'PAYMENT_RECEIPT', 'LAND_SEARCH_REPORT', 'SITE_PLAN', 'SURVEY_REPORT', 'INDENTURE', 'CERTIFIED_INDENTURE', 'STAMP_DUTY_RECEIPT', 'VALUATION_REPORT', 'TITLE_CERTIFICATE', 'ARCHITECTURAL_DRAWINGS', 'STRUCTURAL_DRAWINGS', 'ELECTRICAL_DRAWINGS', 'PLUMBING_DRAWINGS', 'DEVELOPMENT_PERMIT', 'BUILDING_PERMIT', 'EPA_PERMIT', 'FIRE_CERTIFICATE', 'NATIONAL_ID', 'PASSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "TierType" AS ENUM ('FREE', 'SELLER_PRO', 'BUYER_PRO', 'AGENT_PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'TRIALING');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "FeaturedType" AS ENUM ('STANDARD', 'PREMIUM', 'SPOTLIGHT');

-- CreateEnum
CREATE TYPE "PriceAlertType" AS ENUM ('PRICE_DROP', 'PRICE_CHANGE', 'BACK_ON_MARKET');

-- CreateEnum
CREATE TYPE "AlertFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "DueDiligenceType" AS ENUM ('BASIC', 'STANDARD', 'COMPREHENSIVE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "VirtualTourType" AS ENUM ('PHOTOS_360', 'VIDEO_WALKTHROUGH', 'MATTERPORT', 'EXTERNAL_LINK');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('BUYER_INQUIRY', 'SELLER_INQUIRY', 'SERVICE_REQUEST', 'GENERAL');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "ghana_card_number" TEXT NOT NULL,
    "ghana_card_verified" BOOLEAN NOT NULL DEFAULT false,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "LandCategory" NOT NULL,
    "land_type" "LandType" NOT NULL,
    "tenure_type" "TenureType" NOT NULL,
    "lease_period_years" INTEGER,
    "size_acres" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "price_ghs" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "plot_length" DOUBLE PRECISION,
    "plot_width" DOUBLE PRECISION,
    "plot_dimension_unit" TEXT DEFAULT 'FEET',
    "total_plots" INTEGER,
    "available_plots" INTEGER,
    "price_per_plot" DECIMAL(15,2),
    "allow_one_time_payment" BOOLEAN NOT NULL DEFAULT true,
    "allow_installments" BOOLEAN NOT NULL DEFAULT false,
    "installment_packages" JSONB,
    "land_access_percentage" INTEGER,
    "site_plan_access_percentage" INTEGER,
    "document_transfer_percentage" INTEGER,
    "region" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "constituency" TEXT,
    "town" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geometry" geometry(MultiPolygon, 4326),
    "bbox" geometry(Polygon, 4326),
    "listing_status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verified_at" TIMESTAMP(3),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_media" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "status" "VerificationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "rejection_reason" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "agreed_price_ghs" DECIMAL(15,2) NOT NULL,
    "platform_fee_ghs" DECIMAL(15,2) NOT NULL,
    "seller_net_ghs" DECIMAL(15,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'CREATED',
    "escrow_status" "EscrowStatus",
    "payment_type" TEXT DEFAULT 'ONE_TIME',
    "plot_count" INTEGER DEFAULT 1,
    "installment_schedule" JSONB,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount_ghs" DECIMAL(15,2) NOT NULL,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "provider" TEXT NOT NULL DEFAULT 'hubtel',
    "provider_ref" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "uploader_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "verification_request_id" TEXT,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "request_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "notify_on_new" BOOLEAN NOT NULL DEFAULT true,
    "last_notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_reviews" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ProfessionalType" NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT,
    "years_experience" INTEGER,
    "license_number" TEXT,
    "license_verified" BOOLEAN NOT NULL DEFAULT false,
    "regions" TEXT[],
    "languages" TEXT[] DEFAULT ARRAY['English']::TEXT[],
    "hourly_rate_ghs" DECIMAL(12,2),
    "fixed_rate_ghs" DECIMAL(12,2),
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog" (
    "id" TEXT NOT NULL,
    "professional_type" "ProfessionalType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_ghs" DECIMAL(12,2) NOT NULL,
    "duration_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_services" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "catalog_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_ghs" DECIMAL(12,2) NOT NULL,
    "price_type" "PriceType" NOT NULL DEFAULT 'FIXED',
    "duration_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "service_id" TEXT,
    "listing_id" TEXT,
    "description" TEXT NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "agreed_price_ghs" DECIMAL(12,2),
    "platform_fee_ghs" DECIMAL(12,2),
    "professional_net_ghs" DECIMAL(12,2),
    "payment_status" "ServicePaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "escrow_funded_at" TIMESTAMP(3),
    "escrow_released_at" TIMESTAMP(3),
    "payment_reference" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "client_confirmed_work" BOOLEAN NOT NULL DEFAULT false,
    "professional_confirmed_work" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_milestones" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_documents" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "type" "ServiceDocumentType" NOT NULL,
    "category" "ServiceDocumentCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_confirmations" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "ConfirmationRole" NOT NULL,
    "type" "ConfirmationType" NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_reviews" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permit_applications" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "type" "PermitType" NOT NULL,
    "status" "PermitStatus" NOT NULL DEFAULT 'DRAFT',
    "reference_number" TEXT,
    "property_address" TEXT NOT NULL,
    "property_region" TEXT NOT NULL,
    "property_district" TEXT NOT NULL,
    "plot_number" TEXT,
    "land_size" DECIMAL(12,4),
    "land_size_unit" TEXT DEFAULT 'acres',
    "project_description" TEXT,
    "building_type" TEXT,
    "number_of_floors" INTEGER,
    "estimated_cost" DECIMAL(14,2),
    "application_fee" DECIMAL(12,2),
    "fee_paid" BOOLEAN NOT NULL DEFAULT false,
    "fee_paid_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "review_started_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "admin_notes" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permit_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permit_documents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "type" "PermitDocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "notes" TEXT,

    CONSTRAINT "permit_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permit_status_history" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "from_status" "PermitStatus",
    "to_status" "PermitStatus" NOT NULL,
    "changed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permit_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lands" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "region" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "plot_number" TEXT,
    "land_size" DECIMAL(12,2),
    "land_size_unit" TEXT DEFAULT 'acres',
    "gps_address" TEXT,
    "coordinates" JSONB,
    "purchase_date" TIMESTAMP(3),
    "purchase_price" DECIMAL(15,2),
    "seller_name" TEXT,
    "seller_contact" TEXT,
    "current_stage" "LandJourneyStage" NOT NULL DEFAULT 'LAND_ACQUIRED',
    "journey_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "journey_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_lands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_journey_stages" (
    "id" TEXT NOT NULL,
    "land_id" TEXT NOT NULL,
    "stage" "LandJourneyStage" NOT NULL,
    "status" "JourneyStageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "service_request_id" TEXT,
    "professional_id" TEXT,
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_journey_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_documents" (
    "id" TEXT NOT NULL,
    "land_id" TEXT NOT NULL,
    "stage" "LandJourneyStage" NOT NULL,
    "document_type" "LandDocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "notes" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "land_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "tier_type" "TierType" NOT NULL,
    "price_monthly_ghs" DECIMAL(10,2) NOT NULL,
    "price_yearly_ghs" DECIMAL(10,2) NOT NULL,
    "features" JSONB NOT NULL,
    "limits" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "payment_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_listings" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "featured_type" "FeaturedType" NOT NULL DEFAULT 'STANDARD',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "amount_paid_ghs" DECIMAL(10,2) NOT NULL,
    "payment_reference" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "featured_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_analytics" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "unique_views" INTEGER NOT NULL DEFAULT 0,
    "inquiries" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "phone_clicks" INTEGER NOT NULL DEFAULT 0,
    "map_views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "listing_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "target_price" DECIMAL(15,2) NOT NULL,
    "alert_type" "PriceAlertType" NOT NULL DEFAULT 'PRICE_DROP',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_search_alerts" (
    "id" TEXT NOT NULL,
    "saved_search_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "frequency" "AlertFrequency" NOT NULL DEFAULT 'INSTANT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sent_at" TIMESTAMP(3),
    "match_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_search_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "due_diligence_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "land_id" TEXT,
    "report_type" "DueDiligenceType" NOT NULL DEFAULT 'BASIC',
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "report_data" JSONB,
    "pdf_url" TEXT,
    "amount_paid_ghs" DECIMAL(10,2),
    "payment_reference" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "due_diligence_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_tours" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "tour_type" "VirtualTourType" NOT NULL DEFAULT 'PHOTOS_360',
    "tour_url" TEXT,
    "embed_code" TEXT,
    "media_urls" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "permissions" JSONB,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "rate_limit" INTEGER NOT NULL DEFAULT 1000,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_inquiries" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "inquiry_type" "LeadType" NOT NULL,
    "source_listing_id" TEXT,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "converted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "listings_tenant_id_idx" ON "listings"("tenant_id");

-- CreateIndex
CREATE INDEX "listings_seller_id_idx" ON "listings"("seller_id");

-- CreateIndex
CREATE INDEX "listings_listing_status_idx" ON "listings"("listing_status");

-- CreateIndex
CREATE INDEX "listings_verification_status_idx" ON "listings"("verification_status");

-- CreateIndex
CREATE INDEX "listings_region_district_idx" ON "listings"("region", "district");

-- CreateIndex
CREATE INDEX "listings_category_idx" ON "listings"("category");

-- CreateIndex
CREATE INDEX "listings_price_ghs_idx" ON "listings"("price_ghs");

-- CreateIndex
CREATE INDEX "listing_media_listing_id_idx" ON "listing_media"("listing_id");

-- CreateIndex
CREATE INDEX "verification_requests_listing_id_idx" ON "verification_requests"("listing_id");

-- CreateIndex
CREATE INDEX "verification_requests_status_idx" ON "verification_requests"("status");

-- CreateIndex
CREATE INDEX "transactions_listing_id_idx" ON "transactions"("listing_id");

-- CreateIndex
CREATE INDEX "transactions_buyer_id_idx" ON "transactions"("buyer_id");

-- CreateIndex
CREATE INDEX "transactions_seller_id_idx" ON "transactions"("seller_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_transaction_id_idx" ON "payments"("transaction_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_idempotency_key_idx" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "documents_uploader_id_idx" ON "documents"("uploader_id");

-- CreateIndex
CREATE INDEX "documents_listing_id_idx" ON "documents"("listing_id");

-- CreateIndex
CREATE INDEX "documents_verification_request_id_idx" ON "documents"("verification_request_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_reviews_transaction_id_key" ON "seller_reviews"("transaction_id");

-- CreateIndex
CREATE INDEX "seller_reviews_seller_id_idx" ON "seller_reviews"("seller_id");

-- CreateIndex
CREATE INDEX "seller_reviews_buyer_id_idx" ON "seller_reviews"("buyer_id");

-- CreateIndex
CREATE INDEX "seller_reviews_rating_idx" ON "seller_reviews"("rating");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE INDEX "favorites_listing_id_idx" ON "favorites"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_listing_id_key" ON "favorites"("user_id", "listing_id");

-- CreateIndex
CREATE INDEX "inquiries_listing_id_idx" ON "inquiries"("listing_id");

-- CreateIndex
CREATE INDEX "inquiries_sender_id_idx" ON "inquiries"("sender_id");

-- CreateIndex
CREATE INDEX "inquiries_seller_id_idx" ON "inquiries"("seller_id");

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_user_id_key" ON "professional_profiles"("user_id");

-- CreateIndex
CREATE INDEX "professional_profiles_type_idx" ON "professional_profiles"("type");

-- CreateIndex
CREATE INDEX "professional_profiles_is_available_idx" ON "professional_profiles"("is_available");

-- CreateIndex
CREATE INDEX "professional_profiles_rating_idx" ON "professional_profiles"("rating");

-- CreateIndex
CREATE INDEX "service_catalog_professional_type_idx" ON "service_catalog"("professional_type");

-- CreateIndex
CREATE INDEX "service_catalog_is_active_idx" ON "service_catalog"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "service_catalog_professional_type_name_key" ON "service_catalog"("professional_type", "name");

-- CreateIndex
CREATE INDEX "professional_services_profile_id_idx" ON "professional_services"("profile_id");

-- CreateIndex
CREATE INDEX "professional_services_catalog_id_idx" ON "professional_services"("catalog_id");

-- CreateIndex
CREATE INDEX "service_requests_client_id_idx" ON "service_requests"("client_id");

-- CreateIndex
CREATE INDEX "service_requests_professional_id_idx" ON "service_requests"("professional_id");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "service_requests_payment_status_idx" ON "service_requests"("payment_status");

-- CreateIndex
CREATE INDEX "service_milestones_request_id_idx" ON "service_milestones"("request_id");

-- CreateIndex
CREATE INDEX "service_request_documents_request_id_idx" ON "service_request_documents"("request_id");

-- CreateIndex
CREATE INDEX "service_request_documents_uploaded_by_id_idx" ON "service_request_documents"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "service_confirmations_request_id_idx" ON "service_confirmations"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_confirmations_request_id_user_id_type_key" ON "service_confirmations"("request_id", "user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "professional_reviews_request_id_key" ON "professional_reviews"("request_id");

-- CreateIndex
CREATE INDEX "professional_reviews_profile_id_idx" ON "professional_reviews"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "permit_applications_reference_number_key" ON "permit_applications"("reference_number");

-- CreateIndex
CREATE INDEX "permit_applications_applicant_id_idx" ON "permit_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "permit_applications_status_idx" ON "permit_applications"("status");

-- CreateIndex
CREATE INDEX "permit_applications_type_idx" ON "permit_applications"("type");

-- CreateIndex
CREATE INDEX "permit_applications_reference_number_idx" ON "permit_applications"("reference_number");

-- CreateIndex
CREATE INDEX "permit_documents_application_id_idx" ON "permit_documents"("application_id");

-- CreateIndex
CREATE INDEX "permit_status_history_application_id_idx" ON "permit_status_history"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_lands_transaction_id_key" ON "user_lands"("transaction_id");

-- CreateIndex
CREATE INDEX "user_lands_user_id_idx" ON "user_lands"("user_id");

-- CreateIndex
CREATE INDEX "user_lands_current_stage_idx" ON "user_lands"("current_stage");

-- CreateIndex
CREATE INDEX "land_journey_stages_land_id_idx" ON "land_journey_stages"("land_id");

-- CreateIndex
CREATE INDEX "land_journey_stages_status_idx" ON "land_journey_stages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "land_journey_stages_land_id_stage_key" ON "land_journey_stages"("land_id", "stage");

-- CreateIndex
CREATE INDEX "land_documents_land_id_idx" ON "land_documents"("land_id");

-- CreateIndex
CREATE INDEX "land_documents_stage_idx" ON "land_documents"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_user_id_plan_id_key" ON "user_subscriptions"("user_id", "plan_id");

-- CreateIndex
CREATE INDEX "featured_listings_listing_id_idx" ON "featured_listings"("listing_id");

-- CreateIndex
CREATE INDEX "featured_listings_user_id_idx" ON "featured_listings"("user_id");

-- CreateIndex
CREATE INDEX "featured_listings_end_date_idx" ON "featured_listings"("end_date");

-- CreateIndex
CREATE INDEX "listing_analytics_listing_id_idx" ON "listing_analytics"("listing_id");

-- CreateIndex
CREATE INDEX "listing_analytics_date_idx" ON "listing_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "listing_analytics_listing_id_date_key" ON "listing_analytics"("listing_id", "date");

-- CreateIndex
CREATE INDEX "price_alerts_user_id_idx" ON "price_alerts"("user_id");

-- CreateIndex
CREATE INDEX "price_alerts_listing_id_idx" ON "price_alerts"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_alerts_user_id_listing_id_alert_type_key" ON "price_alerts"("user_id", "listing_id", "alert_type");

-- CreateIndex
CREATE INDEX "saved_search_alerts_user_id_idx" ON "saved_search_alerts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_search_alerts_saved_search_id_key" ON "saved_search_alerts"("saved_search_id");

-- CreateIndex
CREATE INDEX "due_diligence_reports_user_id_idx" ON "due_diligence_reports"("user_id");

-- CreateIndex
CREATE INDEX "due_diligence_reports_listing_id_idx" ON "due_diligence_reports"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_tours_listing_id_key" ON "virtual_tours"("listing_id");

-- CreateIndex
CREATE INDEX "team_members_owner_id_idx" ON "team_members"("owner_id");

-- CreateIndex
CREATE INDEX "team_members_member_id_idx" ON "team_members"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_owner_id_member_id_key" ON "team_members"("owner_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "lead_inquiries_professional_id_idx" ON "lead_inquiries"("professional_id");

-- CreateIndex
CREATE INDEX "lead_inquiries_status_idx" ON "lead_inquiries"("status");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_verification_request_id_fkey" FOREIGN KEY ("verification_request_id") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "service_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "professional_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_milestones" ADD CONSTRAINT "service_milestones_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_documents" ADD CONSTRAINT "service_request_documents_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_documents" ADD CONSTRAINT "service_request_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_confirmations" ADD CONSTRAINT "service_confirmations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_confirmations" ADD CONSTRAINT "service_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_reviews" ADD CONSTRAINT "professional_reviews_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_reviews" ADD CONSTRAINT "professional_reviews_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_reviews" ADD CONSTRAINT "professional_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permit_applications" ADD CONSTRAINT "permit_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permit_applications" ADD CONSTRAINT "permit_applications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permit_documents" ADD CONSTRAINT "permit_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "permit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permit_status_history" ADD CONSTRAINT "permit_status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "permit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lands" ADD CONSTRAINT "user_lands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lands" ADD CONSTRAINT "user_lands_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_journey_stages" ADD CONSTRAINT "land_journey_stages_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "user_lands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_journey_stages" ADD CONSTRAINT "land_journey_stages_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_journey_stages" ADD CONSTRAINT "land_journey_stages_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_documents" ADD CONSTRAINT "land_documents_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "user_lands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_listings" ADD CONSTRAINT "featured_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_listings" ADD CONSTRAINT "featured_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_analytics" ADD CONSTRAINT "listing_analytics_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search_alerts" ADD CONSTRAINT "saved_search_alerts_saved_search_id_fkey" FOREIGN KEY ("saved_search_id") REFERENCES "saved_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search_alerts" ADD CONSTRAINT "saved_search_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "due_diligence_reports" ADD CONSTRAINT "due_diligence_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "due_diligence_reports" ADD CONSTRAINT "due_diligence_reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "due_diligence_reports" ADD CONSTRAINT "due_diligence_reports_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "user_lands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_tours" ADD CONSTRAINT "virtual_tours_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_inquiries" ADD CONSTRAINT "lead_inquiries_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_inquiries" ADD CONSTRAINT "lead_inquiries_source_listing_id_fkey" FOREIGN KEY ("source_listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
