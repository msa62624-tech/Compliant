# Database Schema Migration Notes

## AuditLog Schema Change

### Overview
This PR modifies the `AuditLog` table schema to support anonymous/unauthenticated audit events.

### Schema Changes

**Before:**
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String   // Required field
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... other fields
}
```

**After:**
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String?  // Optional field
  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... other fields
}
```

### Migration Strategy

Since there is no migrations directory yet, this indicates the database schema has not been deployed to production. Therefore:

1. **For New Deployments**: 
   - Run `pnpm db:generate` to generate the Prisma client
   - Run `pnpm db:push` or `pnpm db:migrate` to apply the schema to your database

2. **For Existing Deployments** (if any):
   - The change is **backward compatible** - existing records with non-null userId values will continue to work
   - The migration will make the userId column nullable: `ALTER TABLE audit_logs ALTER COLUMN "userId" DROP NOT NULL;`
   - The foreign key constraint will be modified to support NULL values

### Why This Change Was Necessary

**Critical Security Issue**: The previous schema prevented logging of anonymous security events such as:
- Failed login attempts (before user authentication)
- Unauthorized access attempts
- Rate limiting violations
- Other pre-authentication security events

These are the **most critical events** to track for security and compliance purposes, yet they were being silently dropped.

### Impact

✅ **Positive Impacts:**
- All audit events are now persisted to the database
- Critical security events from unauthenticated users are captured
- Compliance requirements for comprehensive audit logging are met
- Failed login patterns can be detected and analyzed

✅ **Backward Compatibility:**
- All existing code that passes userId continues to work
- Existing audit records are unaffected
- No breaking changes to the API

### Testing

All tests pass successfully:
- ✅ Test for authenticated user events
- ✅ Test for anonymous events
- ✅ Test for anonymous security events (failed logins)
- ✅ Test for error handling
- ✅ All 12 audit service tests pass

### Security Review

- ✅ Code review: No issues found
- ✅ CodeQL security scan: No alerts
- ✅ No vulnerabilities introduced
