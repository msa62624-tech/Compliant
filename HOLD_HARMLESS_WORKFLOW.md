# Hold Harmless Signature Workflow Implementation

## Overview

The hold harmless agreement system has been completely redesigned to implement an **automated signature workflow** where:

1. Hold harmless is **auto-generated** when all COI policies are approved
2. System **auto-fills** address and additional insureds from project data
3. **Automatically sent** to subcontractor with a signature link
4. Once sub signs, **automatically sent** to GC with a signature link
5. Once GC signs, **saved** and **all parties notified** (except broker)

## Database Schema Changes

### Updated HoldHarmlessStatus Enum

```prisma
enum HoldHarmlessStatus {
  PENDING_GENERATION       // Waiting for COI approval to trigger generation
  PENDING_SUB_SIGNATURE    // Sent to subcontractor, awaiting signature
  PENDING_GC_SIGNATURE     // Sub signed, sent to GC, awaiting signature
  COMPLETED                // Both parties signed
  REJECTED
  EXPIRED
}
```

### Updated HoldHarmless Model

```prisma
model HoldHarmless {
  id          String             @id @default(uuid())
  coiId       String             @unique
  coi         GeneratedCOI       @relation(...)
  programId   String?            // Reference to program template
  
  // Document URLs
  templateUrl     String?        // Original template from program
  generatedDocUrl String?        // Auto-generated document with filled data
  finalDocUrl     String?        // Final signed document
  
  status      HoldHarmlessStatus @default(PENDING_GENERATION)
  
  // Auto-filled data from system
  projectAddress        String?
  gcName                String?
  gcEmail               String?
  ownersEntity          String?
  additionalInsureds    String[] // List: GC, owners, entities
  subcontractorName     String?
  subcontractorEmail    String?
  
  // Signature tracking - Subcontractor
  subSignatureUrl       String?  // Signature image/data URL
  subSignedAt           DateTime?
  subSignedBy           String?  // Email
  subSignatureToken     String?  // Unique token for signature link
  subSignatureLinkSentAt DateTime?
  
  // Signature tracking - GC
  gcSignatureUrl        String?  // Signature image/data URL
  gcSignedAt            DateTime?
  gcSignedBy            String?  // Email
  gcSignatureToken      String?  // Unique token for signature link
  gcSignatureLinkSentAt DateTime?
  
  // Notifications
  notificationsSent     String[] // Emails notified
  notifiedAt            DateTime?
  
  generatedAt DateTime?          // When auto-generated
  completedAt DateTime?          // When both signatures collected
}
```

### InsuranceProgram Updates

```prisma
model InsuranceProgram {
  // ... existing fields ...
  
  requiresHoldHarmless      Boolean @default(false)
  holdHarmlessTemplateUrl   String? // NEW: URL to template document
  
  // ... existing fields ...
}
```

## Workflow Steps

### 1. Auto-Generation on COI Approval

**Trigger:** When COI status changes to `ACTIVE` (all policies approved)

**Method:** `HoldHarmlessService.autoGenerateOnCOIApproval(coiId)`

**Process:**
1. Fetch COI with project and subcontractor data
2. Check if hold harmless already exists (skip if yes)
3. Get program assigned to project
4. Verify program `requiresHoldHarmless === true`
5. Verify program has `holdHarmlessTemplateUrl` configured
6. Generate unique `subSignatureToken` (64-char hex string)
7. Create HoldHarmless record with:
   - Auto-filled data from project/COI
   - Status: `PENDING_SUB_SIGNATURE`
   - Subcontractor signature token
8. Update COI `holdHarmlessStatus` to `PENDING_SUB_SIGNATURE`
9. Send signature link email to subcontractor

**Auto-filled Fields:**
```typescript
{
  projectAddress: coi.project.address,
  gcName: coi.project.gcName || coi.gcName,
  gcEmail: coi.project.contactEmail,
  ownersEntity: coi.project.entity,
  additionalInsureds: [
    coi.project.gcName,
    coi.project.entity,
    ...coi.project.additionalInsureds.split(',')
  ],
  subcontractorName: coi.subcontractor.name,
  subcontractorEmail: coi.subcontractor.email
}
```

### 2. Subcontractor Signing

**URL:** `GET /hold-harmless/by-token/:token` (public)
- Returns hold harmless details for display
- Includes auto-filled data
- Indicates signing party (`SUBCONTRACTOR`)
- Shows if signature is allowed (`canSign: true/false`)

**Submit:** `POST /hold-harmless/sign/subcontractor/:token` (public)

**Request Body:**
```json
{
  "signatureUrl": "https://storage.../signatures/sub-123.png",
  "signedBy": "john@subcontractor.com"
}
```

**Process:**
1. Find hold harmless by `subSignatureToken`
2. Verify status is `PENDING_SUB_SIGNATURE`
3. Generate unique `gcSignatureToken`
4. Update record with:
   - Sub signature data
   - Status: `PENDING_GC_SIGNATURE`
   - GC signature token
5. Update COI `holdHarmlessStatus`
6. Send signature link email to GC

### 3. GC Signing

**URL:** `GET /hold-harmless/by-token/:token` (public)
- Same as subcontractor but `signingParty: 'GC'`

**Submit:** `POST /hold-harmless/sign/gc/:token` (public)

**Request Body:**
```json
{
  "signatureUrl": "https://storage.../signatures/gc-456.png",
  "signedBy": "jane@gc.com",
  "finalDocUrl": "https://storage.../hold-harmless/final-789.pdf"
}
```

**Process:**
1. Find hold harmless by `gcSignatureToken`
2. Verify status is `PENDING_GC_SIGNATURE`
3. Update record with:
   - GC signature data
   - Final document URL
   - Status: `COMPLETED`
   - `completedAt` timestamp
4. Update COI:
   - `holdHarmlessStatus`: `COMPLETED`
   - `holdHarmlessDocumentUrl`: final document URL
5. Notify all parties (except broker)

### 4. Notification to All Parties

**Recipients:**
- Subcontractor email
- GC email
- (Additional insureds if emails available)

**NOT notified:** Broker

**Email Template:** "Hold Harmless Agreement Completed"
- Includes link to final signed document
- Project address for reference
- Timestamp of completion

## API Endpoints

### Admin Endpoints (Authenticated)

```typescript
// Manually trigger auto-generation (normally happens automatically)
POST /hold-harmless/auto-generate/:coiId
Headers: Authorization: Bearer <token>
Roles: SUPER_ADMIN, ADMIN

// Get hold harmless for a COI
GET /hold-harmless/coi/:coiId
Headers: Authorization: Bearer <token>
Roles: SUPER_ADMIN, ADMIN, MANAGER

// List all hold harmless agreements
GET /hold-harmless?status=PENDING_SUB_SIGNATURE&pendingSignature=true
Headers: Authorization: Bearer <token>
Roles: SUPER_ADMIN, ADMIN, MANAGER

// Resend signature link to SUB or GC
POST /hold-harmless/:id/resend/SUB
POST /hold-harmless/:id/resend/GC
Headers: Authorization: Bearer <token>
Roles: SUPER_ADMIN, ADMIN

// Get statistics
GET /hold-harmless/stats
Headers: Authorization: Bearer <token>
Roles: SUPER_ADMIN, ADMIN
Response: {
  total: 50,
  pendingSubSignature: 10,
  pendingGCSignature: 5,
  completed: 35,
  rejected: 0,
  pendingTotal: 15
}
```

### Public Endpoints (No Authentication)

```typescript
// Get hold harmless details for signing
GET /hold-harmless/by-token/:token
Response: {
  id: "...",
  projectAddress: "123 Main St, NY",
  gcName: "ABC Construction",
  additionalInsureds: ["ABC Construction", "Owner LLC", ...],
  status: "PENDING_SUB_SIGNATURE",
  signingParty: "SUBCONTRACTOR",
  canSign: true,
  templateUrl: "...",
  // ... other fields
}

// Subcontractor signs
POST /hold-harmless/sign/subcontractor/:token
Body: {
  "signatureUrl": "...",
  "signedBy": "email@example.com"
}

// GC signs
POST /hold-harmless/sign/gc/:token
Body: {
  "signatureUrl": "...",
  "signedBy": "email@example.com",
  "finalDocUrl": "..."
}
```

## Integration Points

### 1. COI Service Integration

When COI status changes to `ACTIVE`, call:

```typescript
// In GeneratedCOIService.updateStatus() or similar
if (newStatus === 'ACTIVE') {
  await this.holdHarmlessService.autoGenerateOnCOIApproval(coiId);
}
```

### 2. Program Creation

When creating a program that requires hold harmless:

```typescript
POST /programs
{
  "name": "NYC Commercial Program",
  "requiresHoldHarmless": true,
  "holdHarmlessTemplateUrl": "https://storage.../templates/hold-harmless-ny.pdf",
  // ... other fields
}
```

### 3. Email Service Integration

Currently logs to console. To enable emails, inject email service:

```typescript
// In HoldHarmlessService
constructor(
  private prisma: PrismaService,
  private emailService: EmailService, // Add this
) {}

// In sendSignatureLinkToSubcontractor()
await this.emailService.send({
  to: holdHarmless.subcontractorEmail,
  subject: 'Please Sign Hold Harmless Agreement',
  template: 'hold-harmless-signature-request',
  data: {
    signatureUrl,
    projectAddress: holdHarmless.projectAddress,
    gcName: holdHarmless.gcName,
    dueDate: // calculate deadline
  }
});

// Similar for GC and notifications
```

### 4. Frontend Signature Page

Create public page at `/sign-hold-harmless/[token]`:

```typescript
// pages/sign-hold-harmless/[token].tsx
export default function SignHoldHarmless({ token }) {
  const [holdHarmless, setHoldHarmless] = useState(null);
  const [signature, setSignature] = useState(null);
  
  useEffect(() => {
    fetch(`/api/hold-harmless/by-token/${token}`)
      .then(res => res.json())
      .then(setHoldHarmless);
  }, [token]);
  
  const handleSign = async () => {
    // Upload signature to storage
    const signatureUrl = await uploadSignature(signature);
    
    // Submit based on signing party
    const endpoint = holdHarmless.signingParty === 'SUBCONTRACTOR'
      ? `/api/hold-harmless/sign/subcontractor/${token}`
      : `/api/hold-harmless/sign/gc/${token}`;
    
    const body = {
      signatureUrl,
      signedBy: currentUserEmail,
      ...(holdHarmless.signingParty === 'GC' && {
        finalDocUrl: await generateFinalDocument()
      })
    };
    
    await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };
  
  return (
    <div>
      <h1>Sign Hold Harmless Agreement</h1>
      <p>Project: {holdHarmless.projectAddress}</p>
      <p>GC: {holdHarmless.gcName}</p>
      <SignatureCanvas onChange={setSignature} />
      <button onClick={handleSign} disabled={!holdHarmless.canSign}>
        Sign Document
      </button>
    </div>
  );
}
```

## Security Considerations

1. **Token Generation:** Uses cryptographically secure random bytes (64 chars)
2. **Token Uniqueness:** Each signature gets its own unique token
3. **One-time Use:** Tokens are only valid for specific workflow stage
4. **Status Validation:** Prevents signing out of order or duplicate signing
5. **Public Endpoints:** No authentication required for signing (intentional for external parties)

## Testing

### Manual Testing Flow

1. **Setup:**
   - Create program with `requiresHoldHarmless: true` and `holdHarmlessTemplateUrl`
   - Assign program to project
   - Create COI for project

2. **Approve COI:**
   - Update COI status to `ACTIVE`
   - Verify hold harmless auto-generated
   - Check console for signature link to sub

3. **Subcontractor Signs:**
   - Visit `/sign-hold-harmless/{subSignatureToken}`
   - Submit signature
   - Verify status changes to `PENDING_GC_SIGNATURE`
   - Check console for signature link to GC

4. **GC Signs:**
   - Visit `/sign-hold-harmless/{gcSignatureToken}`
   - Submit signature with final document
   - Verify status changes to `COMPLETED`
   - Verify COI updated with final document URL
   - Check console for notification to all parties

5. **Verify:**
   - Check `GET /hold-harmless/stats` shows correct counts
   - Verify `GET /hold-harmless/coi/:coiId` shows completed agreement

### API Testing (Swagger)

Available at `http://localhost:3001/api/docs`:
- Test `/hold-harmless/auto-generate/:coiId`
- Test `/hold-harmless/by-token/:token`
- Test signature endpoints
- Test resend functionality

## Migration from Old System

The old upload/review system has been completely replaced. Key differences:

| Old System | New System |
|------------|------------|
| Manual upload by broker/admin | Auto-generated from program template |
| Admin review/approve workflow | Automated signature workflow |
| Static document | Dynamic with auto-filled data |
| Single upload action | Multi-step signature process |
| Status: UPLOADED/APPROVED | Status: PENDING_SUB → PENDING_GC → COMPLETED |

**No data migration needed:** Old records were in development only.

## Environment Variables

```env
FRONTEND_URL=http://localhost:3000  # For signature links
```

## Future Enhancements

1. **Signature Deadline:** Add expiration to signature tokens
2. **Reminders:** Send reminder emails if not signed within X days
3. **Multiple Signatures:** Support additional signatories beyond sub and GC
4. **E-Signature Service:** Integrate with DocuSign or HelloSign
5. **Document Assembly:** Auto-populate template with data programmatically
6. **Audit Trail:** Detailed logging of each signature action
7. **Mobile Optimization:** Optimize signature page for mobile devices

## Support

For questions or issues:
1. Review this documentation
2. Check API docs at `/api/docs`
3. Test with Swagger UI
4. Review Prisma schema for data model details
