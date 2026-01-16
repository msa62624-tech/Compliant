# Database Migration Notes

## Security Update: Refresh Token Hashing (PR #31)

### Schema Changes
- Renamed `refreshToken` field to `refreshTokenHash` in User model
- The field now stores bcrypt-hashed refresh tokens instead of plaintext

### Migration Instructions

#### For Development (using db:push)
```bash
cd packages/backend
pnpm db:push
```

This will:
1. Rename the `refreshToken` column to `refreshTokenHash`
2. All existing refresh tokens will be invalidated (users need to log in again)

#### For Production (using migrations)
```bash
cd packages/backend
pnpm db:migrate
```

### Impact
- **All active sessions will be invalidated** - Users will need to log in again
- This is expected behavior and necessary for security

### Security Improvements
1. **Hashed Token Storage**: Refresh tokens are now hashed with bcrypt before storage
2. **Constant-Time Comparison**: Token validation uses bcrypt.compare to prevent timing attacks
3. **sameSite Cookie Setting**: Changed from 'strict' to 'lax' for better cross-origin support
4. **Multi-Origin CORS**: Backend now supports comma-separated CORS origins

### Testing Checklist
- [ ] Login creates hashed refresh token
- [ ] Refresh token works correctly
- [ ] Logout clears refresh token
- [ ] Invalid tokens are properly rejected
- [ ] Cross-origin requests work with new cookie settings
