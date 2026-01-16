# Database Migration Notes

## Security Update: Separate RefreshToken Table with Selector/Verifier Pattern

### Critical Security Fixes
This update addresses critical timing attack and DoS vulnerabilities identified in the previous implementation:
- **Timing Attack**: Previous O(n) iteration revealed token position through response time
- **DoS Vulnerability**: Single request could force up to 100 seconds of bcrypt operations
- **Scalability**: Didn't scale beyond ~100 active sessions

### Schema Changes

#### New RefreshToken Model
```prisma
model RefreshToken {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  selector    String   @unique // Indexed for O(1) lookup (plaintext)
  verifier    String   // Hashed with bcrypt (for secure comparison)
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([selector])
  @@index([userId, expiresAt]) // Composite index for user-specific cleanup operations
  @@map("refresh_tokens")
}
```

#### Removed from User Model
- `refreshTokenHash` field (removed)
- `refreshTokenExpiresAt` field (removed)

#### Added to User Model
- `refreshTokens RefreshToken[]` relation

### Migration Instructions

#### For Development (using db:push)
```bash
cd packages/backend
pnpm db:push
```

This will:
1. Create the new `refresh_tokens` table with indexes
2. Remove `refreshTokenHash` and `refreshTokenExpiresAt` from users table
3. All existing refresh tokens will be invalidated (users need to log in again)

#### For Production (using migrations)
```bash
cd packages/backend
pnpm db:migrate
```

### Impact
- **All active sessions will be invalidated** - Users will need to log in again
- This is expected behavior and necessary for security
- Token format changes from single string to `selector:verifier` format

### Technical Details

#### Token Format
**Old Format:**
```
abc123def456...xyz  // 64 hex characters (32 bytes)
```

**New Format:**
```
selector:verifier
abc123...def:xyz789...uvw
[16 bytes]:[32 bytes]
[32 hex chars]:[64 hex chars]
```

#### Selector/Verifier Pattern
- **Selector** (16 bytes/32 hex): Stored plaintext, indexed for O(1) database lookup
- **Verifier** (32 bytes/64 hex): Hashed with bcrypt, used for secure verification
- Only the verifier is hashed - selector enables fast indexed lookup
- Single bcrypt.compare per request (vs up to 1000 in old approach)

#### Performance Comparison
| Metric | Old (O(n)) | New (O(1)) |
|--------|-----------|-----------|
| Best case | ~100ms | ~100ms |
| Worst case (1000 sessions) | ~100 seconds | ~100ms |
| Timing attack | Vulnerable | Resistant |
| DoS risk | High | Low |
| Scalability | ~100 sessions | Thousands |

### Security Improvements
1. **Eliminated Timing Attack**: O(1) indexed lookup prevents position-based timing analysis
2. **DoS Protection**: Single bcrypt call per request (~100ms) vs potential 100 seconds
3. **Production Scalability**: Indexed table scales to thousands of concurrent sessions
4. **Token Security**: Selector/verifier pattern with bcrypt hashing (384 bits total entropy)
5. **Automatic Cleanup**: Added `cleanupExpiredTokens()` method for maintenance

### Maintenance

#### Cleanup Expired Tokens
It's recommended to run cleanup periodically (e.g., daily):

```typescript
// In a cron service or scheduled task
await authService.cleanupExpiredTokens();
```

Or manually via a script:
```bash
# TODO: Create a cleanup script
node scripts/cleanup-tokens.js
```

### Testing Checklist
- [ ] Login creates token in RefreshToken table with selector and hashed verifier
- [ ] Refresh token validates using O(1) indexed lookup
- [ ] Token rotation creates new token and deletes old one
- [ ] Logout deletes all user's refresh tokens
- [ ] Invalid tokens are properly rejected (wrong selector, wrong verifier, expired)
- [ ] Cleanup method removes expired tokens
- [ ] Response time is constant regardless of session count
- [ ] No timing difference between valid/invalid tokens at same position
