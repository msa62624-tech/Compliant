# Workflow Implementation from Original App

## Complete Workflow (from commit 114ffb1)

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

