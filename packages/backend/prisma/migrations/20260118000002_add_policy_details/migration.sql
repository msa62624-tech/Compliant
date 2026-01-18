-- AlterTable
-- Add policy tracking, signature timestamps, coverage details, and review fields
-- Combined into single ALTER TABLE for better performance and reduced lock time
ALTER TABLE "generated_cois"
  -- Policy numbers for tracking individual policies
  ADD COLUMN "glPolicyNumber" TEXT,
  ADD COLUMN "umbrellaPolicyNumber" TEXT,
  ADD COLUMN "autoPolicyNumber" TEXT,
  ADD COLUMN "wcPolicyNumber" TEXT,
  
  -- Signature timestamps to track when brokers signed each policy
  ADD COLUMN "glBrokerSignedAt" TIMESTAMP(3),
  ADD COLUMN "umbrellaBrokerSignedAt" TIMESTAMP(3),
  ADD COLUMN "autoBrokerSignedAt" TIMESTAMP(3),
  ADD COLUMN "wcBrokerSignedAt" TIMESTAMP(3),
  
  -- Coverage limits and statutory limits for each policy type
  ADD COLUMN "glCoverageLimits" TEXT,
  ADD COLUMN "umbrellaCoverageLimits" TEXT,
  ADD COLUMN "autoCoverageLimits" TEXT,
  ADD COLUMN "wcStatutoryLimits" TEXT,
  
  -- Review tracking fields for admin review workflow
  ADD COLUMN "reviewNotes" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

