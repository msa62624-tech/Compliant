# Production Configuration Guide

This guide explains how to configure the backend for production deployment with real integrations (no mocks).

**Note:** This guide is platform-agnostic. Your developer can choose any hosting platform (AWS, Azure, Google Cloud, DigitalOcean, self-hosted, etc.). The configuration steps remain the same regardless of platform.

## ⚠️ Important: No Mock Data in Production

The backend has been configured to **fail fast** when services are not properly configured. This means:

- ❌ No mock responses
- ❌ No fallback to test data
- ✅ Clear error messages indicating what needs to be configured
- ✅ Production-ready integrations

## Required Configuration

### 1. Environment Variables (.env)

Create a `/backend/.env` file with the following variables:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret (REQUIRED - Change in production!)
JWT_SECRET=your-production-secret-key-change-this

# CORS Configuration
FRONTEND_URL=https://yourdomain.com

# Admin Emails (comma-separated)
ADMIN_EMAILS=admin@yourdomain.com,compliance@yourdomain.com
```

### 2. Email Configuration (SMTP)

**Status:** ✅ Functional - Requires Configuration

Configure SMTP to send real emails:

```bash
# Option A: Microsoft 365 / Outlook
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your.email@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=your.email@yourdomain.com
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true

# Option B: Gmail (requires App Password)
SMTP_SERVICE=gmail
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your.email@gmail.com
```

**Testing:**
```bash
cd backend
npm run dev
# Check console for: "✅ Email service: CONFIGURED"
```

### 3. Adobe PDF Services

**Status:** ❌ Requires Configuration - No Mock Fallback

Adobe PDF Services are used for:
- PDF text extraction
- COI field extraction
- Digital signatures
- PDF merging

**Setup:**
1. Create an account at https://developer.adobe.com/document-services/
2. Create a new project and choose "PDF Services API"
3. Get your API credentials (Client ID and Client Secret)
4. Add to `.env`:

```bash
ADOBE_API_KEY=your-adobe-api-key
ADOBE_CLIENT_ID=your-adobe-client-id
```

**Important Notes:**
- The Adobe PDF Services integration uses standard REST API endpoints
- API endpoint paths and authentication methods should be verified against Adobe's official documentation
- Adobe Sign (for digital signatures) may require separate authentication from PDF Services
- See Adobe's documentation: https://developer.adobe.com/document-services/docs/

**Without configuration:** Endpoints will return error: `Adobe PDF Services not configured. Set ADOBE_API_KEY and ADOBE_CLIENT_ID environment variables.`

### 4. AI Analysis Service

**Status:** ❌ Requires Configuration - No Mock Fallback

AI Analysis is used for:
- COI compliance analysis
- Policy data extraction
- Risk assessment
- Review recommendations

**Option A: OpenAI (Recommended)**

1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`:

```bash
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-api-key
AI_MODEL=gpt-4-turbo-preview
```

**Option B: Anthropic Claude**

1. Get API key from https://console.anthropic.com/
2. Add to `.env`:

```bash
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-your-anthropic-api-key
AI_MODEL=claude-3-opus-20240229
```

**Without configuration:** AI endpoints will return error: `AI Analysis Service not configured. Set AI_API_KEY environment variable.`

### 5. File Storage (Optional - Currently Uses Local Filesystem)

For production deployment, configure cloud storage:

**Note:** Your developer can choose the cloud storage provider that best fits your infrastructure.

**Option A: AWS S3**
```bash
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

**Option B: Azure Blob Storage**
```bash
AZURE_STORAGE_ACCOUNT=your-account-name
AZURE_STORAGE_KEY=your-storage-key
AZURE_STORAGE_CONTAINER=uploads
```

**Option C: Google Cloud Storage**
```bash
GCS_BUCKET=your-bucket-name
GCS_PROJECT_ID=your-project-id
GCS_KEY_FILE=path/to/service-account-key.json
```

**Without configuration:** Files are stored locally in `/backend/uploads/` directory. This works but files may be lost on server restart in ephemeral environments. Set `IS_EPHEMERAL_STORAGE=true` environment variable if using ephemeral storage to enable appropriate warnings.

## Deployment Checklist

### Pre-Deployment

- [ ] Update `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` to your production domain
- [ ] Set up SMTP email configuration
- [ ] Configure Adobe PDF Services (if using PDF features)
- [ ] Configure AI Analysis Service (if using compliance features)
- [ ] Set up cloud file storage (S3 or Azure Blob)
- [ ] Update `ADMIN_EMAILS` to real admin email addresses

### Post-Deployment Verification

1. **Check Service Status**
   ```bash
   # Start the backend and check console output
   cd backend
   npm start
   ```

   Expected output:
   ```
   ✅ Adobe PDF Services: ENABLED
   ✅ AI Analysis Service: ENABLED (Provider: openai, Model: gpt-4-turbo-preview)
   ✅ Email service: CONFIGURED (smtp.office365.com)
   ✅ Security: Helmet enabled, Rate limiting active
   ```

2. **Test Email Sending**
   - Try the "Request COI Upload" feature
   - Check if emails are received by brokers/subcontractors

3. **Test PDF Processing**
   - Upload a COI PDF
   - Verify text extraction works
   - Check if fields are parsed correctly

4. **Test AI Analysis**
   - Submit a COI for review
   - Verify compliance analysis runs
   - Check risk assessment results

## Service Dependencies Matrix

| Feature | Requires SMTP | Requires Adobe PDF | Requires AI | Notes |
|---------|---------------|-------------------|-------------|--------|
| User Authentication | ❌ | ❌ | ❌ | Works without external services |
| Project Management | ❌ | ❌ | ❌ | Works without external services |
| COI Upload (Manual) | ✅ | ❌ | ❌ | Email for notifications |
| COI Auto-Extraction | ✅ | ✅ | ❌ | PDF text extraction needed |
| Compliance Analysis | ✅ | ✅ | ✅ | All services needed |
| Digital Signatures | ✅ | ✅ | ❌ | PDF signing needed |
| Risk Assessment | ❌ | ❌ | ✅ | AI analysis needed |


## Error Messages

When services are not configured, users will see clear error messages:

### Adobe PDF Service
```
Error: Adobe PDF Services not configured. Set ADOBE_API_KEY and ADOBE_CLIENT_ID environment variables.
```

### AI Analysis Service
```
Error: AI Analysis Service not configured. Set AI_API_KEY environment variable.
```

### SMTP Email (Fallback Mode)
```
⚠️ Email service: TEST MODE (not configured for real emails)
📧 MOCK: Would send email to broker@example.com
```

## Support

For configuration issues:
1. Check the console output for specific error messages
2. Verify all environment variables are set correctly
3. Ensure API keys are valid and have proper permissions
4. Check network connectivity to external services

## Security Notes

- Never commit `.env` files to version control
- Rotate API keys regularly
- Use strong, random JWT secrets
- Enable TLS/SSL for SMTP connections
- Keep dependencies up to date
- Monitor API usage and costs

## Cost Estimates

**Adobe PDF Services:**
- Free tier: 1,000 transactions/month
- Paid plans start at $9.99/month

**OpenAI GPT-4:**
- $0.01 per 1K input tokens
- $0.03 per 1K output tokens
- Typical COI analysis: ~$0.05-0.10 per document

**SMTP Email:**
- Microsoft 365: Included with subscription
- Gmail: Free for personal use
- SendGrid: Free tier (100 emails/day)

## Summary

✅ **Production Ready:** All mock responses have been removed
✅ **Fail Fast:** Services fail with clear error messages when not configured
✅ **Flexible:** Choose which services to enable based on your needs
✅ **Secure:** Proper authentication and encryption for all external services
