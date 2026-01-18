# End-to-End Workflow Test

This directory contains comprehensive end-to-end tests for the Compliant Platform that validate the complete workflow from program creation through Hold Harmless signing.

## Test Overview

The test validates two complete workflows:

### Workflow 1: Initial Setup and Approval
1. Create insurance program with ACORD 25 requirement
2. Create GC (General Contractor) account and project
3. GC adds subcontractor to project
4. Subcontractor adds broker information
5. Broker uploads first-time ACORD 25 (COI) with all policies
6. Admin reviews and approves ACORD 25
7. System auto-generates Hold Harmless agreement
8. Subcontractor signs Hold Harmless (authenticated)
9. GC signs Hold Harmless (authenticated)
10. All parties notified (GC, Sub - broker NOT notified)

### Workflow 2: Renewal with Deficiency Correction
1. Create renewal ACORD 25 for same subcontractor
2. Broker submits generated ACORD 25
3. Admin marks as deficient with detailed notes
4. Broker fixes deficiencies and resubmits
5. Admin approves corrected ACORD 25
6. Hold Harmless signed by both parties (authenticated)

## Test Accounts

The test uses these email addresses as specified:

- **GC (General Contractor)**: miriamsabel1@gmail.com
- **Subcontractor**: msa62624@gmail.com
- **Broker**: msabel@hmlbrokerage.com
- **Admin/System**: miriamsabel@insuretrack.onmicrosoft.com (password: 260Hooper)

## Prerequisites

1. **Backend server running** on http://localhost:3001 (or set API_URL env var)
2. **Database** properly configured and accessible
3. **Admin account** created in the database (use seed script or manual creation)
4. **Node.js** and **npm** or **pnpm** installed

## Installation

```bash
cd tests/e2e
npm install
# or
pnpm install
```

## Running the Test

### Basic Run

```bash
npm test
# or
pnpm test
```

### With Custom Configuration

```bash
# Set custom API URL
API_URL=http://api.staging.compliant.com npm test

# Set custom frontend URL (for email links)
FRONTEND_URL=https://staging.compliant.com npm test

# Both
API_URL=http://api.staging.compliant.com FRONTEND_URL=https://staging.compliant.com npm test
```

### Verbose Mode

```bash
npm run test:verbose
# or
pnpm test:verbose
```

## What the Test Does

### Step-by-Step Process

1. **Authentication** - Logs in as admin with provided credentials
2. **Program Creation** - Creates an insurance program requiring ACORD 25 and Hold Harmless
3. **User Setup** - Creates GC, Subcontractor, and Broker accounts
4. **Project Setup** - Creates a project and assigns the program
5. **COI Creation** - Creates ACORD 25 (Certificate of Insurance) record
6. **Broker Information** - Subcontractor provides broker details
7. **Document Upload** - Broker uploads ACORD 25 and all required policies
8. **Admin Review** - Admin reviews and approves documents
9. **Hold Harmless Generation** - System auto-generates Hold Harmless agreement
10. **Signature Workflow** - Both parties sign via authenticated endpoints
11. **Renewal Process** - Tests renewal with deficiency marking and correction
12. **Verification** - Verifies final system state and statistics

### Key Features Tested

- ✅ User authentication and authorization
- ✅ Role-based access control (RBAC)
- ✅ Program and project management
- ✅ Contractor (subcontractor) management
- ✅ ACORD 25 (COI) upload and review
- ✅ Approval/rejection workflow
- ✅ Deficiency marking and correction
- ✅ Hold Harmless auto-generation
- ✅ **Authenticated signature workflow** (not public)
- ✅ Email notifications
- ✅ Status transitions
- ✅ Data validation

## Important Notes

### ACORD 25 Reference

Throughout the codebase and tests, **COI (Certificate of Insurance) refers to the ACORD 25 form**. The system manages:
- ACORD 25 form upload
- Individual policy attachments (GL, Auto, Umbrella, WC)
- Expiration tracking
- Compliance validation

### Hold Harmless Security

**Hold Harmless signing requires authentication** - it is NOT a public endpoint. Users must:
1. Log in to the Compliant Platform
2. Access their dashboard
3. Navigate to pending Hold Harmless agreements
4. Sign using their authenticated session

This ensures proper identity verification and audit trails.

### Test Data

The test creates real data in the database:
- Users (GC, Subcontractor, Broker)
- Programs and Projects
- COI records
- Hold Harmless agreements

**Cleanup**: After running the test, you may want to manually clean up test data or use a dedicated test database.

### Email Notifications

The test logs where email notifications would be sent. If SMTP is configured in the backend, actual emails will be sent to:
- GC: miriamsabel1@gmail.com
- Subcontractor: msa62624@gmail.com
- Broker: msabel@hmlbrokerage.com
- Admin: miriamsabel@insuretrack.onmicrosoft.com

## Test Output

The test provides detailed console output with:
- ✓ Green checkmarks for successful steps
- Color-coded sections for different workflows
- Detailed information about each operation
- Final statistics and verification

### Example Output

```
══════════════════════════════════════════════════════════════════════
COMPLIANT PLATFORM - COMPLETE END-TO-END WORKFLOW TEST
══════════════════════════════════════════════════════════════════════

██████████████████████████████████████████████████████████████████████
WORKFLOW 1: INITIAL SETUP AND APPROVAL
██████████████████████████████████████████████████████████████████████

══════════════════════════════════════════════════════════════════════
STEP 1: Create/Login Admin Account
══════════════════════════════════════════════════════════════════════
✓ Admin logged in successfully
  Admin ID: abc-123-def
  Admin Role: SUPER_ADMIN

[... more steps ...]

══════════════════════════════════════════════════════════════════════
TEST SUMMARY
══════════════════════════════════════════════════════════════════════
✓ Total Steps: 18
✓ All Steps Passed: ✓
✓ Test Duration: 2024-01-18T...
══════════════════════════════════════════════════════════════════════
```

## Troubleshooting

### Authentication Failures

If you get 401 errors:
1. Verify admin account exists in database
2. Check password is correct: `260Hooper`
3. Verify JWT secrets are configured in backend `.env`

### API Connection Errors

If you get connection errors:
1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check `API_URL` environment variable
3. Check backend logs for errors

### Database Errors

If you get database errors:
1. Verify DATABASE_URL in backend `.env`
2. Run migrations: `cd packages/backend && pnpm db:push`
3. Check database is accessible

### Email Errors

Email errors are logged but don't fail the test. To fix:
1. Configure SMTP settings in backend `.env`
2. Verify email service credentials
3. Check spam folders for test emails

## Integration with CI/CD

You can run this test in CI/CD pipelines:

```bash
# In GitHub Actions, GitLab CI, etc.
- name: Run E2E Test
  env:
    API_URL: ${{ secrets.API_URL }}
    FRONTEND_URL: ${{ secrets.FRONTEND_URL }}
  run: |
    cd tests/e2e
    npm install
    npm test
```

## Related Documentation

- [Main README](../../README.md) - Project overview and setup
- [WORKFLOW_IMPLEMENTATION.md](../../WORKFLOW_IMPLEMENTATION.md) - Detailed workflow documentation
- [HOLD_HARMLESS_WORKFLOW.md](../../HOLD_HARMLESS_WORKFLOW.md) - Hold Harmless specific details
- [API Documentation](http://localhost:3001/api/docs) - Swagger/OpenAPI docs

## Support

For issues or questions:
1. Check backend logs: `packages/backend/logs/`
2. Review test output for specific error messages
3. Verify all prerequisites are met
4. Check related documentation

## License

MIT License - Same as main project
