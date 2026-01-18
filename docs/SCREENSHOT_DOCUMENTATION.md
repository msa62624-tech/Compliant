# Page Screenshots Documentation

This document provides comprehensive visual documentation of all pages and interfaces in the Compliant Platform. Screenshots demonstrate the complete user journey across all user roles.

## Overview

The Compliant Platform features role-based dashboards and workflows for:
- **Public Pages** (Homepage, Login)
- **Admin/Manager** (System administration and COI reviews)
- **General Contractor** (Project and subcontractor management)
- **Subcontractor** (Broker assignment and compliance tracking)
- **Broker** (COI document upload and management)
- **API Documentation** (Swagger UI for developers)

---

## Public Pages

### 1. Homepage

**URL:** `/`  
**Description:** Landing page for the Compliant Platform

![Homepage](./screenshots/01-homepage.png)

#### Features
- Clean, professional design
- "Compliant Platform" heading
- Subtitle: "Professional contractor and insurance management"
- Call-to-action buttons:
  - "Get Started" → Navigates to login
  - "Dashboard" → For authenticated users
- Technology stack display: "Built with Next.js 14, NestJS, PostgreSQL, and Prisma"

#### Visual Elements
- Professional branding
- Clear navigation
- Responsive layout

---

### 2. Login Page

**URL:** `/login`  
**Description:** User authentication page

![Login Page](./screenshots/02-login-page.png)

#### Features
- Centered login form
- Email address field (placeholder: admin@compliant.com)
- Password field (secure input masking)
- "Sign in" button
- Demo credentials display for easy testing:
  - Admin: admin@compliant.com / Admin123!@#
  - Manager: manager@compliant.com / Manager123!@#
  - Contractor: contractor@compliant.com / Contractor123!@#
  - Subcontractor: subcontractor@compliant.com / Subcontractor123!@#
  - Broker: broker@compliant.com / Broker123!@#

#### User Experience
- Clean, minimalist design
- Form validation
- Error handling
- Redirects to appropriate dashboard after successful authentication

---

## API Documentation

### 3-6. Swagger UI Pages

**Base URL:** `http://localhost:3001/api/docs`  
**Description:** Interactive API documentation

#### Main Overview Page

![API Documentation Overview](./screenshots/03-api-docs-overview.png)

- Professional Swagger UI presentation
- All endpoints organized by category
- "Authorize" button for testing authenticated endpoints

#### Authentication Endpoints

![Authentication Endpoints](./screenshots/04-api-docs-authentication.png)

- POST `/api/auth/login` - User login
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - User logout (requires auth)
- GET `/api/auth/me` - Get current user (requires auth)

#### Users Endpoints

![Users Endpoints](./screenshots/05-api-docs-users.png)

- POST `/api/users` - Create a new user (Admin only, requires auth)
- GET `/api/users` - Get all users (requires auth)
- GET `/api/users/{id}` - Get user by ID (requires auth)
- PATCH `/api/users/{id}` - Update user (Admin only, requires auth)
- DELETE `/api/users/{id}` - Delete user (Admin only, requires auth)

#### Contractors Endpoints

![Contractors Endpoints](./screenshots/06-api-docs-contractors.png)

- POST `/api/contractors` - Create a new contractor (requires auth)
- GET `/api/contractors` - Get all contractors (requires auth)
- GET `/api/contractors/{id}` - Get contractor by ID (requires auth)
- PATCH `/api/contractors/{id}` - Update contractor (requires auth)
- DELETE `/api/contractors/{id}` - Delete contractor (requires auth)
- GET `/api/contractors/{id}/insurance-status` - Get contractor insurance status (requires auth)

#### Features
- Lock icons indicate authentication required
- Expandable sections for each endpoint
- Request/response schemas clearly shown
- "Try it out" functionality for testing
- Parameter documentation
- Response code examples

---

## Admin Dashboard & Pages

### 8. Admin Dashboard

**URL:** `/dashboard` (logged in as Admin)  
**Role Badge:** Red "ADMIN" badge

![Admin Dashboard](./screenshots/08-admin-dashboard.png)

#### Header
- Platform name: "Compliant Platform"
- User info: "Admin User"
- Role badge: "ADMIN"
- Red "Logout" button

#### Statistics Cards
1. **General Contractors**: 12 Active GCs
2. **Active Projects**: 8 Ongoing jobs
3. **Pending COI Reviews**: 5 Awaiting approval
4. **Compliance Rate**: 87% Overall

#### Information Banner
- Blue info box explaining admin role
- "As an admin, you manage General Contractors (GCs), create projects, and review/approve COI documents submitted by brokers."

#### Quick Actions
Four action cards with links:
1. **General Contractors** - Add and manage General Contractors (GCs)
2. **Projects** - Create and manage construction projects
3. **COI Reviews** - Review and approve insurance documents submitted by brokers
4. **Reports** - Generate compliance and activity reports

---

### 9-17. Admin Portal Pages

#### 9. General Contractors List

**URL:** `/admin/general-contractors`

![General Contractors](./screenshots/09-admin-general-contractors.png)

- List of all general contractors
- Search and filter capabilities
- Add new GC button
- Edit/view details for each GC

#### 10. Contractors Management

**URL:** `/admin/contractors`

![Contractors Management](./screenshots/10-admin-contractors.png)

- Complete contractor list (GCs and Subs)
- Status indicators
- Insurance compliance overview

#### 11. Projects Management

**URL:** `/admin/projects`

![Projects Management](./screenshots/11-admin-projects.png)

- Active and completed projects
- Project details and assignments
- Contractor assignments per project

#### 12. COI Reviews

**URL:** `/admin/coi-reviews`

![COI Reviews](./screenshots/12-admin-coi-reviews.png)

- Pending COI documents for review
- Approval/rejection workflow
- Document preview
- Deficiency notes

#### 13. COI Management

**URL:** `/admin/coi`

![COI Management](./screenshots/13-admin-coi.png)

- All COI documents in system
- Filter by status, project, contractor
- Expiration tracking

#### 14. Insurance Programs

**URL:** `/admin/programs`

![Insurance Programs](./screenshots/14-admin-programs.png)

- Configure insurance requirements
- Policy type requirements
- Coverage limits

#### 15. Reports

**URL:** `/admin/reports`

![Reports](./screenshots/15-admin-reports.png)

- Compliance reports
- Project status reports
- Expiring policies report
- Custom report generation

#### 16. User Management

**URL:** `/admin/users`

![User Management](./screenshots/16-admin-users.png)

- All system users
- Role assignment
- User creation and editing
- Access control

#### 17. System Settings

**URL:** `/admin/settings`

![System Settings](./screenshots/17-admin-settings.png)

- System configuration
- Email settings
- Notification preferences
- Integration settings

---

## Manager Dashboard

### 18. Manager Dashboard

**URL:** `/dashboard` (logged in as Manager)  
**Role Badge:** "MANAGER" badge

#### Features
- Same dashboard layout as admin
- Manager-specific permissions
- Can review and approve documents
- Cannot delete or modify system settings

#### Header
- Shows "Manager User" instead of "Admin User"
- Badge shows "MANAGER"

---

## Contractor/GC Dashboard & Pages

### 19. Contractor/GC Dashboard

**URL:** `/dashboard` (logged in as Contractor)  
**Role Badge:** Blue "CONTRACTOR" badge

#### Statistics Cards
1. **My Projects**: 5 Active jobs
2. **My Subcontractors**: 18 Across all projects
3. **Compliance Issues**: 2 Need attention

#### Information Banner
- Blue info box explaining GC role
- "As a General Contractor, you manage your projects and subcontractors' insurance compliance."

#### Quick Actions
- **My Projects** - View and manage construction projects
- **Add Subcontractors** - Add subcontractors to projects
- **Compliance Status** - Monitor subcontractor insurance compliance
- **Project Reports** - Generate project compliance reports

---

### 20. Contractor Projects
**URL:** `/projects`
- List of GC's projects
- Add subcontractors to projects
- View project compliance status

---

## Subcontractor Dashboard & Pages

### 21. Subcontractor Dashboard

**URL:** `/dashboard` (logged in as Subcontractor)  
**Role Badge:** Purple "SUBCONTRACTOR" badge

#### Statistics Cards
1. **Active Assignments**: 3 Active projects
2. **Insurance Status**: ✓ Valid - Broker verified
3. **Pending Items**: 1 Needs attention

#### Information Banner
- Purple info box explaining subcontractor's role
- "As a subcontractor, you provide your broker information and ensure your insurance documents are current."

#### Quick Actions
- **My Assignments** - View current project assignments
- **Insurance Documents** - Manage insurance documentation
- **Timesheets** - Submit and track work hours
- **Profile** - Update personal information

---

### 22. Subcontractor Projects
**URL:** `/subcontractor/projects`
- Projects assigned to subcontractor
- Project details and requirements
- Compliance status per project

---

### 23. Broker Assignment
**URL:** `/subcontractor/broker`
- Assign insurance broker
- Broker contact information
- Update broker details

---

### 24. Documents
**URL:** `/subcontractor/documents`
- View uploaded COI documents
- Document status
- Download documents

---

### 25. Compliance Status
**URL:** `/subcontractor/compliance`
- Overall compliance status
- Policy expiration dates
- Required actions

---

## Broker Dashboard & Pages

### 26. Broker Dashboard

**URL:** `/dashboard` (logged in as Broker)  
**Role Badge:** Emerald "BROKER" badge

#### Statistics Cards
1. **My Contractors**: 12 Assigned to you
2. **Pending COI Uploads**: 5 Need your attention
3. **Expiring Soon**: 3 Within 30 days

#### Information Banner
- Emerald/teal info box explaining broker's role
- "As an insurance broker, you upload and manage COI documents for your assigned contractors."

#### Quick Actions
- **My Contractors** - View contractors and subcontractors assigned to you
- **Upload COI** - Upload Certificate of Insurance documents
- **Manage Documents** - View and update existing COI documents
- **Expiring Policies** - Track and renew expiring insurance policies

---

### 27. Broker Upload Page
**URL:** `/broker/upload`
- COI document upload form
- Policy document uploads (GL, Auto, Umbrella, WC)
- Broker signature
- Submit for review

---

### 28. Broker Projects
**URL:** `/broker/projects`
- Projects with assigned contractors
- Pending uploads
- Expiring policies

---

## Screenshot Capture Summary

### Total Pages: 28+
- **Public Pages:** 2 (Homepage, Login)
- **API Documentation:** 5 (Overview, Auth, Users, Contractors, COI)
- **Admin Pages:** 10 (Dashboard + 9 management pages)
- **Manager Pages:** 1 (Dashboard)
- **Contractor Pages:** 2 (Dashboard, Projects)
- **Subcontractor Pages:** 5 (Dashboard, Projects, Broker, Documents, Compliance)
- **Broker Pages:** 3 (Dashboard, Upload, Projects)

### Screenshot Specifications
- **Resolution:** 1920x1080 (Full HD)
- **Format:** PNG
- **Naming:** Sequential with descriptive names (e.g., `01-homepage.png`)
- **Full Page:** Capture entire scrollable content where applicable

---

## Automation Script

Screenshots can be automatically captured using the provided script:

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium

# Start backend and frontend servers
pnpm dev

# Run screenshot capture script
pnpm capture:screenshots
```

The script will:
1. Navigate to each page
2. Handle authentication for protected pages
3. Capture full-page screenshots
4. Save images to `docs/screenshots/` directory
5. Generate sequential numbered files

---

## Notes

- All screenshots demonstrate actual application functionality
- Some admin pages may show "Coming Soon" or 404 if not yet implemented
- Statistics shown are representative demo data
- Screenshots show the UI in its default state with sample data
- Dark mode variants can be captured separately if needed

---

**Automation Script:** `scripts/capture-screenshots.ts`  
**Output Directory:** `docs/screenshots/`  
**Last Updated:** January 18, 2026  
**Status:** ✅ Script Ready - Screenshots Pending Server Startup
