# New Features Guide: Reminders, Hold Harmless, Programs & Trades

This guide covers the four major features implemented in this PR.

## Table of Contents

1. [Automated Expiration Reminders](#1-automated-expiration-reminders)
2. [Hold Harmless Agreement Tracking](#2-hold-harmless-agreement-tracking)
3. [Insurance Program Workflow](#3-insurance-program-workflow)
4. [Construction Trades (200+)](#4-construction-trades)

---

## 1. Automated Expiration Reminders

### Overview
Automatically sends reminders for expiring insurance policies following the schedule:
- 30 days before expiration
- 14 days before expiration
- 7 days before expiration
- 2 days before expiration
- On expiration day
- Every 2 days after expiration

### How It Works

The `RemindersService` runs a daily cron job at 6 AM that:
1. Fetches all active COIs with expiration dates
2. Calculates days until expiry for each policy (GL, Umbrella, Auto, WC)
3. Sends appropriate reminders based on the schedule
4. Records each reminder in the database
5. Prevents duplicate reminders on the same day

### API Usage

```typescript
// Get reminder history for a COI
GET /api/v1/reminders/coi/:coiId

// Get all pending (unacknowledged) reminders
GET /api/v1/reminders/pending

// Get reminder statistics
GET /api/v1/reminders/stats

// Acknowledge a reminder
PATCH /api/v1/reminders/:reminderId/acknowledge
Body: { "acknowledgedBy": "admin@example.com" }
```

### Email Templates

Reminders include:
- **Subject**: Indicates urgency level and days until expiry
- **Body**: Project details, policy type, expiration date, required action

Example subjects:
- `[30 Days] General Liability Policy Expiring Soon`
- `[7 Days] URGENT: Workers Compensation Policy Expiring Soon`
- `[OVERDUE 4 Days] Umbrella Policy Expired - Immediate Action Required`

### Database Schema

```prisma
model ExpirationReminder {
  id              String       @id @default(uuid())
  coiId           String
  policyType      String       // GL, UMBRELLA, AUTO, WC
  expirationDate  DateTime
  daysBeforeExpiry Int         // 30, 14, 7, 2, 0, or negative
  reminderType    ReminderType
  sentAt          DateTime
  sentTo          String[]     // Email addresses
  acknowledged    Boolean
  // ...
}

enum ReminderType {
  DAYS_30      // 30 days before
  DAYS_14      // 14 days before
  DAYS_7       // 7 days before
  DAYS_2       // 2 days before
  EVERY_2_DAYS // Every 2 days after expiration
  EXPIRED      // On expiration day
}
```

### Integration with Email Service

To enable email sending, integrate with your email service:

```typescript
// In reminders.service.ts, update sendReminderNotification()
await this.emailService.send({
  to: recipients,
  subject,
  body,
  template: 'policy-expiration-reminder',
  data: { coiData, daysUntilExpiry, policyType }
});
```

---

## 2. Hold Harmless Agreement Tracking

### Overview
Track hold harmless/indemnification agreements for each COI with full compliance monitoring.

### Features
- Upload hold harmless documents
- Review and approve/reject agreements
- Track deficiencies
- Monitor expiration dates
- Integration with COI workflow

### API Usage

```typescript
// Upload hold harmless document
POST /api/v1/hold-harmless/coi/:coiId
Body: {
  "documentUrl": "https://...",
  "uploadedBy": "broker@example.com",
  "agreementType": "Indemnification",
  "parties": ["GC Inc", "Subcontractor LLC"],
  "effectiveDate": "2024-01-01",
  "expirationDate": "2025-01-01"
}

// Get hold harmless for a COI
GET /api/v1/hold-harmless/coi/:coiId

// List all hold harmless agreements with filtering
GET /api/v1/hold-harmless?status=UPLOADED&needsReview=true

// Review and approve/reject
PATCH /api/v1/hold-harmless/:id/review
Body: {
  "reviewedBy": "admin@example.com",
  "status": "APPROVED",
  "reviewNotes": "All requirements met",
  "meetsRequirements": true,
  "deficiencies": []
}

// Get expiring agreements
GET /api/v1/hold-harmless/expiring?days=30

// Get statistics
GET /api/v1/hold-harmless/stats
```

### Workflow

1. **Upload**: Broker/admin uploads hold harmless document
2. **Review**: Admin reviews the agreement
3. **Approve/Reject**: Admin approves or rejects with notes
4. **Track**: System monitors expiration and compliance

### Database Schema

```prisma
model HoldHarmless {
  id                String             @id
  coiId             String             @unique
  documentUrl       String
  uploadedBy        String
  status            HoldHarmlessStatus
  agreementType     String?
  parties           String[]
  effectiveDate     DateTime?
  expirationDate    DateTime?
  reviewedBy        String?
  reviewedAt        DateTime?
  reviewNotes       String?
  meetsRequirements Boolean
  deficiencies      String[]
  // ...
}

enum HoldHarmlessStatus {
  NOT_UPLOADED
  UPLOADED
  APPROVED
  REJECTED
  EXPIRED
}
```

### Frontend Integration

```typescript
// Example: Upload component
const handleUpload = async (coiId: string, file: File) => {
  const documentUrl = await uploadFile(file);
  
  await fetch(`/api/v1/hold-harmless/coi/${coiId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentUrl,
      uploadedBy: currentUser.email,
      agreementType: 'Combined',
      parties: [projectGC, subcontractor],
    })
  });
};
```

---

## 3. Insurance Program Workflow

### Overview
Create and manage insurance program templates that define requirements for projects.

### Features
- Template-based program management
- Multi-tier requirements (Tier 1, Tier 2, etc.)
- Trade-specific coverage requirements
- Project assignment with custom overrides
- Auto-approval rules

### API Usage

```typescript
// Create a program template
POST /api/v1/programs
Body: {
  "name": "NYC Construction Program",
  "description": "Standard requirements for NYC projects",
  "isTemplate": true,
  "glMinimum": 2000000,
  "wcMinimum": 1000000,
  "autoMinimum": 1000000,
  "umbrellaMinimum": 5000000,
  "requiresHoldHarmless": true,
  "requiresAdditionalInsured": true,
  "requiresWaiverSubrogation": true,
  "tierRequirements": {
    "tier1": { "glMinimum": 2000000, "umbrellaMinimum": 5000000 },
    "tier2": { "glMinimum": 1000000, "umbrellaMinimum": 2000000 }
  },
  "tradeRequirements": {
    "Roofing": { "glMinimum": 3000000 },
    "Electrical": { "glMinimum": 2000000 }
  }
}

// List all programs
GET /api/v1/programs?isTemplate=true

// Get program by ID
GET /api/v1/programs/:id

// Update program
PATCH /api/v1/programs/:id
Body: { "glMinimum": 2500000 }

// Assign program to project
POST /api/v1/programs/:id/assign-project
Body: {
  "projectId": "project-uuid",
  "assignedBy": "admin@example.com",
  "customRequirements": {
    "glMinimum": 3000000  // Override template value
  }
}

// Get programs for a project
GET /api/v1/programs/project/:projectId

// Get statistics
GET /api/v1/programs/stats
```

### Use Cases

**1. Standard Template:**
```typescript
// Create a standard program that applies to most projects
const standardProgram = {
  name: "Standard Commercial",
  glMinimum: 1000000,
  wcMinimum: 1000000,
  autoMinimum: 1000000,
  umbrellaMinimum: 2000000
};
```

**2. Multi-Tier Program:**
```typescript
// Different requirements based on project size
const multiTierProgram = {
  name: "Tiered Program",
  tierRequirements: {
    tier1: { // Projects > $10M
      glMinimum: 5000000,
      umbrellaMinimum: 10000000
    },
    tier2: { // Projects $5M-$10M
      glMinimum: 2000000,
      umbrellaMinimum: 5000000
    },
    tier3: { // Projects < $5M
      glMinimum: 1000000,
      umbrellaMinimum: 2000000
    }
  }
};
```

**3. Trade-Specific:**
```typescript
// Different requirements per trade
const tradeSpecificProgram = {
  name: "Trade-Based Program",
  tradeRequirements: {
    "Roofing": { glMinimum: 3000000, umbrellaMinimum: 5000000 },
    "HVAC": { glMinimum: 2000000, umbrellaMinimum: 3000000 },
    "Painting": { glMinimum: 1000000, umbrellaMinimum: 2000000 }
  }
};
```

### Database Schema

```prisma
model InsuranceProgram {
  id                String   @id
  name              String
  description       String?
  isTemplate        Boolean
  glMinimum         Float?
  wcMinimum         Float?
  autoMinimum       Float?
  umbrellaMinimum   Float?
  requiresHoldHarmless     Boolean
  requiresAdditionalInsured Boolean
  requiresWaiverSubrogation Boolean
  tierRequirements  Json?   // Flexible tier structure
  tradeRequirements Json?   // Trade-specific rules
  autoApprovalRules Json?   // Auto-approval conditions
  projects          ProjectProgram[]
  // ...
}

model ProjectProgram {
  id                String   @id
  projectId         String
  programId         String
  customRequirements Json?   // Override program values
  // ...
}
```

---

## 4. Construction Trades

### Overview
Comprehensive list of 200+ construction trades organized by category.

### Categories (6 major)
1. **General Construction** - GCs, CMs, PMs
2. **Site Work & Earthwork** - Excavation, demolition, grading
3. **Concrete & Masonry** - Concrete, masonry, tile
4. **Structural** - Steel, rebar, metal work
5. **MEP** - Plumbing, HVAC, electrical
6. **Finishes** - Drywall, painting, flooring

### API Usage

```typescript
// Get all trades (200+)
GET /api/v1/trades
Response: {
  "trades": ["General Contractor", "Electrical", ...],
  "count": 200+
}

// Get categorized trades
GET /api/v1/trades/categorized
Response: {
  "General Construction": ["General Contractor", ...],
  "Site Work & Earthwork": ["Excavation & Grading", ...],
  ...
}

// Search trades
GET /api/v1/trades/search?q=electric
Response: {
  "query": "electric",
  "results": ["Electrical", "Electrical Power Distribution", ...],
  "count": 5
}

// Get insurance requirements for a trade
GET /api/v1/trades/insurance-requirements?trade=Roofing
Response: {
  "trade": "Roofing",
  "requirements": {
    "glMinimum": 2000000,
    "wcMinimum": 1000000,
    "autoMinimum": 1000000,
    "umbrellaMinimum": 2000000
  }
}

// Validate trade
GET /api/v1/trades/validate?trade=Electrical
Response: {
  "trade": "Electrical",
  "isValid": true,
  "category": "MEP (Mechanical, Electrical, Plumbing)"
}

// Get statistics
GET /api/v1/trades/stats
Response: {
  "totalTrades": 200+,
  "totalCategories": 6,
  "categoryCounts": [...]
}
```

### Using in Code

```typescript
// Import from shared package
import {
  CONSTRUCTION_TRADES,
  CONSTRUCTION_TRADES_ARRAY,
  CONSTRUCTION_TRADE_CATEGORIES,
  getTradeInsuranceRequirements,
  searchTrades,
} from '@compliant/shared';

// Get all trades as array
const allTrades = CONSTRUCTION_TRADES_ARRAY; // 200+ strings

// Get specific trade constant
const electrical = CONSTRUCTION_TRADES.ELECTRICAL; // "Electrical"

// Search trades
const results = searchTrades('roof'); // ["Roofing", "Roofing Membrane", ...]

// Get insurance requirements
const requirements = getTradeInsuranceRequirements('Roofing');
// { glMinimum: 2000000, wcMinimum: 1000000, ... }
```

### Contractor Trade Assignment

Contractors can now be assigned multiple trades:

```typescript
// Update contractor with trades
PATCH /api/v1/contractors/:id
Body: {
  "trades": [
    "General Contractor",
    "Electrical",
    "HVAC"
  ]
}

// Database schema
model Contractor {
  // ...
  trades String[] @default([])
  // ...
}
```

### Frontend Integration

```typescript
// Example: Trade selection component
import { CONSTRUCTION_TRADE_CATEGORIES } from '@compliant/shared';

function TradeSelector() {
  return (
    <select multiple>
      {Object.entries(CONSTRUCTION_TRADE_CATEGORIES).map(([category, trades]) => (
        <optgroup key={category} label={category}>
          {trades.map(trade => (
            <option key={trade} value={trade}>{trade}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
```

---

## Environment Variables

Add to `.env`:

```env
# Reminder Schedule (optional, defaults shown)
REMINDER_CHECK_TIME="0 6 * * *"  # 6 AM daily (cron expression)
ADMIN_EMAIL="admin@compliant.com"

# Email Service (required for reminders)
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="your-key"
EMAIL_FROM="noreply@compliant.com"
```

---

## Testing

### Unit Tests

```bash
# Test reminders service
npm test reminders.service.spec.ts

# Test hold harmless service
npm test hold-harmless.service.spec.ts

# Test programs service
npm test programs.service.spec.ts

# Test trades service
npm test trades.service.spec.ts
```

### API Testing (Swagger)

Visit `http://localhost:3001/api/docs` and test:
- `/api/v1/reminders` endpoints
- `/api/v1/hold-harmless` endpoints
- `/api/v1/programs` endpoints
- `/api/v1/trades` endpoints

### Manual Testing

1. **Reminders**: Wait for cron job or manually trigger via service
2. **Hold Harmless**: Upload, review, approve workflow
3. **Programs**: Create template, assign to project
4. **Trades**: Search, validate, get requirements

---

## Troubleshooting

### Reminders Not Sending

1. Check cron job is running: `ScheduleModule.forRoot()` in app.module.ts
2. Verify COI has expiration dates set
3. Check reminder hasn't already been sent today
4. Review logs for errors

### Hold Harmless Upload Fails

1. Verify documentUrl is accessible
2. Check user has permission (ADMIN/BROKER role)
3. Ensure COI exists
4. Review validation errors

### Program Assignment Issues

1. Verify program and project exist
2. Check user has ADMIN/SUPER_ADMIN role
3. Review customRequirements JSON format
4. Check for existing assignment

### Trades Not Loading

1. Verify shared package is built: `pnpm build` in packages/shared
2. Check import path: `@compliant/shared`
3. Regenerate Prisma client if needed
4. Clear node_modules and reinstall

---

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for technical details
2. Review API documentation at `/api/docs`
3. Check database schema in `prisma/schema.prisma`
4. Contact: [team contact]
