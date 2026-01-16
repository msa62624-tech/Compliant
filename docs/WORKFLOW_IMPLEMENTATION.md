# Workflow Implementation from Original App

## Complete Workflow (from commit 114ffb1)

### Admin & Assistant Admin System

**YES - The original app has a hierarchical admin system with role-based access control**

#### Admin Roles:

1. **Super Admin** (`super_admin`)
   - Full access to entire platform
   - Can see ALL COIs, projects, subcontractors, GCs
   - Can assign COIs/projects to assistant admins
   - Views all system messages
   - No filtering by assignment

2. **Assistant Admin** (`admin`)
   - Limited access based on assignments
   - Only sees COIs assigned to them (via `assigned_admin_email`)
   - Only sees projects assigned to them
   - Only sees subcontractors assigned to them
   - Only sees their own messages (not other assistant admins' messages)
   - Cannot see unassigned items

#### Assignment System:

**Fields tracked:**
- COIs: `assignedAdminEmail` field
- Projects: `assigned_admin_email` field  
- Subcontractors: `assigned_admin_email` field
- Messages filtered by sender/recipient

**Filtering Logic:**
```javascript
// For Assistant Admins (role === 'admin')
if (currentUser?.role === 'admin' && currentUser?.email) {
  // Show only items assigned to this admin OR unassigned items
  filtered = items.filter(item => 
    !item.assigned_admin_email || 
    item.assigned_admin_email === currentUser.email
  );
}

// For Super Admins (role === 'super_admin')
// No filtering - see everything
```

**Use Cases:**
- Large organizations with multiple admin staff
- Workload distribution across admin team
- Territory/project-based admin assignments
- Privacy between different admin workstreams

#### Message System Isolation:

**Super Admin:**
- Only sees their own messages
- Does NOT see messages between assistant admins and brokers/subs
- Prevents cross-contamination of admin communications

**Assistant Admin:**
- Only sees messages where they are sender or recipient
- Cannot see other assistant admins' conversations
- Maintains privacy per admin assignment

### Project Information Requirements

**YES - Projects have comprehensive data requirements**

#### Required Project Fields:

Based on the original app schema and forms:

1. **Basic Information:**
   - `project_name` - Project title/name (required)
   - `project_address` - Physical location (required)
   - `gc_name` - General Contractor name (required)
   - `gc_id` - GC identifier (required)
   - `assigned_admin_email` - Admin responsible for this project

2. **Dates:**
   - `created_date` - When project was created
   - `start_date` - Project start date
   - `end_date` - Expected completion date

3. **Status:**
   - `status` - Project status (active, planning, completed, on_hold, cancelled)

4. **Insurance Requirements:**
   - Minimum coverage amounts per policy type
   - Required policy types (GL, WC, Auto, Umbrella)
   - Additional insured requirements
   - Waiver of subrogation requirements
   - Project-specific endorsements

5. **Assignments:**
   - Linked subcontractors (via ProjectSubcontractor junction table)
   - Each subcontractor must have valid COI for project

### AI Auto-Extraction & What Gets Saved

**YES - Comprehensive auto-extraction on document upload**

#### What Auto-Extracts:

When broker uploads COI/policy document → Adobe PDF extracts text → AI parses → Data auto-saves

**1. Policy Numbers:**
- Format: POL-XXXX-YYYY or similar
- Extracted via regex patterns
- Saved to: `policy_number`, `gl_policy_number`, `wc_policy_number`, etc.

**2. Dates:**
- **Effective Dates** - When coverage starts
- **Expiration Dates** - When coverage ends
- Format: MM/DD/YYYY, YYYY-MM-DD
- Extracted via regex and AI parsing
- Saved to: `effective_date`, `expiration_date`, `gl_effective_date`, `gl_expiration_date`, etc.
- **Auto-calculated:**
  - Days until expiry
  - Expiration risk level (EXPIRED, CRITICAL <30 days, HIGH <90 days, LOW)
  - Renewal reminders triggered automatically

**3. Coverage Amounts:**
- Format: $X,XXX,XXX
- Each occurrence limits
- Aggregate limits
- Per-claim limits
- Saved to: `gl_each_occurrence`, `gl_aggregate`, `coverage_amount`, etc.

**4. Insurance Carriers:**
- Insurer/carrier names
- Saved to: `insurer_name`, `insurance_provider`

**5. Policy Holders:**
- Insured party name
- Additional insureds
- Saved to: `subcontractor_name`, `additional_insureds[]`

**6. Endorsements & Waivers:**
- Additional insured endorsements
- Waiver of subrogation clauses
- Saved to: `waiver_of_subrogation`, `endorsements[]`

**7. Deductibles:**
- Standard deductibles
- Medical-only deductibles
- Saved to: `deductibles` object

**8. Contact Information:**
- Email addresses
- Phone numbers (if present)
- Saved to: `contact_emails[]`

#### Auto-Save Workflow:

```
1. Broker uploads PDF
   ↓
2. Adobe PDF Service extracts text
   ↓
3. AI analyzes extracted text with prompts:
   - "Extract policy_number, effective_date, expiration_date..."
   - Returns structured JSON
   ↓
4. System automatically saves to GeneratedCOI record:
   - gl_policy_number
   - gl_effective_date
   - gl_expiration_date
   - gl_each_occurrence
   - gl_aggregate
   - insurer_name
   - additional_insureds
   - waiver_of_subrogation
   ↓
5. Auto-triggers:
   - Compliance analysis (AI checks against requirements)
   - Risk assessment calculation
   - Deficiency detection
   - Admin notification email
   ↓
6. All extracted data visible in admin review interface
```

**No Manual Entry Required:**
- Broker just uploads PDF
- All fields auto-populate
- Admin reviews auto-extracted data
- Can manually correct if AI misread something

### Hold Harmless & Indemnification System

**NOTE: Not explicitly found as separate feature in the original app code**

However, the system tracks:
- **Additional Insureds** - Projects/GCs listed as additional insured on policies
- **Waiver of Subrogation** - Whether carrier waives right to sue additional insureds
- **Endorsements** - Special policy endorsements including hold harmless language

These are part of the AI compliance checking:
```javascript
// AI checks for:
deficiencies.push({
  severity: 'high',
  category: 'endorsements',
  title: 'Missing Additional Insured Endorsement',
  description: 'Project owner not listed as additional insured',
  required_action: 'Request CG 20 10 endorsement'
});
```

## Additional Features from Original App

### ✅ Features Already Documented:
1. Role-based dashboards (Admin, Broker, Subcontractor, Contractor/GC)
2. Adobe PDF Services & eSign integration
3. AI-powered COI compliance analysis and auto-extraction
4. Automated email notifications (8 types)
5. Admin/Assistant Admin hierarchy with assignment system
6. Project requirements and tracking
7. Date tracking and expiration risk calculation
8. Hold harmless & indemnification tracking

### 🔍 Additional Features Found (Not Yet Documented):

#### 1. **Expiring Policies Dashboard**
- Dedicated page to monitor policies expiring within 30 days
- Severity-based color coding (5 days = red, 15 days = amber, 30 days = yellow)
- Sorted by days until expiration
- Quick actions: Contact broker, view subcontractor
- Automatic email reminders triggered at 30 days

#### 2. **NYC DOB (Department of Buildings) Integration**
- Automated property data lookup via NYC DOB NOW API
- Extracts: Block, Lot, BIN, Address, Borough, ZIP
- Retrieves permit information: Job type, GC, unit count, stories
- ACRIS integration for owner/entity lookup via BBL
- ZOLA integration for adjacent property identification
- Auto-populates additional insured entities
- AI-powered data extraction with internet context
- Validation: 5-digit block, 4-digit lot formatting

#### 3. **NYC Permit Lookup**
- Similar integration for permit-specific data
- Links permits to projects
- Tracks permit status and compliance

#### 4. **Deficiency Messenger / Communication System**
- **Direct Messaging:**
  - Admin → Broker deficiency notifications
  - Broker → Admin clarification requests
  - Message threading/history
- **Attachment Support:**
  - Upload files with messages (10MB limit)
  - Multiple attachment support
  - File type validation
- **Deficiency Integration:**
  - Auto-include deficiency list in message
  - Deficiency severity display
  - Required actions highlighted
- **Email Integration:**
  - Messages trigger email notifications
  - Include deficiency details in email
  - Link back to platform

#### 7. **Notification System**
- **Notification Panel:**
  - Real-time notifications (30-second polling)
  - Notification types: COI upload, approval, deficiency, expiration
  - Read/unread status
  - Notification badges with counts
- **Notification Actions:**
  - Mark as read
  - Quick response
  - Navigate to related item (COI, project, etc.)
- **Notification Categories:**
  - Critical (expiring policies, deficiencies)
  - Info (new uploads, assignments)
  - Success (approvals, completions)

#### 8. **Address Autocomplete Integration**
- Google Places API integration
- Autocomplete for project addresses
- Auto-fill city, state, ZIP from selection
- Validation for NYC addresses

#### 9. **Document Management System**
- **AllDocuments Page:**
  - Centralized document repository
  - Filter by type, status, date
  - Search functionality
  - Bulk download options
- **Document Types:**
  - COIs, Policies, Permits, Reports
- **Version Control:**
  - Track document revisions
  - Replace documents while maintaining history

#### 10. **Archive System**
- **ArchivePage:**
  - Archived projects
  - Archived contractors
  - Archived COIs
- **Archive Actions:**
  - Soft delete with restore option
  - Permanent deletion (admin only)
  - Archive reasons tracking

#### 11. **Compliance Review Tools**
- **ComplianceReview Component:**
  - Side-by-side COI and requirements comparison
  - Checklist validation
  - Coverage gap identification
  - Endorsement verification
- **Review History:**
  - Track all review actions
  - Reviewer name and timestamp
  - Review notes/comments

#### 12. **GC Project Portal**
- **GCProjects Component:**
  - GC-specific project list
  - Project details view (GCProjectView)
  - Subcontractor assignments per project
  - Compliance status per project
- **GC Login:**
  - Separate login for GCs
  - Limited access (own projects only)
  - No admin functions

#### 13. **Broker Portal & Login**
- **BrokerLogin:**
  - Email-based authentication
  - Magic link login option
  - Session-based (no JWT)
- **BrokerPortal:**
  - Landing page for brokers
  - Quick stats dashboard
  - Pending requests
- **BrokerRequestsTracking:**
  - Track all requests sent to broker
  - Request status tracking
  - Reminder system

#### 14. **Broker Verification System**
- **BrokerVerification Component:**
  - Subcontractor verifies broker info before renewal
  - Confirms broker still managing policies
  - Updates broker contact info if changed
  - Required for policy renewals (30-day window)

#### 15. **Insurance Programs**
- **InsurancePrograms Component:**
  - **AI-Powered PDF Import** - Upload insurance program PDFs and AI automatically extracts:
    - Program name and description
    - Multi-tier requirements (Tier 1, Tier 2, etc.)
    - Trade-specific coverage requirements
    - GL, WC, Auto, Umbrella policy limits per trade/tier
    - Scope and endorsement requirements
  - **Manual Creation** - Create program templates from scratch
  - **Template Management** - Store and reuse program requirements across projects
  - **Project Customization** - Apply program templates to specific projects
  - **Preview Before Save** - Review AI-extracted data before confirming import
  - **Update/Overwrite** - Replace existing programs with new PDF versions

#### 16. **Admin Management**
- **AdminManagement Component:**
  - Create/edit admin users
  - Assign admin roles (super vs assistant)
  - Manage admin permissions
  - View admin activity logs

#### 17. **Contractor Management**
- **Contractors Component:**
  - List all contractors (GCs + Subs)
  - Filter by type, status
  - Bulk actions
  - Import/export functionality

#### 19. **Pending Reviews Dashboard**
- **PendingReviews Component:**
  - Dedicated page for items awaiting review
  - Priority sorting
  - Assignment to admins
  - Bulk approval options

#### 19. **GC Details Page**
- **GCDetails Component:**
  - Detailed GC profile
  - Project history
  - Subcontractor network

### Environment Variables Summary:

```bash
# Adobe PDF Services
ADOBE_API_KEY=
ADOBE_CLIENT_ID=

# AI Analysis
AI_PROVIDER=openai  # or anthropic
AI_API_KEY=
AI_MODEL=gpt-4-turbo-preview

# Email/SMTP
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
ADMIN_EMAILS=admin1@domain.com,admin2@domain.com

# NYC API Integrations
NYC_DOB_API_KEY=  # For DOB NOW
GOOGLE_PLACES_API_KEY=  # For address autocomplete

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=

# Frontend
VITE_API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5175
```

### Complete Feature List Summary:

✅ **Core Workflow** (7 items documented)
✅ **Additional Features** (17 items found):
1. Expiring Policies Dashboard
2. NYC DOB Integration
3. NYC Permit Lookup
4. Deficiency Messenger
5. Notification System
6. Address Autocomplete
7. Document Management
8. Archive System
9. Compliance Review Tools
10. GC Project Portal
11. Broker Portal & Login
12. Broker Verification
13. Insurance Programs
14. Admin Management
15. Contractor Management
16. Pending Reviews
17. GC Details

**Total: 24 major feature sets** to implement in new architecture.

### AI Integration & Automated Analysis

**YES - The original app has comprehensive AI-powered analysis** (`backend/integrations/ai-analysis-service.js`)

#### AI Features:

1. **COI Compliance Analysis**
   - Automatically analyzes uploaded COI against project requirements
   - Identifies deficiencies and compliance gaps
   - Returns structured JSON with severity levels (critical, high, medium, low)
   - Categories: coverage limits, policy types, endorsements, dates

2. **Policy Data Extraction**
   - Extracts structured data from policy documents
   - Parses: policy numbers, dates, insurer names, coverage limits
   - Extracts deductibles, additional insureds, endorsements
   - Works with GL, WC, Auto, Umbrella policies

3. **Insurance Program PDF Parsing**
   - **AI-powered extraction of insurance programs from PDF documents**
   - Extracts program name, description
   - Identifies multi-tier requirements (Tier 1, Tier 2, etc.)
   - Parses trade-specific coverage requirements
   - Extracts GL, WC, Auto, Umbrella limits per trade/tier
   - Identifies scope and endorsement requirements
   - Returns structured JSON for preview and import
   - Endpoint: `apiClient.integrations.Core.ParseProgramPDF()`

4. **Risk Assessment**
   - Rates COI risk level: LOW, MEDIUM, HIGH, CRITICAL
   - Risk score 1-10 with detailed factors
   - Evaluates expiration risk, coverage adequacy
   - Checks subrogation waivers and endorsements

5. **Review Recommendations**
   - Generates 3-5 actionable recommendations for admin reviewers
   - Based on identified deficiencies
   - Expert insurance compliance guidance
   - Suggests specific corrective actions

6. **Automated Deficiency Detection & Policy-to-Requirements Comparison**
   - **Coverage Amount Validation:** Compares actual coverage to project minimums (GL < $2M flagged)
   - **Missing Policy Detection:** Checks WC, Auto, Umbrella against required policy types
   - **Expiration Date Warnings:** Critical if <30 days, High if <90 days
   - **Additional Insured Verification:** Validates project owner/GC listed as additional insured
   - **Waiver of Subrogation Checks:** Verifies waiver clauses present
   - **Named Insured Matching:** Compares policy holder name to subcontractor's registered name
   - **Policy Date Alignment:** Validates policy dates cover project timeline
   - **Endorsement Requirements:** Checks for CG 20 10, additional insured, waiver endorsements
   
7. **Always-Flagged Exclusions (Automatic Compliance Checks)**
   - **Named Insured Mismatch:** Policy holder name differs from subcontractor name in system
   - **Coverage Gaps:** Policy limits below project minimums (e.g., GL $1M when $2M required)
   - **Missing Endorsements:** CG 20 10, additional insured, or waiver of subrogation absent
   - **Date Misalignment:** Policy doesn't cover full project timeline
   - **Additional Insured Missing:** Project owner or GC not listed as additional insured on policy
   - **Expired/Expiring Policies:** Already expired or expiring within 30 days
   - **Wrong Policy Types:** Missing required policy types (GL, WC, Auto, Umbrella)
   - **Insufficient Aggregates:** Aggregate limits below project requirements

#### AI Provider Support:
- **OpenAI** (GPT-4, GPT-4-turbo) - default
- **Anthropic Claude** (Claude Opus, Sonnet)
- Configurable model selection

#### Environment Variables:
- `AI_PROVIDER` - 'openai' or 'anthropic' (default: openai)
- `AI_API_KEY` or `OPENAI_API_KEY` - API key for AI service
- `AI_MODEL` - Model name (default: gpt-4-turbo-preview)

#### Integration Points:

**Backend Endpoints:**
- `/integrations/analyze-policy` - Authenticated AI analysis endpoint
- `/public/program-review` - Public AI review of insurance programs
- Used automatically when COI is uploaded for admin review

**Admin Dashboard:**
- AI analysis results shown in COI review interface
- Deficiencies highlighted with severity indicators
- Recommendations displayed for reviewer guidance
- Risk level badge (color-coded: red=critical, orange=high, yellow=medium, green=low)

#### AI Workflow:
1. Broker uploads COI document
2. Adobe PDF extracts text automatically
3. AI analyzes extracted data against requirements
4. Deficiencies identified and categorized
5. Recommendations generated
6. Risk level assessed
7. Results presented to admin reviewer
8. Admin can approve or reject based on AI findings

#### Response Format:
```json
{
  "analysis": {
    "compliant": false,
    "deficiency_count": 3,
    "critical_count": 1,
    "timestamp": "2024-01-16T..."
  },
  "deficiencies": [
    {
      "severity": "critical",
      "category": "coverage_limits",
      "title": "Insufficient GL Aggregate",
      "description": "GL Aggregate is $1M, project requires $2M minimum",
      "required_action": "Request updated policy with $2M aggregate"
    }
  ],
  "recommendations": [
    "Request proof of increased aggregate limit",
    "Verify umbrella policy can supplement GL coverage",
    "Consider requiring project-specific endorsement"
  ],
  "risk": {
    "level": "HIGH",
    "score": 7,
    "factors": [
      "Coverage below minimum",
      "Expiring in 25 days",
      "No waiver of subrogation"
    ]
  }
}
```

### Adobe PDF Services & eSign Integration

**YES - The original app has Adobe PDF Services integration** (`backend/integrations/adobe-pdf-service.js`)

#### Features:
1. **PDF Text Extraction**: Extract text from uploaded COI PDFs
2. **COI Field Extraction**: Parse policy numbers, coverage limits, dates, carriers from COIs
3. **Digital Signatures**: Apply electronic seals/signatures using Adobe Electronic Seal API
4. **PDF Merging**: Combine multiple PDF documents

#### Environment Variables Required:
- `ADOBE_API_KEY` - Adobe API key
- `ADOBE_CLIENT_ID` - Adobe client ID

#### Broker Signature Workflow:
- Brokers can **draw** signatures on canvas OR **type** text signatures
- Signature stored as image URL (e.g., `broker_signature_url`)
- Supports:
  - **Single signature** for all policies broker manages
  - **Per-policy signatures** (GL, Umbrella, Auto, WC each get separate signatures)
- Signature triggers status change: `AWAITING_BROKER_SIGNATURE` → `AWAITING_ADMIN_REVIEW`

### Automated Email Notifications & Links

**YES - Complete email notification system with automated links**

#### Email Configuration:
- Uses **Nodemailer** with SMTP
- Environment variables:
  - `SMTP_HOST` (default: smtp.office365.com)
  - `SMTP_PORT` (default: 587)
  - `SMTP_USER` - Email address
  - `SMTP_PASS` - Email password
  - `ADMIN_EMAILS` - Comma-separated admin emails

#### Automated Emails Sent:

1. **Broker Assignment Email** (to Broker)
   - Triggered when: Subcontractor assigns/changes broker
   - Contains:
     - Auto-generated login credentials (username + secure password)
     - Link to Broker Dashboard: `/broker-dashboard?email={email}&name={name}`
     - Subcontractor details (company, contact, trade types)
     - First-time vs. returning subcontractor instructions
     - For per-policy: List of assigned policies (GL, WC, Auto, Umbrella)
   
2. **Broker Reassignment Email** (to Old Broker)
   - Triggered when: Broker is changed
   - Notifies them they've been removed
   - Shows new broker information

3. **Broker Assignment Confirmation** (to Subcontractor)
   - Triggered when: Broker is assigned
   - Contains:
     - Auto-generated login credentials
     - Broker contact information
     - Link to Subcontractor Dashboard: `/subcontractor-dashboard?id={subId}`
     - Instructions to contact broker for questions

4. **COI Upload Notification** (to All Admins)
   - Triggered when: Broker uploads COI for review
   - Contains:
     - Subcontractor and project details
     - COI ID and upload date
     - Link to COI Review: `/COIReview?id={coiId}`
     - Link to Admin Dashboard: `/admin-dashboard?section=PendingReviews&coiId={coiId}`
   - Sent to all admin emails from `ADMIN_EMAILS` env var

5. **COI Approval Email** (to Subcontractor)
   - Triggered when: Admin approves COI
   - Contains:
     - Project details
     - Approval confirmation
     - Coverage summary
     - Link to Subcontractor Dashboard with project details

6. **COI Deficiency Email** (to Broker)
   - Triggered when: Admin rejects COI with deficiency notes
   - Contains:
     - Deficiency notes from admin
     - Link to replace/re-upload documents
     - Instructions to correct and resubmit

7. **Expiration Warning Emails** (to Broker & Subcontractor)
   - Triggered when: Policy expires within 30 days
   - Reminders to renew policies

8. **Password Reset Email**
   - Triggered when: User requests password reset
   - Contains:
     - Secure reset token link (expires in 1 hour)
     - Reset link: `/reset-password?token={token}`

#### Link Generation System (`src/urlConfig.js`):

All links are environment-aware (works in Codespaces, local, production):

```javascript
// Broker Dashboard Link
/broker-dashboard?email={brokerEmail}&name={brokerName}

// Broker Upload Link
/broker-upload?type={global|per-policy}&subId={subId}

// Subcontractor Dashboard Link
/subcontractor-dashboard?id={subId}

// Admin Dashboard with Filters
/admin-dashboard?section=PendingReviews&coiId={coiId}

// COI Review Page
/COIReview?id={coiId}
```

#### Auto-Generated User Accounts:

When broker/subcontractor is assigned, system automatically:
1. Generates secure random password
2. Creates user account with role
3. Emails credentials in welcome message
4. User can login immediately with provided credentials

#### Message System Integration:

- In-app messages created alongside emails
- Messages linked to entities (COI, Subcontractor, Project)
- Viewable in dashboard message centers
- Admin and Broker can communicate via threaded messages

### 1. Admin Dashboard
- **Role**: Super admin manages the entire platform
- **Actions**:
  - Create and manage General Contractors (GCs)
  - Create and manage Projects
  - Review and approve COI documents submitted by brokers
  - Handle deficiencies and rejections
  - View compliance statistics
- **Key Features**:
  - Pending COI reviews with admin assignment
  - Filter by assigned admin (assistant admins see only theirs)
  - Message system for communication
  - Project management

### 2. General Contractor (GC) Dashboard  
- **Role**: GC companies that hire subcontractors
- **Actions**:
  - Upload own insurance documents
  - View document approval status
  - Track expiring policies
- **Key Features**:
  - Insurance coverage status by type (GL, WC, Auto, Umbrella, etc.)
  - Document upload and replacement
  - Expiration tracking

### 3. Subcontractor Dashboard
- **Role**: Subcontractors working on GC projects
- **Actions**:
  - View assigned projects
  - Provide broker information (global or per-policy)
  - Verify broker info for renewals
  - View COI status per project
- **Key Features**:
  - Broker assignment (one broker for all OR different brokers per policy type)
  - Project-specific insurance status
  - Broker verification alerts for renewals
  - Insurance status: "needs broker upload", "under review", "approved", "needs correction"

### 4. Broker Dashboard
- **Role**: Insurance brokers uploading COI for their subcontractor clients
- **Actions**:
  - View all COI requests assigned to them (by email match)
  - Upload policy documents (GL, Umbrella, Auto, WC)
  - Sign certificates
  - Replace documents when deficiencies found
  - Message admins
- **Key Features**:
  - Session-based authentication (not JWT)
  - Filter by broker email and name
  - Status tracking: pending, awaiting upload, under review, active, deficiency
  - Per-policy broker support (different brokers for different policy types)
  - Message center for admin communication

## Data Model (from sampleData.js)

### Users
- id, username, email, name, role
- Roles: 'super_admin', 'admin', 'user', 'broker', 'subcontractor'

### Contractors
- contractor_type: 'general_contractor' or 'subcontractor'
- Broker fields:
  - broker_name, broker_email, broker_phone, broker_company
  - broker_type: 'global' or 'per-policy'
  - Per-policy: broker_gl_*, broker_auto_*, broker_umbrella_*, broker_wc_*

### Projects
- Links GCs to jobs
- project_name, gc_name, location, status

### ProjectSubcontractor
- Junction table linking subcontractors to projects

### GeneratedCOI
- status: 'awaiting_broker_info', 'awaiting_broker_upload', 'awaiting_broker_signature', 'awaiting_admin_review', 'active', 'deficiency_pending'
- Policy upload fields: gl_policy_url, umbrella_policy_url, auto_policy_url, wc_policy_url
- Signature fields: gl_broker_signature_url, umbrella_broker_signature_url, etc.
- Broker assignment per policy type
- Admin assignment: assigned_admin_email

## Key Workflow Steps

### Step 1: Admin creates GC and Project
- Admin adds a General Contractor to system
- Admin creates a Project and assigns it to a GC

### Step 2: GC adds Subcontractor to Project
- GC identifies subcontractors needed for project
- Subcontractor record created with link to project

### Step 3: Subcontractor provides Broker Info
- Sub receives link to BrokerUpload page
- Chooses: One broker for all OR different brokers per policy
- Provides broker contact info (name, email, phone, company)

### Step 4: Broker uploads COI documents
- Broker receives email with link to BrokerUploadCOI page
- Authenticates via session (sessionStorage)
- Sees only their assigned policies
- Uploads PDF documents for each policy type
- GL and Umbrella are required; Auto and WC are optional

### Step 5: Broker signs certificates
- After uploading, broker adds digital signatures
- Signature required for GL and Umbrella
- Optional for Auto and WC
- Can be single signature for all or per-policy

### Step 6: Admin reviews and approves
- Admin sees COI in "awaiting_admin_review" status
- Reviews uploaded documents and signatures
- Can approve → status becomes 'active'
- Can reject with deficiency notes → status becomes 'deficiency_pending'

### Step 7: Deficiency handling (if rejected)
- Broker receives notification of deficiency
- Broker can replace documents via ReplaceDocumentDialog
- Status returns to 'awaiting_admin_review'
- Cycle repeats until approved

## UI Style

### Admin Dashboard
- Clean professional interface
- Card-based layout
- Stats grid (4 cards showing key metrics)
- Pending reviews table with filters
- Message center integration
- Dark/light color scheme with blue/emerald/red accents

### Broker Dashboard
- Dark gradient background (slate-900 to slate-800)
- Large broker avatar with initials
- Teal/emerald accent colors
- Stats cards with icons
- Message thread integration
- Certificate requests list with status badges
- Upload/signature workflow in steps

### Subcontractor Dashboard
- Light gradient background (slate-50 to slate-100)
- Urgent alerts (red for broker verification, amber for broker setup)
- Projects table with insurance status per project
- Clean card-based layout
- CTA buttons for broker assignment

### GC/Contractor Dashboard
- Simple document management interface
- Insurance type cards (6 types)
- Status badges for each type
- Upload/replace buttons
- Expiration warnings

## Authentication

### Admin/GC/User
- JWT-based authentication via apiClient
- Tokens managed by compliantClient

### Broker
- Session-based (sessionStorage)
- Fields: 'brokerPortalEmail', 'brokerPortalName', 'brokerAuthenticated'
- Public endpoints for broker access (/public/broker-requests, etc.)

### Subcontractor  
- URL-based access with ID or email parameter
- No persistent authentication
- Public endpoints for subcontractor access

## Next Steps for Implementation

1. Create backend NestJS modules:
   - GeneratedCOI entity and controller
   - ProjectSubcontractor entity
   - Public broker endpoints
   - COI review/approval endpoints
   - Deficiency management

2. Update Prisma schema:
   - Add GeneratedCOI model with all policy/broker fields
   - Add ProjectSubcontractor junction table
   - Add status enums

3. Convert React dashboards to Next.js:
   - Maintain exact workflow and styling
   - Use Next.js App Router conventions
   - Replace React Query with Next.js data fetching
   - Adapt authentication for each user type

4. Implement broker upload workflow:
   - BrokerUpload component (sub provides broker info)
   - BrokerUploadCOI component (broker uploads documents)
   - Broker authentication and session management

5. Implement admin review workflow:
   - COI approval interface
   - Deficiency notes and rejection
   - Status management

