# Implementation Guidelines - Compliant Insurance Platform

## Overview

This document provides comprehensive guidelines for implementing the Compliant Insurance Tracking Platform features in a phased approach. The implementation is broken down into distinct Pull Requests (PRs) to ensure manageable, reviewable, and testable code changes.

## Table of Contents

1. [General Guidelines](#general-guidelines)
2. [PR #2: Core Infrastructure](#pr-2-core-infrastructure)
3. [PR #3: AI & Document Processing](#pr-3-ai--document-processing)
4. [PR #4: COI Workflow](#pr-4-coi-workflow)
5. [PR #5: External Integrations](#pr-5-external-integrations)
6. [PR #6: Communication & Monitoring](#pr-6-communication--monitoring)
7. [PR #7: Admin Tools & Portals](#pr-7-admin-tools--portals)
8. [Testing Requirements](#testing-requirements)
9. [Security Considerations](#security-considerations)
10. [Code Quality Standards](#code-quality-standards)

---

## General Guidelines

### Development Principles

1. **Type Safety First**: Use TypeScript strictly with no `any` types
2. **API-First Design**: Define OpenAPI/Swagger specs before implementation
3. **Test-Driven Development**: Write tests before or alongside implementation
4. **Security by Default**: Implement security controls from the start
5. **Performance Considerations**: Consider scalability and performance impacts
6. **Documentation**: Update docs with each feature addition

### Code Structure

```
packages/
├── backend/
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   ├── common/            # Shared utilities
│   │   ├── config/            # Configuration
│   │   └── main.ts
│   └── prisma/
│       └── schema.prisma      # Database schema
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities and hooks
│   └── types/                 # TypeScript types
└── shared/
    └── src/                   # Shared types and validators
```

### Commit Convention

Follow Conventional Commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `test:` - Test additions or updates
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

### PR Requirements

Each PR must include:
- [ ] Feature implementation
- [ ] Unit tests (minimum 80% coverage)
- [ ] Integration tests where applicable
- [ ] API documentation updates
- [ ] Database migrations (if schema changes)
- [ ] Environment variable documentation
- [ ] README updates
- [ ] Security review checklist

---

## PR #2: Core Infrastructure

**Goal**: Establish foundational services required by all other features.

### Features to Implement

#### 1. Enhanced Authentication System

**Backend (NestJS)**:
- Implement JWT with refresh token rotation
- Add session management with Redis
- Support for password reset flow
- Two-factor authentication (2FA) support
- Rate limiting on auth endpoints

**Files to Create/Modify**:
```
packages/backend/src/modules/auth/
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   ├── jwt-refresh.strategy.ts
│   └── local.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── 2fa.guard.ts
└── dto/
    ├── login.dto.ts
    ├── refresh-token.dto.ts
    ├── reset-password.dto.ts
    └── verify-2fa.dto.ts
```

**Database Schema**:
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
  revoked   Boolean  @default(false)
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  ipAddress String?
  userAgent String?
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**Environment Variables**:
```env
# SECURITY WARNING: Generate cryptographically secure random secrets
# JWT secrets MUST be at least 256-bit (32 characters) for production
# Use: openssl rand -base64 32
JWT_SECRET=your-256-bit-secret-minimum-32-characters-here
JWT_REFRESH_SECRET=your-256-bit-refresh-secret-minimum-32-characters
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
REDIS_URL=redis://localhost:6379
SESSION_EXPIRATION=30d
```

**Testing Requirements**:
- Unit tests for AuthService methods
- E2E tests for login/logout/refresh flows
- Test token expiration and renewal
- Test rate limiting
- Test 2FA workflow

#### 2. Email Service Integration

**Backend Implementation**:
- Email service abstraction layer
- Support for multiple providers (SendGrid, AWS SES, SMTP)
- Email templates using Handlebars
- Queue system for reliable delivery
- Email tracking and logging

**Files to Create**:
```
packages/backend/src/modules/email/
├── email.module.ts
├── email.service.ts
├── email.processor.ts
├── dto/
│   ├── send-email.dto.ts
│   └── email-template.dto.ts
├── templates/
│   ├── welcome.hbs
│   ├── password-reset.hbs
│   ├── insurance-expiring.hbs
│   └── policy-deficiency.hbs
└── providers/
    ├── sendgrid.provider.ts
    ├── ses.provider.ts
    └── smtp.provider.ts
```

**Database Schema**:
```prisma
model EmailLog {
  id          String   @id @default(uuid())
  to          String
  from        String
  subject     String
  template    String
  status      EmailStatus
  sentAt      DateTime?
  errorMsg    String?
  metadata    Json?
  createdAt   DateTime @default(now())
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
  BOUNCED
}
```

**Environment Variables**:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=
AWS_SES_REGION=
AWS_SES_ACCESS_KEY=
AWS_SES_SECRET_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@compliant.com
```

**Testing Requirements**:
- Mock email providers in tests
- Test template rendering
- Test queue processing
- Test delivery retry logic
- Test error handling

#### 3. File Upload Service

**Backend Implementation**:
- Multi-provider support (S3, Azure Blob, Local)
- File type validation
- Virus scanning integration
- Thumbnail generation for images
- File metadata extraction
- Secure signed URLs for downloads

**Files to Create**:
```
packages/backend/src/modules/files/
├── files.module.ts
├── files.service.ts
├── files.controller.ts
├── dto/
│   ├── upload-file.dto.ts
│   └── file-metadata.dto.ts
├── providers/
│   ├── s3.provider.ts
│   ├── azure-blob.provider.ts
│   └── local.provider.ts
└── interceptors/
    ├── file-upload.interceptor.ts
    └── file-validation.interceptor.ts
```

**Database Schema**:
```prisma
model File {
  id              String   @id @default(uuid())
  filename        String
  originalName    String
  mimeType        String
  size            Int
  path            String
  url             String?
  thumbnailUrl    String?
  uploadedBy      String
  user            User     @relation(fields: [uploadedBy], references: [id])
  virusScanned    Boolean  @default(false)
  virusScanResult String?
  metadata        Json?
  createdAt       DateTime @default(now())
  
  @@index([uploadedBy])
}
```

**Environment Variables**:
```env
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_S3_ACCESS_KEY=
AWS_S3_SECRET_KEY=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=
LOCAL_STORAGE_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx
VIRUS_SCAN_ENABLED=true
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

**Testing Requirements**:
- Test file upload with different providers
- Test file type validation
- Test file size limits
- Test virus scanning integration
- Test thumbnail generation
- Test signed URL generation

#### 4. Session Management

**Backend Implementation**:
- Redis-based session storage
- Session lifecycle management
- Device tracking
- Session revocation
- Active session listing

**Files to Create**:
```
packages/backend/src/modules/sessions/
├── sessions.module.ts
├── sessions.service.ts
├── sessions.controller.ts
└── dto/
    ├── session.dto.ts
    └── revoke-session.dto.ts
```

**Frontend Implementation**:
- Session timeout handling
- Auto-refresh before expiration
- Multi-tab synchronization
- Logout from all devices

**Testing Requirements**:
- Test session creation and validation
- Test session expiration
- Test concurrent sessions
- Test session revocation
- Test multi-device scenarios

---

## PR #3: AI & Document Processing

**Goal**: Implement intelligent document processing capabilities for insurance certificates.

### Features to Implement

#### 1. Adobe PDF Services Integration

**Backend Implementation**:
- PDF text extraction
- PDF form field detection
- PDF validation
- PDF compression and optimization
- PDF conversion (PDF to images)

**Files to Create**:
```
packages/backend/src/modules/pdf/
├── pdf.module.ts
├── pdf.service.ts
├── dto/
│   ├── extract-pdf-text.dto.ts
│   └── validate-pdf.dto.ts
└── interfaces/
    └── pdf-metadata.interface.ts
```

**Environment Variables**:
```env
ADOBE_CLIENT_ID=
ADOBE_CLIENT_SECRET=
ADOBE_ORGANIZATION_ID=
```

**Testing Requirements**:
- Test PDF text extraction accuracy
- Test form field detection
- Test PDF validation
- Mock Adobe API in tests

#### 2. OpenAI/Claude Integration

**Backend Implementation**:
- LLM provider abstraction
- Insurance document analysis
- Policy data extraction
- Document classification
- Natural language queries
- Prompt template management

**Files to Create**:
```
packages/backend/src/modules/ai/
├── ai.module.ts
├── ai.service.ts
├── providers/
│   ├── openai.provider.ts
│   └── claude.provider.ts
├── prompts/
│   ├── extract-insurance-data.prompt.ts
│   ├── classify-document.prompt.ts
│   └── validate-coverage.prompt.ts
└── dto/
    ├── analyze-document.dto.ts
    └── extract-data.dto.ts
```

**Database Schema**:
```prisma
model AIAnalysis {
  id                String   @id @default(uuid())
  documentId        String
  provider          String   // openai, claude
  model             String   // gpt-4, claude-3-opus
  prompt            String
  response          Json
  tokensUsed        Int
  cost              Float
  processingTime    Int      // milliseconds
  confidence        Float?
  extractedData     Json?
  createdAt         DateTime @default(now())
  
  @@index([documentId])
  @@index([createdAt])
}
```

**Environment Variables**:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AI_MODEL=gpt-4
AI_TEMPERATURE=0.2
AI_MAX_TOKENS=2000
```

**Testing Requirements**:
- Mock AI provider responses
- Test prompt templates
- Test extraction accuracy with sample documents
- Test error handling for API failures
- Test cost tracking

#### 3. Auto-Extraction System

**Backend Implementation**:
- Automated insurance data extraction
- Named Entity Recognition (NER) for insurance terms
- Date parsing and normalization
- Coverage amount extraction
- Policy number detection
- Insurer identification

**Files to Create**:
```
packages/backend/src/modules/extraction/
├── extraction.module.ts
├── extraction.service.ts
├── extractors/
│   ├── policy-number.extractor.ts
│   ├── coverage-amount.extractor.ts
│   ├── dates.extractor.ts
│   ├── insurer.extractor.ts
│   └── named-insured.extractor.ts
└── dto/
    ├── extraction-result.dto.ts
    └── validate-extraction.dto.ts
```

**Database Schema**:
```prisma
model ExtractionResult {
  id              String   @id @default(uuid())
  documentId      String
  extractionType  String
  extractedData   Json
  confidence      Float
  needsReview     Boolean  @default(false)
  reviewedBy      String?
  reviewedAt      DateTime?
  corrections     Json?
  createdAt       DateTime @default(now())
  
  @@index([documentId])
  @@index([needsReview])
}
```

**Frontend Implementation**:
- Document upload with preview
- Real-time extraction progress
- Extraction result review interface
- Manual correction capabilities
- Confidence score visualization

**Testing Requirements**:
- Test extraction with various insurance certificate formats
- Test accuracy with ground truth dataset
- Test confidence scoring
- Test manual correction workflow
- Load testing for concurrent extractions

---

## PR #4: COI Workflow

**Goal**: Implement Certificate of Insurance review and approval workflow.

### Features to Implement

#### 1. Review System

**Backend Implementation**:
- COI submission workflow
- Review queue management
- Assignment rules
- Review history tracking
- Status transitions

**Files to Create**:
```
packages/backend/src/modules/coi-review/
├── coi-review.module.ts
├── coi-review.service.ts
├── coi-review.controller.ts
├── dto/
│   ├── submit-review.dto.ts
│   ├── assign-reviewer.dto.ts
│   └── review-decision.dto.ts
└── entities/
    └── coi-review.entity.ts
```

**Database Schema**:
```prisma
model COIReview {
  id                String         @id @default(uuid())
  contractorId      String
  contractor        Contractor     @relation(fields: [contractorId], references: [id])
  documentId        String
  submittedBy       String
  submitter         User           @relation("Submitter", fields: [submittedBy], references: [id])
  assignedTo        String?
  reviewer          User?          @relation("Reviewer", fields: [assignedTo], references: [id])
  status            ReviewStatus
  priority          Priority       @default(NORMAL)
  dueDate           DateTime?
  submittedAt       DateTime       @default(now())
  reviewedAt        DateTime?
  decision          ReviewDecision?
  notes             String?
  deficiencies      Deficiency[]
  history           ReviewHistory[]
  
  @@index([contractorId])
  @@index([status])
  @@index([assignedTo])
  @@index([dueDate])
}

enum ReviewStatus {
  PENDING
  IN_REVIEW
  APPROVED
  REJECTED
  REQUIRES_CHANGES
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum ReviewDecision {
  APPROVED
  REJECTED
  CONDITIONAL_APPROVAL
}
```

**Frontend Implementation**:
- Review queue dashboard
- Document viewer with annotation
- Review form
- Status indicators
- Filtering and sorting

**Testing Requirements**:
- Test review queue management
- Test assignment logic
- Test status transitions
- Test notification triggers
- E2E workflow tests

#### 2. Approval System

**Backend Implementation**:
- Multi-level approval workflow
- Approval delegation
- Approval history
- Conditional approvals
- Auto-approval rules

**Files to Create**:
```
packages/backend/src/modules/approvals/
├── approvals.module.ts
├── approvals.service.ts
├── approvals.controller.ts
├── rules/
│   └── auto-approval-rules.ts
└── dto/
    ├── approval-request.dto.ts
    └── approval-decision.dto.ts
```

**Database Schema**:
```prisma
model Approval {
  id            String          @id @default(uuid())
  reviewId      String
  review        COIReview       @relation(fields: [reviewId], references: [id])
  approverId    String
  approver      User            @relation(fields: [approverId], references: [id])
  decision      ApprovalDecision
  comments      String?
  conditions    String?
  approvedAt    DateTime        @default(now())
  
  @@index([reviewId])
  @@index([approverId])
}

enum ApprovalDecision {
  APPROVED
  REJECTED
  DELEGATED
}

model ApprovalRule {
  id              String   @id @default(uuid())
  name            String
  description     String?
  conditions      Json
  action          String
  enabled         Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Testing Requirements**:
- Test approval workflow
- Test delegation
- Test auto-approval rules
- Test conditional approvals
- Test approval history

#### 3. Deficiency Management

**Backend Implementation**:
- Deficiency tracking
- Deficiency categorization
- Resolution workflow
- Reminder system
- Deficiency templates

**Files to Create**:
```
packages/backend/src/modules/deficiencies/
├── deficiencies.module.ts
├── deficiencies.service.ts
├── deficiencies.controller.ts
├── templates/
│   └── deficiency-templates.ts
└── dto/
    ├── create-deficiency.dto.ts
    ├── resolve-deficiency.dto.ts
    └── deficiency-template.dto.ts
```

**Database Schema**:
```prisma
model Deficiency {
  id                String            @id @default(uuid())
  reviewId          String
  review            COIReview         @relation(fields: [reviewId], references: [id])
  category          DeficiencyCategory
  severity          Severity
  description       String
  requiredAction    String
  dueDate           DateTime
  status            DeficiencyStatus  @default(OPEN)
  resolvedBy        String?
  resolver          User?             @relation(fields: [resolvedBy], references: [id])
  resolvedAt        DateTime?
  resolutionNotes   String?
  reminders         Reminder[]
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  @@index([reviewId])
  @@index([status])
  @@index([dueDate])
}

enum DeficiencyCategory {
  COVERAGE_AMOUNT
  EXPIRED_POLICY
  MISSING_ENDORSEMENT
  INCORRECT_NAMED_INSURED
  MISSING_ADDITIONAL_INSURED
  CERTIFICATE_HOLDER
  OTHER
}

enum Severity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum DeficiencyStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  WAIVED
}

model Reminder {
  id              String      @id @default(uuid())
  deficiencyId    String
  deficiency      Deficiency  @relation(fields: [deficiencyId], references: [id])
  sentTo          String
  recipient       User        @relation(fields: [sentTo], references: [id])
  sentAt          DateTime    @default(now())
  acknowledged    Boolean     @default(false)
  
  @@index([deficiencyId])
}
```

**Frontend Implementation**:
- Deficiency list view
- Deficiency creation form
- Resolution tracking
- Deficiency templates picker
- Reminder management

**Testing Requirements**:
- Test deficiency creation
- Test resolution workflow
- Test reminder system
- Test deficiency templates
- Test status transitions

---

## PR #5: External Integrations

**Goal**: Integrate with external services for enhanced functionality.

### Features to Implement

#### 1. NYC DOB API Integration

**Backend Implementation**:
- DOB business lookup
- License verification
- Violation history retrieval
- Complaint history
- Certificate of insurance filing

**Files to Create**:
```
packages/backend/src/modules/integrations/nyc-dob/
├── nyc-dob.module.ts
├── nyc-dob.service.ts
├── nyc-dob.controller.ts
├── dto/
│   ├── lookup-business.dto.ts
│   ├── verify-license.dto.ts
│   └── file-coi.dto.ts
└── interfaces/
    └── dob-response.interface.ts
```

**Database Schema**:
```prisma
model DOBRecord {
  id                String   @id @default(uuid())
  contractorId      String
  contractor        Contractor @relation(fields: [contractorId], references: [id])
  licenseNumber     String
  businessName      String
  licenseType       String
  licenseStatus     String
  expirationDate    DateTime?
  violations        Json?
  complaints        Json?
  lastVerified      DateTime @default(now())
  
  @@index([contractorId])
  @@index([licenseNumber])
}
```

**Environment Variables**:
```env
NYC_DOB_API_KEY=
NYC_DOB_API_URL=https://data.cityofnewyork.us/resource/
NYC_DOB_CACHE_TTL=3600
```

**Testing Requirements**:
- Mock DOB API responses
- Test license verification
- Test data parsing
- Test error handling
- Test rate limiting

#### 2. Google Places API Integration

**Backend Implementation**:
- Business address validation
- Business information enrichment
- Geocoding
- Address autocomplete
- Business verification

**Files to Create**:
```
packages/backend/src/modules/integrations/google-places/
├── google-places.module.ts
├── google-places.service.ts
├── google-places.controller.ts
├── dto/
│   ├── validate-address.dto.ts
│   ├── geocode.dto.ts
│   └── place-details.dto.ts
└── interfaces/
    └── place.interface.ts
```

**Database Schema**:
```prisma
model PlaceVerification {
  id              String   @id @default(uuid())
  contractorId    String
  contractor      Contractor @relation(fields: [contractorId], references: [id])
  placeId         String
  name            String
  address         String
  phone           String?
  website         String?
  businessStatus  String
  rating          Float?
  userRatingsTotal Int?
  verified        Boolean  @default(false)
  verifiedAt      DateTime @default(now())
  
  @@index([contractorId])
  @@index([placeId])
}
```

**Environment Variables**:
```env
GOOGLE_PLACES_API_KEY=
GOOGLE_PLACES_CACHE_TTL=86400
```

**Frontend Implementation**:
- Address autocomplete input
- Business verification badge
- Map integration
- Place details display

**Testing Requirements**:
- Mock Google Places API
- Test address validation
- Test autocomplete
- Test geocoding
- Test place details retrieval

---

## PR #6: Communication & Monitoring

**Goal**: Implement comprehensive communication and monitoring systems.

### Features to Implement

#### 1. Messaging System

**Backend Implementation**:
- Internal messaging
- Message threads
- Read receipts
- File attachments
- Message search
- Notifications

**Files to Create**:
```
packages/backend/src/modules/messaging/
├── messaging.module.ts
├── messaging.service.ts
├── messaging.controller.ts
├── messaging.gateway.ts (WebSocket)
├── dto/
│   ├── send-message.dto.ts
│   ├── message-thread.dto.ts
│   └── mark-read.dto.ts
└── entities/
    ├── message.entity.ts
    └── thread.entity.ts
```

**Database Schema**:
```prisma
model MessageThread {
  id            String    @id @default(uuid())
  subject       String?
  participants  User[]    @relation("ThreadParticipants")
  messages      Message[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastMessageAt DateTime?
  
  @@index([updatedAt])
}

model Message {
  id          String        @id @default(uuid())
  threadId    String
  thread      MessageThread @relation(fields: [threadId], references: [id])
  senderId    String
  sender      User          @relation(fields: [senderId], references: [id])
  content     String        @db.Text
  attachments Json?
  readBy      MessageRead[]
  createdAt   DateTime      @default(now())
  
  @@index([threadId])
  @@index([senderId])
  @@index([createdAt])
}

model MessageRead {
  id        String   @id @default(uuid())
  messageId String
  message   Message  @relation(fields: [messageId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  readAt    DateTime @default(now())
  
  @@unique([messageId, userId])
  @@index([userId])
}
```

**Frontend Implementation**:
- Message inbox interface
- Real-time message updates (WebSocket)
- Message composition
- Thread view
- Attachment handling

**Testing Requirements**:
- Test message sending
- Test real-time updates
- Test read receipts
- Test message search
- Test file attachments

#### 2. Notification System

**Backend Implementation**:
- Multi-channel notifications (email, in-app, SMS)
- Notification preferences
- Notification templates
- Notification scheduling
- Notification history

**Files to Create**:
```
packages/backend/src/modules/notifications/
├── notifications.module.ts
├── notifications.service.ts
├── notifications.controller.ts
├── notifications.gateway.ts
├── channels/
│   ├── email.channel.ts
│   ├── in-app.channel.ts
│   └── sms.channel.ts
├── templates/
│   └── notification-templates.ts
└── dto/
    ├── send-notification.dto.ts
    └── notification-preferences.dto.ts
```

**Database Schema**:
```prisma
model Notification {
  id            String             @id @default(uuid())
  userId        String
  user          User               @relation(fields: [userId], references: [id])
  type          NotificationType
  title         String
  message       String             @db.Text
  data          Json?
  channels      NotificationChannel[]
  read          Boolean            @default(false)
  readAt        DateTime?
  actionUrl     String?
  createdAt     DateTime           @default(now())
  
  @@index([userId, read])
  @@index([createdAt])
}

enum NotificationType {
  POLICY_EXPIRING
  REVIEW_ASSIGNED
  APPROVAL_REQUIRED
  DEFICIENCY_CREATED
  MESSAGE_RECEIVED
  SYSTEM_ALERT
}

enum NotificationChannel {
  EMAIL
  IN_APP
  SMS
}

model NotificationPreference {
  id        String                @id @default(uuid())
  userId    String                @unique
  user      User                  @relation(fields: [userId], references: [id])
  settings  Json                  // { POLICY_EXPIRING: ['EMAIL', 'IN_APP'], ... }
  createdAt DateTime              @default(now())
  updatedAt DateTime              @updatedAt
}
```

**Environment Variables**:
```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SMS_ENABLED=true
```

**Frontend Implementation**:
- Notification center
- Real-time notification updates
- Notification preferences page
- Notification badges
- Mark as read functionality

**Testing Requirements**:
- Test notification delivery across channels
- Test notification preferences
- Test real-time updates
- Test notification history
- Mock external services (Twilio)

#### 3. Expiring Policy Alerts

**Backend Implementation**:
- Policy expiration tracking
- Automated alert scheduling
- Escalation rules
- Alert history
- Customizable alert thresholds

**Files to Create**:
```
packages/backend/src/modules/policy-alerts/
├── policy-alerts.module.ts
├── policy-alerts.service.ts
├── policy-alerts.scheduler.ts
├── dto/
│   ├── alert-config.dto.ts
│   └── alert-history.dto.ts
└── rules/
    └── escalation-rules.ts
```

**Database Schema**:
```prisma
model PolicyAlert {
  id                String       @id @default(uuid())
  policyId          String
  policy            InsuranceDocument @relation(fields: [policyId], references: [id])
  alertType         AlertType
  severity          Severity
  daysUntilExpiry   Int
  sentTo            String[]
  sentAt            DateTime     @default(now())
  acknowledged      Boolean      @default(false)
  acknowledgedBy    String?
  acknowledgedAt    DateTime?
  
  @@index([policyId])
  @@index([sentAt])
}

enum AlertType {
  EXPIRING_SOON_30
  EXPIRING_SOON_14
  EXPIRING_SOON_7
  EXPIRED
}

model AlertConfig {
  id              String   @id @default(uuid())
  organizationId  String
  alertThresholds Json     // { 30: ['EMAIL'], 14: ['EMAIL', 'SMS'], 7: ['EMAIL', 'SMS', 'IN_APP'] }
  escalationRules Json
  enabled         Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Testing Requirements**:
- Test alert scheduling
- Test alert generation
- Test escalation rules
- Test alert delivery
- Test acknowledgment workflow

---

## PR #7: Admin Tools & Portals

**Goal**: Implement administrative interfaces and portal systems.

### Features to Implement

#### 1. Admin Management Interface

**Backend Implementation**:
- User management
- Role management
- Permission management
- System configuration
- Audit logging
- Analytics dashboard

**Files to Create**:
```
packages/backend/src/modules/admin/
├── admin.module.ts
├── admin.service.ts
├── admin.controller.ts
├── dto/
│   ├── manage-user.dto.ts
│   ├── manage-role.dto.ts
│   └── system-config.dto.ts
└── guards/
    └── admin.guard.ts
```

**Database Schema**:
```prisma
model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String
  resource    String
  resourceId  String?
  changes     Json?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  
  @@index([userId])
  @@index([resource, resourceId])
  @@index([timestamp])
}

model SystemConfig {
  id        String   @id @default(uuid())
  key       String   @unique
  value     Json
  updatedBy String
  admin     User     @relation(fields: [updatedBy], references: [id])
  updatedAt DateTime @updatedAt
}

model Role {
  id          String       @id @default(uuid())
  name        String       @unique
  description String?
  permissions Permission[]
  users       User[]
  createdAt   DateTime     @default(now())
}

model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  resource    String
  action      String
  description String?
  roles       Role[]
  
  @@unique([resource, action])
}
```

**Frontend Implementation** (`packages/frontend/app/admin/`):
- User management table
- Role editor
- Permission matrix
- System settings
- Audit log viewer
- Analytics dashboard

**Testing Requirements**:
- Test user CRUD operations
- Test role management
- Test permission enforcement
- Test audit logging
- Test system configuration

#### 2. General Contractor (GC) Portal

**Backend Implementation**:
- GC-specific endpoints
- Contractor management
- Project management
- COI tracking
- Compliance dashboard
- Report generation

**Files to Create**:
```
packages/backend/src/modules/gc-portal/
├── gc-portal.module.ts
├── gc-portal.service.ts
├── gc-portal.controller.ts
├── dto/
│   ├── gc-dashboard.dto.ts
│   ├── contractor-compliance.dto.ts
│   └── project-status.dto.ts
└── reports/
    ├── compliance-report.ts
    └── expiration-report.ts
```

**Frontend Implementation** (`packages/frontend/app/gc-portal/`):
```
gc-portal/
├── dashboard/
│   └── page.tsx
├── contractors/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── projects/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── compliance/
│   └── page.tsx
└── reports/
    └── page.tsx
```

**Features**:
- Dashboard with compliance metrics
- Contractor list with status indicators
- Project timeline view
- Compliance reporting
- Bulk COI download
- Alert management

**Testing Requirements**:
- Test GC dashboard data
- Test contractor management
- Test project tracking
- Test report generation
- E2E portal workflows

#### 3. Broker Portal

**Backend Implementation**:
- Broker-specific endpoints
- Client management
- Policy tracking
- Renewal reminders
- Commission tracking
- Client communication

**Files to Create**:
```
packages/backend/src/modules/broker-portal/
├── broker-portal.module.ts
├── broker-portal.service.ts
├── broker-portal.controller.ts
├── dto/
│   ├── broker-dashboard.dto.ts
│   ├── client-management.dto.ts
│   └── policy-tracking.dto.ts
└── reports/
    └── commission-report.ts
```

**Database Schema**:
```prisma
model Broker {
  id              String     @id @default(uuid())
  userId          String     @unique
  user            User       @relation(fields: [userId], references: [id])
  licenseNumber   String     @unique
  agency          String
  phone           String
  email           String
  clients         Client[]
  commissions     Commission[]
  createdAt       DateTime   @default(now())
  
  @@index([licenseNumber])
}

model Client {
  id            String     @id @default(uuid())
  brokerId      String
  broker        Broker     @relation(fields: [brokerId], references: [id])
  contractorId  String     @unique
  contractor    Contractor @relation(fields: [contractorId], references: [id])
  policies      Policy[]
  notes         String?
  createdAt     DateTime   @default(now())
  
  @@index([brokerId])
}

model Policy {
  id              String     @id @default(uuid())
  clientId        String
  client          Client     @relation(fields: [clientId], references: [id])
  policyNumber    String     @unique
  policyType      String
  carrier         String
  premium         Float
  effectiveDate   DateTime
  expirationDate  DateTime
  status          PolicyStatus
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  @@index([clientId])
  @@index([expirationDate])
}

enum PolicyStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING_RENEWAL
}

model Commission {
  id            String   @id @default(uuid())
  brokerId      String
  broker        Broker   @relation(fields: [brokerId], references: [id])
  policyId      String
  amount        Float
  percentage    Float
  paidAt        DateTime?
  status        CommissionStatus
  createdAt     DateTime @default(now())
  
  @@index([brokerId])
}

enum CommissionStatus {
  PENDING
  PAID
  CANCELLED
}
```

**Frontend Implementation** (`packages/frontend/app/broker-portal/`):
```
broker-portal/
├── dashboard/
│   └── page.tsx
├── clients/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── policies/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── renewals/
│   └── page.tsx
└── commissions/
    └── page.tsx
```

**Features**:
- Broker dashboard with client overview
- Client management interface
- Policy tracking and renewal management
- Commission tracking
- Client communication tools
- Report generation

**Testing Requirements**:
- Test broker dashboard
- Test client management
- Test policy tracking
- Test renewal workflow
- Test commission calculations
- E2E portal workflows

---

## Testing Requirements

### Unit Testing

**Coverage Requirements**:
- Minimum 80% code coverage
- 100% coverage for critical business logic
- All services must have comprehensive unit tests
- All DTOs must be validated

**Testing Tools**:
- Jest for JavaScript/TypeScript testing
- Supertest for API endpoint testing
- React Testing Library for component tests

**Test Structure**:
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: MockType<Dependency>;

  beforeEach(async () => {
    // Setup
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error case', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Integration Testing

**Areas to Test**:
- API endpoint workflows
- Database operations
- External service integrations
- Authentication flows
- File upload/download

**Test Database**:
- Use separate test database
- Reset database between tests
- Use transactions for test isolation

### End-to-End Testing

**Tools**:
- Playwright or Cypress for E2E tests

**Critical Workflows to Test**:
1. User registration and login
2. Contractor creation and management
3. COI upload and review
4. Approval workflow
5. Notification delivery
6. Report generation

### Performance Testing

**Load Testing**:
- Use k6 or Artillery
- Test concurrent users
- Test API response times
- Test database query performance

**Benchmarks**:
- API response time < 200ms (p95)
- Page load time < 2s
- Database queries < 100ms
- File upload < 5s (10MB file)

---

## Security Considerations

### Authentication & Authorization

- [ ] Implement strong password requirements
- [ ] Enable rate limiting on auth endpoints
- [ ] Implement account lockout after failed attempts
- [ ] Use secure JWT with short expiration
- [ ] Implement refresh token rotation
- [ ] Validate all inputs
- [ ] Use RBAC for authorization
- [ ] Implement session timeout

### Data Protection

- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS/TLS for all communications
- [ ] Implement proper CORS configuration
- [ ] Sanitize user inputs
- [ ] Use parameterized queries (Prisma)
- [ ] Implement file upload validation
- [ ] Scan uploaded files for viruses
- [ ] Use signed URLs for file downloads

### API Security

- [ ] Implement rate limiting
- [ ] Use API keys for external services
- [ ] Validate request payloads
- [ ] Implement request size limits
- [ ] Use CSRF protection
- [ ] Implement API versioning
- [ ] Log security events
- [ ] Monitor for suspicious activity

### Compliance

- [ ] GDPR compliance for data handling
- [ ] SOC 2 compliance considerations
- [ ] Data retention policies
- [ ] Right to deletion
- [ ] Data export capabilities
- [ ] Audit logging
- [ ] Privacy policy implementation

---

## Code Quality Standards

### TypeScript Standards

```typescript
// Use strict mode
"strict": true,
"strictNullChecks": true,
"noImplicitAny": true,

// No any types
// Bad
const data: any = await fetchData();

// Good
interface FetchDataResponse {
  id: string;
  name: string;
}
const data: FetchDataResponse = await fetchData();

// Use proper typing for functions
// Bad
function processData(data) {
  return data.map(item => item.value);
}

// Good
function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

### Code Organization

```typescript
// Group imports
// 1. External packages
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 2. Internal modules
import { CreateUserDto } from './dto/create-user.dto';

// 3. Types/Interfaces
import { User } from '@prisma/client';

// Use dependency injection
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
}

// Keep functions small and focused
// Bad - too many responsibilities
async function createUserAndSendEmail(userData) {
  const user = await db.user.create(userData);
  await sendEmail(user.email);
  await createAuditLog('user_created', user.id);
  return user;
}

// Good - single responsibility
async function createUser(userData: CreateUserDto): Promise<User> {
  return await this.prisma.user.create({ data: userData });
}
```

### Error Handling

```typescript
// Use custom exceptions
throw new NotFoundException(`User with ID ${id} not found`);
throw new BadRequestException('Invalid input data');
throw new UnauthorizedException('Invalid credentials');

// Implement global exception filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Handle and log exceptions
  }
}

// Use try-catch for async operations
async function processDocument(fileId: string): Promise<void> {
  try {
    const file = await this.fileService.getFile(fileId);
    await this.pdfService.extractText(file);
  } catch (error) {
    this.logger.error(`Failed to process document ${fileId}`, error);
    throw new InternalServerErrorException('Document processing failed');
  }
}
```

### Logging

```typescript
// Use structured logging
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);

  async processData(id: string) {
    this.logger.log(`Processing data for ID: ${id}`);
    
    try {
      // Process
      this.logger.debug(`Data processed successfully for ID: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process data for ID: ${id}`,
        error.stack,
      );
      throw error;
    }
  }
}
```

### Documentation

```typescript
/**
 * Service for managing user accounts
 * Handles user creation, authentication, and profile management
 */
@Injectable()
export class UserService {
  /**
   * Creates a new user account
   * @param createUserDto - User creation data
   * @returns Created user object
   * @throws BadRequestException if email already exists
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Implementation
  }
}
```

### Frontend Standards

```typescript
// Use TypeScript with React
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
}

// Use React Query for data fetching
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });
}

// Implement proper error boundaries
export class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log error
  }

  render() {
    // Render fallback UI
  }
}
```

---

## Environment Setup

### Required Environment Variables

Create `.env` files in each package:

**packages/backend/.env**:
```env
# ⚠️ SECURITY WARNING: All secrets below are EXAMPLES ONLY
# Generate production secrets using: openssl rand -base64 32
# NEVER commit real secrets to version control

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/compliant_dev

# JWT - MUST be 256-bit (32+ characters) cryptographically secure random strings
JWT_SECRET=your-jwt-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_URL=redis://localhost:6379

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@compliant.com

# File Storage
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=compliant-files
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY=your-access-key
AWS_S3_SECRET_KEY=your-secret-key

# External APIs
ADOBE_CLIENT_ID=your-adobe-client-id
ADOBE_CLIENT_SECRET=your-adobe-client-secret
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_PLACES_API_KEY=your-google-api-key
NYC_DOB_API_KEY=your-dob-api-key

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Application
NODE_ENV=development
PORT=3001
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000
```

**packages/frontend/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_ENV=development
```

---

## AWS Infrastructure

### Architecture Overview

The Compliant Insurance Platform uses enterprise-grade AWS infrastructure for production deployment:

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                               │
│                                                                   │
│  ┌──────────────────┐         ┌────────────────────┐           │
│  │   CloudFront     │────────▶│     S3 Bucket      │           │
│  │  (CDN/Static)    │         │   (Frontend)       │           │
│  └──────────────────┘         └────────────────────┘           │
│           │                                                      │
│           │                                                      │
│  ┌──────────────────────────────────────────┐                  │
│  │         Application Load Balancer         │                  │
│  └──────────────────────────────────────────┘                  │
│           │                                                      │
│  ┌────────▼────────┐     ┌─────────────────┐                  │
│  │   ECS Fargate   │────▶│  ElastiCache    │                  │
│  │   (Backend API) │     │    (Redis)      │                  │
│  └─────────────────┘     └─────────────────┘                  │
│           │                                                      │
│  ┌────────▼────────┐     ┌─────────────────┐                  │
│  │   RDS Aurora    │────▶│   S3 Bucket     │                  │
│  │  (PostgreSQL)   │     │  (File Upload)  │                  │
│  └─────────────────┘     └─────────────────┘                  │
│                                                                   │
│  ┌─────────────────┐     ┌─────────────────┐                  │
│  │   CloudWatch    │     │   Secrets Mgr   │                  │
│  │ (Monitoring)    │     │   (API Keys)    │                  │
│  └─────────────────┘     └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### Required AWS Services

#### 1. Compute - ECS Fargate

**Backend API Deployment**:
```yaml
# task-definition.json
{
  "family": "compliant-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/compliant-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:<region>:<account>:secret:compliant/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:<region>:<account>:secret:compliant/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/compliant-backend",
          "awslogs-region": "<region>",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**ECS Service Configuration**:
```yaml
# ecs-service.json
{
  "serviceName": "compliant-backend-service",
  "cluster": "compliant-cluster",
  "taskDefinition": "compliant-backend",
  "desiredCount": 2,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-xxxxx",
        "subnet-yyyyy"
      ],
      "securityGroups": ["sg-xxxxx"],
      "assignPublicIp": "DISABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:...",
      "containerName": "backend",
      "containerPort": 3001
    }
  ],
  "healthCheckGracePeriodSeconds": 60,
  "deploymentConfiguration": {
    "maximumPercent": 200,
    "minimumHealthyPercent": 100,
    "deploymentCircuitBreaker": {
      "enable": true,
      "rollback": true
    }
  }
}
```

#### 2. Database - RDS Aurora PostgreSQL

**Terraform Configuration**:
```hcl
# rds.tf
resource "aws_rds_cluster" "compliant_db" {
  cluster_identifier      = "compliant-aurora-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.3"
  database_name           = "compliant_prod"
  master_username         = "compliant_admin"
  master_password         = var.db_master_password
  
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  
  vpc_security_group_ids  = [aws_security_group.rds.id]
  db_subnet_group_name    = aws_db_subnet_group.compliant.name
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  deletion_protection = true
  
  tags = {
    Environment = "production"
    Application = "compliant"
  }
}

resource "aws_rds_cluster_instance" "compliant_db_instances" {
  count              = 2
  identifier         = "compliant-aurora-instance-${count.index}"
  cluster_identifier = aws_rds_cluster.compliant_db.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.compliant_db.engine
  engine_version     = aws_rds_cluster.compliant_db.engine_version
  
  performance_insights_enabled = true
  monitoring_interval         = 60
}
```

#### 3. Caching - ElastiCache Redis

**Terraform Configuration**:
```hcl
# elasticache.tf
resource "aws_elasticache_replication_group" "compliant_redis" {
  replication_group_id       = "compliant-redis"
  replication_group_description = "Redis cluster for Compliant session management"
  
  engine               = "redis"
  engine_version       = "7.0"
  node_type           = "cache.r6g.large"
  number_cache_clusters = 2
  
  parameter_group_name = "default.redis7"
  port                = 6379
  
  subnet_group_name  = aws_elasticache_subnet_group.compliant.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  automatic_failover_enabled = true
  
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
  
  tags = {
    Environment = "production"
    Application = "compliant"
  }
}
```

#### 4. File Storage - S3

**Terraform Configuration**:
```hcl
# s3.tf
resource "aws_s3_bucket" "compliant_files" {
  bucket = "compliant-insurance-files"
  
  tags = {
    Environment = "production"
    Application = "compliant"
  }
}

resource "aws_s3_bucket_versioning" "compliant_files" {
  bucket = aws_s3_bucket.compliant_files.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "compliant_files" {
  bucket = aws_s3_bucket.compliant_files.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "compliant_files" {
  bucket = aws_s3_bucket.compliant_files.id
  
  rule {
    id     = "archive_old_files"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "INTELLIGENT_TIERING"
    }
    
    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "compliant_files" {
  bucket = aws_s3_bucket.compliant_files.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

#### 5. CDN - CloudFront (Frontend)

**Terraform Configuration**:
```hcl
# cloudfront.tf
resource "aws_cloudfront_distribution" "compliant_frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Compliant Insurance Platform Frontend"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  
  origin {
    domain_name = aws_s3_bucket.compliant_frontend.bucket_regional_domain_name
    origin_id   = "S3-compliant-frontend"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.compliant.cloudfront_access_identity_path
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-compliant-frontend"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.compliant.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
```

#### 6. Secrets Management - AWS Secrets Manager

**Storing Secrets**:
```bash
# Store database URL
aws secretsmanager create-secret \
  --name compliant/database-url \
  --secret-string "postgresql://user:pass@rds-endpoint:5432/compliant_prod"

# Store JWT secrets
aws secretsmanager create-secret \
  --name compliant/jwt-secret \
  --secret-string "your-256-bit-jwt-secret"

aws secretsmanager create-secret \
  --name compliant/jwt-refresh-secret \
  --secret-string "your-256-bit-refresh-secret"

# Store API keys
aws secretsmanager create-secret \
  --name compliant/openai-api-key \
  --secret-string "your-openai-api-key"

aws secretsmanager create-secret \
  --name compliant/sendgrid-api-key \
  --secret-string "your-sendgrid-api-key"
```

#### 7. Monitoring - CloudWatch

**CloudWatch Dashboard**:
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
          [".", "MemoryUtilization", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Resource Utilization"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "DatabaseConnections"],
          [".", "CPUUtilization"],
          [".", "FreeableMemory"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "RDS Performance"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/ecs/compliant-backend'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20",
        "region": "us-east-1",
        "title": "Recent Errors"
      }
    }
  ]
}
```

**CloudWatch Alarms**:
```hcl
# cloudwatch-alarms.tf
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "compliant-backend-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ServiceName = "compliant-backend-service"
    ClusterName = "compliant-cluster"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connection_high" {
  alarm_name          = "compliant-db-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

### VPC Configuration

**Terraform VPC Setup**:
```hcl
# vpc.tf
resource "aws_vpc" "compliant" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "compliant-vpc"
    Environment = "production"
  }
}

# Public subnets (ALB)
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.compliant.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true
  
  tags = {
    Name = "compliant-public-${count.index + 1}"
  }
}

# Private subnets (ECS, RDS, ElastiCache)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.compliant.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "compliant-private-${count.index + 1}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "compliant" {
  vpc_id = aws_vpc.compliant.id
  
  tags = {
    Name = "compliant-igw"
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
}

resource "aws_nat_gateway" "compliant" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "compliant-nat-${count.index + 1}"
  }
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create comprehensive CI/CD pipeline at `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: compliant-backend
  ECS_CLUSTER: compliant-cluster
  ECS_SERVICE: compliant-backend-service
  ECS_TASK_DEFINITION: task-definition.json

jobs:
  # Job 1: Code Quality Checks
  code-quality:
    name: Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint code
        run: pnpm lint
      
      - name: Type check
        run: pnpm type-check
      
      - name: Build shared package
        run: cd packages/shared && pnpm build

  # Job 2: Backend Tests
  backend-tests:
    name: Backend Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: compliant_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build shared package
        run: cd packages/shared && pnpm build
      
      - name: Run Prisma migrations
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/compliant_test
        run: cd packages/backend && npx prisma migrate deploy
      
      - name: Run backend tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/compliant_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-for-ci-minimum-32-characters
          JWT_REFRESH_SECRET: test-refresh-secret-for-ci-minimum-32
        run: cd packages/backend && pnpm test:cov
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/backend/coverage/lcov.info
          flags: backend

  # Job 3: Frontend Tests
  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build shared package
        run: cd packages/shared && pnpm build
      
      - name: Run frontend tests
        run: cd packages/frontend && pnpm test
      
      - name: Build frontend
        env:
          NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
        run: cd packages/frontend && pnpm build

  # Job 4: Security Scan
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Run npm audit
        run: pnpm audit --audit-level=high

  # Job 5: Build and Push Docker Images
  build-and-push:
    name: Build & Push to ECR
    runs-on: ubuntu-latest
    needs: [code-quality, backend-tests, frontend-tests, security-scan]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build, tag, and push backend image to ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -f packages/backend/Dockerfile .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Build frontend for S3
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.PRODUCTION_API_URL }}
        run: |
          cd packages/frontend
          pnpm install --frozen-lockfile
          pnpm build
      
      - name: Deploy frontend to S3
        run: |
          aws s3 sync packages/frontend/out s3://compliant-frontend-prod --delete
      
      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

  # Job 6: Deploy to ECS
  deploy-backend:
    name: Deploy Backend to ECS
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Fill in the new image ID in the ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: backend
          image: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}
      
      - name: Run database migrations
        run: |
          # Execute migrations using ECS run-task
          aws ecs run-task \
            --cluster ${{ env.ECS_CLUSTER }} \
            --task-definition compliant-migration \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${{ secrets.PRIVATE_SUBNETS }}],securityGroups=[${{ secrets.ECS_SECURITY_GROUP }}]}"
      
      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
      
      - name: Verify deployment
        run: |
          # Check health endpoint
          LOAD_BALANCER_URL="${{ secrets.LOAD_BALANCER_URL }}"
          MAX_RETRIES=30
          RETRY_INTERVAL=10
          
          for i in $(seq 1 $MAX_RETRIES); do
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $LOAD_BALANCER_URL/health)
            if [ $HTTP_CODE -eq 200 ]; then
              echo "Deployment successful! Health check passed."
              exit 0
            fi
            echo "Attempt $i/$MAX_RETRIES: Health check returned $HTTP_CODE. Retrying in $RETRY_INTERVAL seconds..."
            sleep $RETRY_INTERVAL
          done
          
          echo "Deployment verification failed after $MAX_RETRIES attempts."
          exit 1

  # Job 7: Database Backup
  backup-database:
    name: Backup Database
    runs-on: ubuntu-latest
    needs: deploy-backend
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Create RDS snapshot
        run: |
          SNAPSHOT_ID="compliant-prod-$(date +%Y%m%d-%H%M%S)"
          aws rds create-db-cluster-snapshot \
            --db-cluster-snapshot-identifier $SNAPSHOT_ID \
            --db-cluster-identifier compliant-aurora-cluster
          echo "Created snapshot: $SNAPSHOT_ID"

  # Job 8: Notify Deployment
  notify:
    name: Notify Team
    runs-on: ubuntu-latest
    needs: deploy-backend
    if: always()
    
    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment Status: ${{ job.status }}
            Branch: ${{ github.ref }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### Deployment Scripts

**Create deployment helper script** (`scripts/deploy.sh`):

```bash
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
AWS_REGION="us-east-1"
ECR_REPOSITORY="compliant-backend"
ECS_CLUSTER="compliant-cluster"
ECS_SERVICE="compliant-backend-service"

echo -e "${GREEN}Starting deployment to ${ENVIRONMENT}...${NC}"

# Step 1: Run tests
echo -e "${YELLOW}Step 1: Running tests...${NC}"
pnpm test
echo -e "${GREEN}✓ Tests passed${NC}"

# Step 2: Build Docker image
echo -e "${YELLOW}Step 2: Building Docker image...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG=$(git rev-parse --short HEAD)

docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} -f packages/backend/Dockerfile .
echo -e "${GREEN}✓ Docker image built${NC}"

# Step 3: Login to ECR
echo -e "${YELLOW}Step 3: Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}
echo -e "${GREEN}✓ Logged in to ECR${NC}"

# Step 4: Tag and push image
echo -e "${YELLOW}Step 4: Pushing image to ECR...${NC}"
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_URL}/${ECR_REPOSITORY}:${IMAGE_TAG}
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_URL}/${ECR_REPOSITORY}:latest
docker push ${ECR_URL}/${ECR_REPOSITORY}:${IMAGE_TAG}
docker push ${ECR_URL}/${ECR_REPOSITORY}:latest
echo -e "${GREEN}✓ Image pushed to ECR${NC}"

# Step 5: Update ECS service
echo -e "${YELLOW}Step 5: Updating ECS service...${NC}"
aws ecs update-service \
  --cluster ${ECS_CLUSTER} \
  --service ${ECS_SERVICE} \
  --force-new-deployment \
  --region ${AWS_REGION}
echo -e "${GREEN}✓ ECS service updated${NC}"

# Step 6: Wait for deployment
echo -e "${YELLOW}Step 6: Waiting for deployment to complete...${NC}"
aws ecs wait services-stable \
  --cluster ${ECS_CLUSTER} \
  --services ${ECS_SERVICE} \
  --region ${AWS_REGION}
echo -e "${GREEN}✓ Deployment completed successfully${NC}"

# Step 7: Verify health
echo -e "${YELLOW}Step 7: Verifying health check...${NC}"
LOAD_BALANCER_URL=$(aws elbv2 describe-load-balancers --query "LoadBalancers[?LoadBalancerName=='compliant-alb'].DNSName" --output text)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${LOAD_BALANCER_URL}/health)

if [ $HTTP_CODE -eq 200 ]; then
  echo -e "${GREEN}✓ Health check passed (HTTP ${HTTP_CODE})${NC}"
else
  echo -e "${RED}✗ Health check failed (HTTP ${HTTP_CODE})${NC}"
  exit 1
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
```

### Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

```
AWS_ACCESS_KEY_ID              # IAM user with minimal required permissions
AWS_SECRET_ACCESS_KEY          # Corresponding secret key
AWS_REGION                     # e.g., us-east-1
CLOUDFRONT_DISTRIBUTION_ID     # CloudFront distribution ID
PRODUCTION_API_URL             # Production API endpoint
LOAD_BALANCER_URL              # ALB DNS name
PRIVATE_SUBNETS                # Comma-separated subnet IDs
ECS_SECURITY_GROUP             # Security group ID for ECS tasks
SLACK_WEBHOOK                  # (optional) For deployment notifications
```

**Security Best Practices for GitHub Secrets**:
1. **Principle of Least Privilege**: Create dedicated IAM user with only required permissions
2. **Use IAM Roles**: Consider using OIDC for GitHub Actions instead of long-lived credentials
3. **Rotate Secrets Regularly**: Rotate AWS credentials every 90 days
4. **Audit Access**: Enable CloudTrail logging for all API calls
5. **Separate Environments**: Use different AWS accounts/credentials for staging and production
6. **Never Log Secrets**: Ensure secrets are not printed in GitHub Actions logs
7. **Use Environment Protection**: Enable required reviewers for production deployments

**Minimal IAM Policy for GitHub Actions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:RunTask"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::compliant-frontend-prod",
        "arn:aws:s3:::compliant-frontend-prod/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole"
    }
  ]
}
```

---

## Deployment Checklist

Before deploying each PR to production:

### Code Quality
- [ ] All tests passing
- [ ] Code coverage meets requirements (80%+)
- [ ] No linting errors
- [ ] TypeScript strict mode enabled
- [ ] No console.log statements in production code

### Security
- [ ] Security audit passed
- [ ] No hardcoded secrets
- [ ] Environment variables documented
- [ ] HTTPS enabled
- [ ] Rate limiting implemented
- [ ] Input validation implemented

### Documentation
- [ ] API documentation updated
- [ ] README updated
- [ ] Environment variables documented
- [ ] Migration guide provided (if needed)

### Database
- [ ] Migrations created and tested
- [ ] Database backup taken
- [ ] Rollback plan documented
- [ ] Indexes added for performance

### Monitoring
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Error tracking enabled (Sentry)
- [ ] Performance monitoring enabled

### Performance
- [ ] Load testing completed
- [ ] API response times acceptable
- [ ] Database queries optimized
- [ ] Caching implemented where needed

---

## Rollback Procedures

If issues are discovered after deployment:

1. **Immediate Actions**:
   - Notify team via communication channel
   - Assess severity and impact
   - Decide: fix forward or rollback

2. **Rollback Steps**:
   ```bash
   # Revert to previous version
   git revert <commit-hash>
   
   # Rollback database migrations
   npx prisma migrate resolve --rolled-back <migration-name>
   
   # Redeploy
   npm run deploy
   ```

3. **Post-Rollback**:
   - Verify system functionality
   - Notify stakeholders
   - Document incident
   - Plan fix and re-deployment

---

## Support and Resources

### Documentation
- NestJS: https://docs.nestjs.com
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Zod: https://zod.dev

### Team Communication
- Daily standups for progress updates
- PR reviews within 24 hours
- Weekly sprint planning
- Retrospectives after each PR merge

### Getting Help
- Create GitHub issues for bugs
- Use Discussions for questions
- Tag relevant team members in PRs
- Escalate blockers immediately

---

## Conclusion

This implementation guide provides a structured approach to building the Compliant Insurance Platform. Each PR builds upon the previous, creating a solid foundation for an enterprise-grade application.

**Key Principles**:
- 🎯 Focus on quality over speed
- 🔒 Security is not optional
- 📝 Documentation is code
- 🧪 Test everything
- 🤝 Collaborate and communicate

Follow these guidelines to ensure consistent, maintainable, and secure code across all implementations.
