-- AlterTable
-- Add policy numbers for tracking individual policies
ALTER TABLE "generated_cois" ADD COLUMN "glPolicyNumber" TEXT;
ALTER TABLE "generated_cois" ADD COLUMN "umbrellaPolicyNumber" TEXT;
ALTER TABLE "generated_cois" ADD COLUMN "autoPolicyNumber" TEXT;
ALTER TABLE "generated_cois" ADD COLUMN "wcPolicyNumber" TEXT;

-- AlterTable
-- Add signature timestamps to track when brokers signed each policy
ALTER TABLE "generated_cois" ADD COLUMN "glBrokerSignedAt" TIMESTAMP(3);
ALTER TABLE "generated_cois" ADD COLUMN "umbrellaBrokerSignedAt" TIMESTAMP(3);
ALTER TABLE "generated_cois" ADD COLUMN "autoBrokerSignedAt" TIMESTAMP(3);
ALTER TABLE "generated_cois" ADD COLUMN "wcBrokerSignedAt" TIMESTAMP(3);

-- AlterTable
-- Add coverage limits and statutory limits for each policy type
ALTER TABLE "generated_cois" ADD COLUMN "glCoverageLimits" TEXT;
ALTER TABLE "generated_cois" ADD COLUMN "umbrellaCoverageLimits" TEXT;
ALTER TABLE "generated_cois" ADD COLUMN "autoCoverageLimits" TEXT;
ALTER TABLE "generated_cois" ADD COLUMN "wcStatutoryLimits" TEXT;

-- AlterTable
-- Add review tracking fields for admin review workflow
ALTER TABLE "generated_cois" ADD COLUMN "reviewNotes" TEXT;
ALTER TABLE "generated_cois" ADD COLUMN "reviewedAt" TIMESTAMP(3);
