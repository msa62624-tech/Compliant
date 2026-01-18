# Database Migration: Make userId Nullable in AuditLog

## Migration Details

**Migration Name:** `20260118_make_userid_nullable`

**Purpose:** Make the `userId` column nullable in the `audit_logs` table to support anonymous/unauthenticated audit events such as failed login attempts, unauthorized access attempts, and other pre-authentication security events.

## What This Migration Does

This migration executes the following SQL command:

```sql
ALTER TABLE "audit_logs" ALTER COLUMN "userId" DROP NOT NULL;
```

This makes the `userId` column optional, allowing audit logs to be created without a user ID.

## How to Apply This Migration

### For Development Environments

```bash
cd packages/backend
pnpm db:migrate dev
```

This will:
1. Apply the migration to your development database
2. Update the `_prisma_migrations` table to track this migration
3. Regenerate the Prisma Client

### For Production Environments

```bash
cd packages/backend
pnpm db:migrate deploy
```

This will apply all pending migrations to your production database.

## Backward Compatibility

✅ **This migration is backward compatible:**
- All existing audit log records with non-null `userId` values will continue to work
- The foreign key constraint to the `users` table remains intact
- No data migration is required
- No existing functionality is affected

## Impact

**Before:** The `userId` column was required, preventing the logging of anonymous security events.

**After:** The `userId` column is optional, enabling comprehensive audit logging including:
- Failed login attempts (before user authentication)
- Unauthorized access attempts
- Rate limiting violations  
- Other pre-authentication security events

## Testing

All tests pass after this migration:
- ✅ 12 audit service tests (including anonymous event tests)
- ✅ All backend tests pass

## Rollback (if needed)

If you need to rollback this migration, you can manually execute:

```sql
-- First, you would need to ensure all NULL userIds are handled
-- Then you can make the column NOT NULL again
ALTER TABLE "audit_logs" ALTER COLUMN "userId" SET NOT NULL;
```

⚠️ **Warning:** Rolling back this migration will prevent anonymous audit events from being logged and may cause application errors if anonymous logging is attempted.
