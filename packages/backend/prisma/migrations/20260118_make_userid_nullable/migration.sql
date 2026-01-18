-- AlterTable
-- Make userId column nullable in audit_logs table to support anonymous/unauthenticated audit events
ALTER TABLE "audit_logs" ALTER COLUMN "userId" DROP NOT NULL;
