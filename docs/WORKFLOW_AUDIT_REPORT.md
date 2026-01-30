# Workflow Logic Audit Report — Ghana Lands Project

**Date:** 2026-01-27  
**Auditor:** Cascade (Principal Product Engineer)  
**Status:** Completed with fixes applied

---

## Executive Summary

This audit validated that all workflows make sense for every user category and module, following the canonical flows defined in `docs/ux.flows.md`.

**User Categories Tested:** 8  
**Modules Validated:** 8  
**Workflow Issues Found:** 6  
**Issues Fixed:** 5  
**Remaining Issues:** 1

---

## User Categories & Access Matrix

### Role → Module Access Matrix

| Module | Guest | Buyer | Seller | Agent | Professional | Admin | Verifier | Finance |
|--------|-------|-------|--------|-------|--------------|-------|----------|---------|
| Browse Listings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Listing Detail | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Listing | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Make Inquiry | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Initiate Transaction | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Request Verification | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Process Verification | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Submit Permit | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Process Permit | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Browse Professionals | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Request Service | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Provide Service | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Release Escrow | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Workflow Validations by Module

### 1. Auth / Onboarding

**Pattern:** Wizard  
**Status:** ✅ Compliant

| Step | Start | Middle | End | Status |
|------|-------|--------|-----|--------|
| Guest → Login | ✅ | ✅ | ✅ Dashboard | ✅ |
| Guest → Register | ✅ | ✅ | ✅ Dashboard | ✅ |
| Password Reset | ✅ | ✅ | ✅ Login | ✅ |

**RBAC Check:** ✅ Unauthenticated users redirected to login for protected routes

---

### 2. Listings (Create, Publish, Search, Detail)

**Pattern:** Stepper (Create), Browse (Search)  
**Status:** ✅ Compliant

| Flow | Start | Middle | End | Status |
|------|-------|--------|-----|--------|
| Create Listing | ✅ Basics | ✅ Location → Pricing → Media | ✅ Review → Publish | ✅ |
| Edit Listing | ✅ Load | ✅ Edit fields | ✅ Save | ✅ |
| Search Listings | ✅ Filters | ✅ Results | ✅ Detail page | ✅ |
| View Detail | ✅ Load | ✅ Display | ✅ Inquiry/Buy | ✅ |

**State Visibility:** ✅ Verification badge shown, status clear  
**Error Recovery:** ✅ Form validation, error messages

---

### 3. Verification (Request, Timeline, Approve/Reject)

**Pattern:** Stepper (Request), Timeline (Status)  
**Status:** ✅ Compliant

| Flow | Start | Middle | End | Status |
|------|-------|--------|-----|--------|
| Request Verification | ✅ Select listing | ✅ Upload docs | ✅ Submit | ✅ |
| View Timeline | ✅ Load | ✅ Show stages | ✅ Current status | ✅ |
| Admin Approve | ✅ Review | ✅ Confirm | ✅ Update status | ✅ |
| Admin Reject | ✅ Review | ✅ Add reason | ✅ Update + notify | ✅ |

**Verification Seal:** ✅ Only displayed when `status === 'VERIFIED'`  
**Audit Trail:** ✅ All decisions logged with timestamp, actor, reason

---

### 4. Payments / Escrow

**Pattern:** Review → Confirm → Submit  
**Status:** ✅ Compliant

| Flow | Start | Middle | End | Status |
|------|-------|--------|-----|--------|
| Initiate Payment | ✅ Review terms | ✅ Confirm | ✅ Redirect to provider | ✅ |
| Payment Callback | ✅ Receive | ✅ Validate | ✅ Update status | ✅ |
| View Receipt | ✅ Load | ✅ Display | ✅ Download | ✅ |
| Escrow Release | ✅ Admin checklist | ✅ Verify docs | ✅ Release funds | ✅ |

**Processing State:** ✅ Shows "Processing" during async operations  
**Idempotency:** ✅ Payment callbacks check existing status  
**Safe Return:** ✅ User can leave page during processing

---

### 5. Documents (Upload, Attach, Download)

**Pattern:** Direct Action  
**Status:** ✅ Compliant

| Flow | Start | Middle | End | Status |
|------|-------|--------|-----|--------|
| Upload Document | ✅ Select file | ✅ Upload to Cloudinary | ✅ Attach to entity | ✅ |
| Download Document | ✅ Click | ✅ Auth check | ✅ Serve file | ✅ |
| Delete Document | ✅ Click | ✅ Confirm | ✅ Remove | ✅ |

**Access Control:** ✅ Documents checked against user permissions

---

### 6. Permits (Submit, Status Timeline, Requests for Info)

**Pattern:** Stepper  
**Status:** ✅ Compliant

| Flow | Start | Middle | End | Status |
|------|-------|--------|-----|--------|
| Create Application | ✅ Applicant | ✅ Property → Docs | ✅ Review → Submit | ✅ |
| View Status | ✅ Load | ✅ Timeline | ✅ Current stage | ✅ |
| Respond to RFI | ✅ View request | ✅ Upload docs | ✅ Resubmit | ✅ |
| Admin Review | ✅ Load | ✅ Review docs | ✅ Approve/Reject/RFI | ✅ |

**Status Timeline:** ✅ Clear progression shown  
**Next Steps:** ✅ Each status shows what happens next

---

### 7. Professional Services Marketplace

**Pattern:** Browse → Request → Confirm  
**Status:** ✅ Compliant (after fixes)

| Flow | Start | Middle | End | Status |
|------|-------|--------|-----|--------|
| Browse Professionals | ✅ Filters | ✅ List | ✅ Profile detail | ✅ |
| Request Service | ✅ Select service | ✅ Describe need | ✅ Submit request | ✅ |
| Accept Request (Pro) | ✅ View request | ✅ Set price | ✅ Accept | ✅ |
| Fund Escrow (Client) | ✅ Review price | ✅ Pay | ✅ Escrow funded | ✅ |
| Upload Input Docs | ✅ Select docs | ✅ Upload | ✅ Confirm | ✅ |
| Confirm Docs Received | ✅ Review | ✅ Validate | ✅ Start work | ✅ |
| Upload Deliverables | ✅ Select files | ✅ Upload | ✅ Mark delivered | ✅ |
| Accept Work (Client) | ✅ Review | ✅ Confirm | ✅ Pending release | ✅ |
| Release Escrow (Admin) | ✅ Checklist | ✅ Verify all | ✅ Release funds | ✅ |

**Fixes Applied:**
- ⚠️ **Issue:** Escrow release was dual-party (client + professional)
- ✅ **Fix:** Changed to admin-controlled with checklist verification
- ⚠️ **Issue:** No validation of required documents before progression
- ✅ **Fix:** Added document validation before DOCUMENTS_RECEIVED and DELIVERABLES_UPLOADED

---

### 8. Admin (RBAC, Audit Logs, Approvals)

**Pattern:** Standard Tables + Confirm for Destructive  
**Status:** ⚠️ Partial (Audit Logs UI missing)

| Flow | Start | Middle | End | Status |
|------|-------|--------|-----|--------|
| View Users | ✅ Load | ✅ Filter/Search | ✅ Actions | ✅ |
| View Listings | ✅ Load | ✅ Filter | ✅ Approve/Suspend | ✅ |
| View Transactions | ✅ Load | ✅ Filter | ✅ Release escrow | ✅ |
| View Verifications | ✅ Load | ✅ Review | ✅ Approve/Reject | ✅ |
| View Permits | ✅ Load | ✅ Review | ✅ Approve/Reject/RFI | ✅ |
| View Service Requests | ✅ Load | ✅ Checklist | ✅ Release escrow | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | Missing UI |

**Destructive Actions:** ✅ All require confirmation  
**Audit Trail:** ✅ Decisions logged with actor, timestamp, reason

---

## Workflow Issues Found & Fixed

### Issue 1: Professional Service Escrow Release
**Problem:** Dual-party confirmation (client + professional) allowed collusion  
**Fix:** Changed to admin-controlled release with document checklist  
**Files Modified:**
- `professionals.service.ts` - New admin release flow
- `professionals.controller.ts` - Admin endpoints
- `service-requests/[id]/page.tsx` - Updated UI to show "Pending Admin Review"

### Issue 2: Missing Document Validation
**Problem:** Workflow could progress without required documents uploaded  
**Fix:** Added validation in `validateConfirmation()` method  
**Files Modified:**
- `professionals.service.ts` - Added `getRequiredInputDocsForType()` and `getRequiredOutputDocsForType()`

### Issue 3: Admin Endpoints Without RBAC
**Problem:** Admin endpoints only checked JWT, not admin role  
**Fix:** Added `requireAdmin()` helper and role checks  
**Files Modified:**
- `professionals.service.ts` - Added admin role check
- `professionals.controller.ts` - Pass userId to admin methods

### Issue 4: Missing Admin Service Requests Page
**Problem:** No UI for admin to manage service requests  
**Fix:** Created admin service requests list and detail pages  
**Files Created:**
- `apps/web/src/app/(admin)/admin/service-requests/page.tsx`
- `apps/web/src/app/(admin)/admin/service-requests/[id]/page.tsx`

### Issue 5: Service Request Not Linked to Land Journey
**Problem:** Service requests didn't show connection to land journey  
**Fix:** Added `landJourneyStage` display in service request detail  
**Files Modified:**
- `service-requests/[id]/page.tsx` - Added journey stage section

### Issue 6: Audit Logs UI Missing
**Problem:** No admin UI to view audit logs  
**Status:** ⚠️ Remaining - Requires separate implementation  
**Recommendation:** Create `/admin/audit-logs` page with filtering

---

## RBAC Validation

### Route Protection

| Route Pattern | Required Role | Enforced | Status |
|---------------|---------------|----------|--------|
| `/dashboard/*` | Authenticated | ✅ UI + API | ✅ |
| `/admin/*` | Admin | ✅ UI + API | ✅ |
| `/api/v1/admin/*` | Admin | ✅ API | ✅ |
| `/api/v1/professionals/admin/*` | Admin | ✅ API | ✅ |

### API Authorization

| Endpoint Pattern | Check | Status |
|------------------|-------|--------|
| User-specific resources | `userId === req.user.id` | ✅ |
| Listing owner actions | `sellerId === req.user.id` | ✅ |
| Professional actions | `professional.userId === req.user.id` | ✅ |
| Admin actions | `requireAdmin(userId)` | ✅ |

---

## Error Recovery Validation

| Flow | Error Type | Recovery Path | Status |
|------|------------|---------------|--------|
| Payment Failed | Provider error | Retry button + support link | ✅ |
| Upload Failed | Network/size | Error message + retry | ✅ |
| Form Validation | Invalid input | Field-level errors | ✅ |
| Auth Expired | Token expired | Redirect to login | ✅ |
| Permission Denied | RBAC | Error message + redirect | ✅ |

---

## Confirmation Dialogs Validation

| Action | Confirmation Required | Implemented | Status |
|--------|----------------------|-------------|--------|
| Delete Listing | ✅ | ✅ | ✅ |
| Reject Verification | ✅ | ✅ | ✅ |
| Release Escrow | ✅ | ✅ | ✅ |
| Cancel Transaction | ✅ | ✅ | ✅ |
| Delete Document | ✅ | ✅ | ✅ |
| Suspend User | ✅ | ✅ | ✅ |

---

## Micro-Reassurance Copy Validation

| Zone | Required Copy | Present | Status |
|------|---------------|---------|--------|
| Payments | "Secure payment via Hubtel/Flutterwave" | ✅ | ✅ |
| Verification | "Verification status is logged and auditable" | ✅ | ✅ |
| Uploads | "Files are stored securely" | ✅ | ✅ |
| Escrow | "Funds held securely until work complete" | ✅ | ✅ |

---

## Remaining Issues

| Issue | Priority | Recommendation |
|-------|----------|----------------|
| Audit Logs UI | Medium | Create `/admin/audit-logs` page |

---

## Definition of Done Checklist

- [x] Each flow has clear start, middle, end (no dead ends)
- [x] Each screen shows next step and status clearly
- [x] RBAC matches role expectations (no forbidden access)
- [x] Error recovery exists at every critical step
- [x] High-risk actions include confirmation + audit trail
- [x] Verification seal displayed only when verified
- [x] Payment flow includes "processing" state
- [x] Mobile responsiveness verified
- [x] Dark mode supported

---

**Audit Complete**
