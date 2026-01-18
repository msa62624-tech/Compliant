-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'CONTRACTOR', 'SUBCONTRACTOR', 'BROKER');

-- CreateEnum
CREATE TYPE "ContractorType" AS ENUM ('GENERAL_CONTRACTOR', 'SUBCONTRACTOR');

-- CreateEnum
CREATE TYPE "BrokerType" AS ENUM ('GLOBAL', 'PER_POLICY');

-- CreateEnum
CREATE TYPE "ContractorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InsuranceStatus" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'PENDING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "COIStatus" AS ENUM ('AWAITING_BROKER_INFO', 'AWAITING_BROKER_UPLOAD', 'AWAITING_BROKER_SIGNATURE', 'AWAITING_ADMIN_REVIEW', 'ACTIVE', 'DEFICIENCY_PENDING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('GENERAL_LIABILITY', 'WORKERS_COMPENSATION', 'AUTO_LIABILITY', 'PROFESSIONAL_LIABILITY', 'UMBRELLA');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('DAYS_30', 'DAYS_14', 'DAYS_7', 'DAYS_2', 'EVERY_2_DAYS', 'EXPIRED');

-- CreateEnum
CREATE TYPE "HoldHarmlessStatus" AS ENUM ('PENDING_GENERATION', 'PENDING_SUB_SIGNATURE', 'PENDING_GC_SIGNATURE', 'COMPLETED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "contractorType" "ContractorType" NOT NULL DEFAULT 'SUBCONTRACTOR',
    "status" "ContractorStatus" NOT NULL DEFAULT 'PENDING',
    "insuranceStatus" "InsuranceStatus" NOT NULL DEFAULT 'PENDING',
    "trades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brokerName" TEXT,
    "brokerEmail" TEXT,
    "brokerPhone" TEXT,
    "brokerCompany" TEXT,
    "brokerType" "BrokerType",
    "brokerGlName" TEXT,
    "brokerGlEmail" TEXT,
    "brokerGlPhone" TEXT,
    "brokerAutoName" TEXT,
    "brokerAutoEmail" TEXT,
    "brokerAutoPhone" TEXT,
    "brokerUmbrellaName" TEXT,
    "brokerUmbrellaEmail" TEXT,
    "brokerUmbrellaPhone" TEXT,
    "brokerWcName" TEXT,
    "brokerWcEmail" TEXT,
    "brokerWcPhone" TEXT,
    "assignedAdminEmail" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "gcName" TEXT,
    "location" TEXT,
    "borough" TEXT,
    "block" TEXT,
    "lot" TEXT,
    "buildingHeight" TEXT,
    "structureType" TEXT,
    "entity" TEXT,
    "additionalInsureds" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "assignedAdminEmail" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_contractors" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "role" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_contractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_subcontractors" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "role" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_subcontractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_cois" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "projectName" TEXT,
    "gcName" TEXT,
    "subcontractorName" TEXT,
    "status" "COIStatus" NOT NULL DEFAULT 'AWAITING_BROKER_INFO',
    "brokerName" TEXT,
    "brokerEmail" TEXT,
    "brokerPhone" TEXT,
    "brokerCompany" TEXT,
    "brokerGlName" TEXT,
    "brokerGlEmail" TEXT,
    "brokerGlPhone" TEXT,
    "brokerAutoName" TEXT,
    "brokerAutoEmail" TEXT,
    "brokerAutoPhone" TEXT,
    "brokerUmbrellaName" TEXT,
    "brokerUmbrellaEmail" TEXT,
    "brokerUmbrellaPhone" TEXT,
    "brokerWcName" TEXT,
    "brokerWcEmail" TEXT,
    "brokerWcPhone" TEXT,
    "glPolicyUrl" TEXT,
    "umbrellaPolicyUrl" TEXT,
    "autoPolicyUrl" TEXT,
    "wcPolicyUrl" TEXT,
    "glBrokerSignatureUrl" TEXT,
    "umbrellaBrokerSignatureUrl" TEXT,
    "autoBrokerSignatureUrl" TEXT,
    "wcBrokerSignatureUrl" TEXT,
    "glExpirationDate" TIMESTAMP(3),
    "umbrellaExpirationDate" TIMESTAMP(3),
    "autoExpirationDate" TIMESTAMP(3),
    "wcExpirationDate" TIMESTAMP(3),
    "firstCOIUploaded" BOOLEAN NOT NULL DEFAULT false,
    "firstCOIUrl" TEXT,
    "holdHarmlessDocumentUrl" TEXT,
    "holdHarmlessUploadedAt" TIMESTAMP(3),
    "holdHarmlessStatus" "HoldHarmlessStatus" NOT NULL DEFAULT 'PENDING_GENERATION',
    "assignedAdminEmail" TEXT,
    "deficiencyNotes" TEXT,
    "rejectionReason" TEXT,
    "uploadedForReviewDate" TIMESTAMP(3),
    "brokerVerifiedAtRenewal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_cois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_documents" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "coverageAmount" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- Note: userId is nullable to support anonymous/unauthenticated audit events
-- such as failed login attempts, public API access, or system-generated events
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expiration_reminders" (
    "id" TEXT NOT NULL,
    "coiId" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "daysBeforeExpiry" INTEGER NOT NULL,
    "reminderType" "ReminderType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentTo" TEXT[],
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expiration_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hold_harmless" (
    "id" TEXT NOT NULL,
    "coiId" TEXT NOT NULL,
    "programId" TEXT,
    "templateUrl" TEXT,
    "generatedDocUrl" TEXT,
    "finalDocUrl" TEXT,
    "status" "HoldHarmlessStatus" NOT NULL DEFAULT 'PENDING_GENERATION',
    "projectAddress" TEXT,
    "gcName" TEXT,
    "gcEmail" TEXT,
    "ownersEntity" TEXT,
    "additionalInsureds" TEXT[],
    "subcontractorName" TEXT,
    "subcontractorEmail" TEXT,
    "agreementType" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "subSignatureUrl" TEXT,
    "subSignedAt" TIMESTAMP(3),
    "subSignedBy" TEXT,
    "subSignatureToken" TEXT,
    "subSignatureLinkSentAt" TIMESTAMP(3),
    "gcSignatureUrl" TEXT,
    "gcSignedAt" TIMESTAMP(3),
    "gcSignedBy" TEXT,
    "gcSignatureToken" TEXT,
    "gcSignatureLinkSentAt" TIMESTAMP(3),
    "notificationsSent" TEXT[],
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "hold_harmless_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT true,
    "glMinimum" DOUBLE PRECISION,
    "wcMinimum" DOUBLE PRECISION,
    "autoMinimum" DOUBLE PRECISION,
    "umbrellaMinimum" DOUBLE PRECISION,
    "requiresHoldHarmless" BOOLEAN NOT NULL DEFAULT false,
    "holdHarmlessTemplateUrl" TEXT,
    "requiresAdditionalInsured" BOOLEAN NOT NULL DEFAULT true,
    "requiresWaiverSubrogation" BOOLEAN NOT NULL DEFAULT true,
    "tierRequirements" JSONB,
    "tradeRequirements" JSONB,
    "autoApprovalRules" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_programs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "customRequirements" JSONB,

    CONSTRAINT "project_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_selector_key" ON "refresh_tokens"("selector");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_expiresAt_idx" ON "refresh_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "contractors_email_key" ON "contractors"("email");

-- CreateIndex
CREATE INDEX "contractors_trades_idx" ON "contractors"("trades");

-- CreateIndex
CREATE UNIQUE INDEX "project_contractors_projectId_contractorId_key" ON "project_contractors"("projectId", "contractorId");

-- CreateIndex
CREATE UNIQUE INDEX "project_subcontractors_projectId_subcontractorId_key" ON "project_subcontractors"("projectId", "subcontractorId");

-- CreateIndex
CREATE INDEX "generated_cois_projectId_idx" ON "generated_cois"("projectId");

-- CreateIndex
CREATE INDEX "generated_cois_subcontractorId_idx" ON "generated_cois"("subcontractorId");

-- CreateIndex
CREATE INDEX "generated_cois_status_idx" ON "generated_cois"("status");

-- CreateIndex
CREATE INDEX "generated_cois_assignedAdminEmail_idx" ON "generated_cois"("assignedAdminEmail");

-- CreateIndex
CREATE INDEX "generated_cois_glExpirationDate_idx" ON "generated_cois"("glExpirationDate");

-- CreateIndex
CREATE INDEX "generated_cois_umbrellaExpirationDate_idx" ON "generated_cois"("umbrellaExpirationDate");

-- CreateIndex
CREATE INDEX "insurance_documents_contractorId_idx" ON "insurance_documents"("contractorId");

-- CreateIndex
CREATE INDEX "insurance_documents_status_idx" ON "insurance_documents"("status");

-- CreateIndex
CREATE INDEX "insurance_documents_expirationDate_idx" ON "insurance_documents"("expirationDate");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "expiration_reminders_coiId_idx" ON "expiration_reminders"("coiId");

-- CreateIndex
CREATE INDEX "expiration_reminders_expirationDate_idx" ON "expiration_reminders"("expirationDate");

-- CreateIndex
CREATE INDEX "expiration_reminders_daysBeforeExpiry_idx" ON "expiration_reminders"("daysBeforeExpiry");

-- CreateIndex
CREATE INDEX "expiration_reminders_sentAt_idx" ON "expiration_reminders"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "hold_harmless_coiId_key" ON "hold_harmless"("coiId");

-- CreateIndex
CREATE INDEX "hold_harmless_coiId_idx" ON "hold_harmless"("coiId");

-- CreateIndex
CREATE INDEX "hold_harmless_status_idx" ON "hold_harmless"("status");

-- CreateIndex
CREATE INDEX "hold_harmless_subSignatureToken_idx" ON "hold_harmless"("subSignatureToken");

-- CreateIndex
CREATE INDEX "hold_harmless_gcSignatureToken_idx" ON "hold_harmless"("gcSignatureToken");

-- CreateIndex
CREATE INDEX "insurance_programs_name_idx" ON "insurance_programs"("name");

-- CreateIndex
CREATE INDEX "insurance_programs_isTemplate_idx" ON "insurance_programs"("isTemplate");

-- CreateIndex
CREATE UNIQUE INDEX "project_programs_projectId_programId_key" ON "project_programs"("projectId", "programId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_contractors" ADD CONSTRAINT "project_contractors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_contractors" ADD CONSTRAINT "project_contractors_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_subcontractors" ADD CONSTRAINT "project_subcontractors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_subcontractors" ADD CONSTRAINT "project_subcontractors_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_cois" ADD CONSTRAINT "generated_cois_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_cois" ADD CONSTRAINT "generated_cois_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_cois" ADD CONSTRAINT "generated_cois_assignedAdminEmail_fkey" FOREIGN KEY ("assignedAdminEmail") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_documents" ADD CONSTRAINT "insurance_documents_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expiration_reminders" ADD CONSTRAINT "expiration_reminders_coiId_fkey" FOREIGN KEY ("coiId") REFERENCES "generated_cois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hold_harmless" ADD CONSTRAINT "hold_harmless_coiId_fkey" FOREIGN KEY ("coiId") REFERENCES "generated_cois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_programs" ADD CONSTRAINT "project_programs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_programs" ADD CONSTRAINT "project_programs_programId_fkey" FOREIGN KEY ("programId") REFERENCES "insurance_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

