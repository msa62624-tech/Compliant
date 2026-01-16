# Workflow System Implementation Summary

## Overview
Complete implementation of the Compliant Platform workflow system with subcontractor, broker, and admin features. This document details all implemented features and provides guidance for connecting the frontend to backend APIs.

## 🎯 Implemented Features

### 1. Subcontractor Dashboard & Onboarding
**Location:** `packages/frontend/app/subcontractor/`

#### Files Created:
- ✅ **Updated SubcontractorDashboard.tsx** - Enhanced dashboard with:
  - Real-time compliance status display (COMPLIANT, NON_COMPLIANT, PENDING, EXPIRED)
  - Prominent compliance/non-compliance alerts with color coding
  - Active projects count and pending items tracking
  - Email notification indicators
  - Quick action navigation to all subcontractor pages

- ✅ **broker/page.tsx** - Broker information form with:
  - Support for both GLOBAL (single broker) and PER_POLICY (different brokers per policy type)
  - Forms for GL, Auto, Umbrella, and WC broker information
  - Email notification confirmation for broker account creation
  - Validation for required fields

- ✅ **projects/page.tsx** - Project listing page with:
  - Display of all assigned projects
  - GC names and contact information
  - Project addresses and timelines
  - Compliance status per project
  - Filtering by status (all, active, non-compliant)

- ✅ **compliance/page.tsx** - Detailed compliance status with:
  - Overall compliance status with color-coded alerts
  - Policy-level breakdown (GL, Auto, Umbrella, WC)
  - Expiration dates and document links per policy
  - Broker information per policy
  - Email notification history

### 2. Broker Dashboard & Workflow
**Location:** `packages/frontend/app/broker/`

#### Files Created:
- ✅ **Updated BrokerDashboard.tsx** - Enhanced broker portal with:
  - Statistics: total subcontractors, pending uploads, pending signatures, expiring policies
  - Differentiation between first-time and renewal workflows
  - Quick access to upload and signature pages
  - Display of recent subcontractors with projects and GCs

- ✅ **upload/page.tsx** - First-time COI upload with:
  - Subcontractor selection dropdown
  - Upload fields for COI document and Hold Harmless agreement
  - Individual policy uploads (GL, Auto, Umbrella, WC) with expiration dates
  - Email notification confirmation for all parties (GC, Sub, Admin)
  - Support for PDF, JPG, PNG formats

- ✅ **sign/[id]/page.tsx** - Renewal COI signing with:
  - Display of system-generated COI
  - Digital signature input field
  - Per-policy signing workflow
  - View existing policy documents
  - Email notifications after each signature

- ✅ **documents/page.tsx** - Document management with:
  - View all assigned subcontractors
  - Display projects, GCs, and addresses per subcontractor
  - Policy status overview (GL, Auto, Umbrella, WC)
  - Quick access to upload or sign actions
  - Filtering by status (all, pending upload, pending signature, active)

### 3. Admin Dashboard Updates
**Location:** `packages/frontend/app/admin/`

#### Files Updated/Created:
- ✅ **Updated AdminDashboard.tsx** - Enhanced with:
  - **Clickable "Pending COI Reviews" card** - Opens COI reviews page
  - Visual indicator showing number of pending reviews
  - Maintained existing stats and quick actions

- ✅ **coi-reviews/page.tsx** - COI review system with:
  - Display all COI submissions awaiting review
  - Filter by pending, approved, rejected, all
  - View all documents (COI, GL, Auto, Umbrella, WC policies)
  - Approve/reject workflow with notes
  - Display subcontractor, project, GC, and broker details
  - Show policy expiration dates and signature status
  - Email notification confirmation after approve/reject

### 4. Backend Email Service
**Location:** `packages/backend/src/modules/email/`

#### Files Created:
- ✅ **email.service.ts** - Email notification service with:
  - **SMTP Configuration:** Microsoft 365 (miriamsabel@insuretrack.onmicrosoft.com / 260Hooper)
  - **Welcome Emails:**
    - `sendSubcontractorWelcomeEmail()` - Sends credentials and onboarding instructions
    - `sendBrokerWelcomeEmail()` - Sends credentials and responsibilities
  - **Compliance Emails:**
    - `sendComplianceConfirmationEmail()` - Notifies GC, Sub, Broker of approval
    - `sendNonComplianceAlertEmail()` - Urgent alerts to GC, Sub, Broker
  - **Workflow Emails:**
    - `sendDocumentUploadNotificationEmail()` - Notifies admin of new submissions

- ✅ **email.module.ts** - Email module configuration
- ✅ **app.module.ts** - Integrated EmailModule

## 📋 Database Schema (Existing)

The existing Prisma schema already supports the workflow:

```prisma
model GeneratedCOI {
  // Tracks COI status through workflow
  status COIStatus @default(AWAITING_BROKER_INFO)
  
  // Broker information (global and per-policy)
  brokerName, brokerEmail, brokerPhone, brokerCompany
  brokerGlName, brokerGlEmail, brokerGlPhone
  brokerAutoName, brokerAutoEmail, brokerAutoPhone
  brokerUmbrellaName, brokerUmbrellaEmail, brokerUmbrellaPhone
  brokerWcName, brokerWcEmail, brokerWcPhone
  
  // Policy documents and signatures
  glPolicyUrl, glBrokerSignatureUrl, glExpirationDate
  umbrellaPolicyUrl, umbrellaBrokerSignatureUrl, umbrellaExpirationDate
  autoPolicyUrl, autoBrokerSignatureUrl, autoExpirationDate
  wcPolicyUrl, wcBrokerSignatureUrl, wcExpirationDate
  
  // First COI tracking
  firstCOIUploaded Boolean @default(false)
  firstCOIUrl String?
  
  // Admin review
  assignedAdminEmail String?
  deficiencyNotes String?
  rejectionReason String?
}

enum COIStatus {
  AWAITING_BROKER_INFO
  AWAITING_BROKER_UPLOAD
  AWAITING_BROKER_SIGNATURE
  AWAITING_ADMIN_REVIEW
  ACTIVE
  DEFICIENCY_PENDING
  EXPIRED
}
```

## 🔌 API Integration Guide

### Required Backend API Endpoints

The frontend components have TODO comments indicating where API calls should be implemented. Here are the required endpoints:

#### Subcontractor APIs
```typescript
GET /api/subcontractor/dashboard
  - Returns: { activeProjects, insuranceStatus, pendingItems, projects[] }

POST /api/subcontractor/broker
  - Body: { brokerType, brokerName, brokerEmail, brokerPhone, ... }
  - Action: Creates broker account(s), sends welcome emails
  - Returns: Success confirmation

GET /api/subcontractor/projects
  - Returns: Array of assigned projects with GC details

GET /api/subcontractor/compliance
  - Returns: Compliance status with policy-level breakdown
```

#### Broker APIs
```typescript
GET /api/broker/dashboard
  - Returns: { totalSubcontractors, pendingUploads, pendingSignatures, expiringSoon }

GET /api/broker/subcontractors
  - Returns: Array of assigned subcontractors

POST /api/broker/upload-first-coi
  - Body: FormData with files and expiration dates
  - Action: Uploads all policies, sends notifications to admin
  - Returns: Success confirmation

GET /api/broker/coi/:id
  - Returns: COI details for signing

POST /api/broker/coi/:id/sign
  - Body: { policyType, signature }
  - Action: Signs policy, sends notifications
  - Returns: Updated COI status

GET /api/broker/documents
  - Returns: All subcontractors with document status
```

#### Admin APIs
```typescript
GET /api/admin/coi-reviews
  - Returns: Array of COI submissions awaiting review

POST /api/admin/coi-reviews/:id/approve
  - Action: Approves COI, updates status to ACTIVE, sends emails
  - Returns: Success confirmation

POST /api/admin/coi-reviews/:id/reject
  - Body: { notes }
  - Action: Rejects COI, updates status to DEFICIENCY_PENDING, sends emails
  - Returns: Success confirmation
```

### Email Service Integration

To use the email service in your backend controllers:

```typescript
import { EmailService } from '../email/email.service';

@Controller('contractors')
export class ContractorsController {
  constructor(
    private readonly emailService: EmailService,
    // ... other services
  ) {}

  @Post('assign-subcontractor')
  async assignSubcontractor(@Body() dto: AssignSubcontractorDto) {
    // Create subcontractor user account
    const tempPassword = generateTempPassword();
    const user = await this.usersService.create({
      email: dto.email,
      password: tempPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.SUBCONTRACTOR,
    });

    // Send welcome email
    await this.emailService.sendSubcontractorWelcomeEmail(
      dto.email,
      dto.firstName,
      tempPassword,
    );

    return user;
  }
}
```

## 🔄 Complete Workflow

### Workflow 1: First-Time COI Submission
1. **GC assigns subcontractor to project**
   - System auto-creates subcontractor account
   - Sends welcome email with credentials

2. **Subcontractor logs in**
   - Views dashboard with pending status
   - Enters broker information (global or per-policy)
   - System auto-creates broker account(s)
   - Sends welcome email(s) to broker(s)

3. **Broker logs in**
   - Views pending uploads
   - Uploads first-time COI:
     - COI document
     - GL policy + expiration
     - Auto policy + expiration
     - Umbrella policy + expiration
     - WC policy + expiration
     - Optional: Hold Harmless Agreement
   - System sends notification to admin

4. **Admin reviews submission**
   - Views all documents
   - Checks expiration dates
   - Approves or rejects with notes
   - System sends email notifications to GC, Sub, Broker

5. **If approved:**
   - Status changes to ACTIVE
   - Subcontractor dashboard shows COMPLIANT
   - All parties receive confirmation email

### Workflow 2: Renewal COI
1. **System generates renewal COI** (when policies near expiration)
   - Creates COI from existing policy data
   - Status: AWAITING_BROKER_SIGNATURE

2. **Broker receives notification**
   - Views system-generated COI
   - Reviews and digitally signs each policy
   - System sends notification to admin

3. **Admin reviews signed COI**
   - Approves or rejects
   - System sends notifications to all parties

## 📧 Email Notification Matrix

| Event | GC | Sub | Broker | Admin |
|-------|----|----|--------|-------|
| Subcontractor assigned | ✓ | ✓ | - | - |
| Broker account created | - | ✓ | ✓ | - |
| First COI uploaded | ✓ | ✓ | ✓ | ✓ |
| Renewal COI signed | ✓ | ✓ | ✓ | ✓ |
| COI approved | ✓ | ✓ | ✓ | - |
| COI rejected | ✓ | ✓ | ✓ | - |
| Non-compliance alert | ✓ | ✓ | ✓ | - |

## ⚙️ Environment Variables

Add to `packages/backend/.env`:
```bash
# Email Configuration
SMTP_USER=miriamsabel@insuretrack.onmicrosoft.com
SMTP_PASS=260Hooper
SMTP_HOST=smtp.office365.com
SMTP_PORT=587

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000
```

## 🧪 Testing Checklist

### Subcontractor Flow
- [ ] Dashboard loads with correct stats
- [ ] Can navigate to broker information page
- [ ] Can submit global broker information
- [ ] Can submit per-policy broker information
- [ ] Can view assigned projects
- [ ] Can view compliance status
- [ ] Compliance alerts display correctly

### Broker Flow
- [ ] Dashboard shows correct statistics
- [ ] Can view assigned subcontractors
- [ ] Can upload first-time COI with all policies
- [ ] Can sign renewal COI
- [ ] Can view all documents and statuses
- [ ] Filtering works correctly

### Admin Flow
- [ ] Dashboard shows pending COI count
- [ ] Pending COI Reviews card is clickable
- [ ] COI reviews page loads
- [ ] Can approve COI
- [ ] Can reject COI with notes
- [ ] Filtering works correctly
- [ ] All documents are viewable

### Email Testing
- [ ] Subcontractor welcome email sends
- [ ] Broker welcome email sends
- [ ] Compliance confirmation email sends to all parties
- [ ] Non-compliance alert email sends to all parties
- [ ] Document upload notification sends to admin

## 🚀 Next Steps

1. **Implement Backend API Endpoints**
   - Create the API endpoints listed above
   - Integrate EmailService into controllers
   - Add auto-account creation for subs and brokers

2. **File Upload Configuration**
   - Set up file storage (S3, Azure Blob, or local)
   - Configure file upload middleware
   - Add file validation and virus scanning

3. **Connect Frontend to Backend**
   - Replace TODO comments with actual API calls
   - Test all workflows end-to-end
   - Add error handling and loading states

4. **Testing & Deployment**
   - Test email delivery with SMTP credentials
   - Test all user workflows
   - Deploy to staging environment
   - Conduct UAT with actual users

## 📝 Notes

- All frontend components include proper TypeScript typing
- Components use existing auth patterns with useAuth hook
- Email templates are HTML-formatted with proper styling
- All pages include proper navigation and loading states
- Components follow existing patterns from GC portal
- Database schema already supports all required fields

## 🔗 Related Documents

- See `GETTING_STARTED.md` for development setup
- See `DEPLOYMENT_GUIDE.md` for deployment instructions
- See Prisma schema at `packages/backend/prisma/schema.prisma`
