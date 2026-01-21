# Complete Screenshot URL List

This document provides a comprehensive list of all screenshots needed for the Compliant Platform documentation.

## Summary
- **Total Screenshots**: 20+ pages across all dashboards and workflows
- **Status**: 6 screenshots currently hosted on GitHub, 14+ additional pages need screenshots

---

## Existing Screenshots (6)

These screenshots are currently referenced in `docs/WORKFLOW_TEST_RESULTS.md`:

### 1. Homepage
- **URL**: `https://github.com/user-attachments/assets/58937ae0-db2d-419c-891e-d78d33fe9f84`
- **Page**: http://localhost:3000
- **Description**: Landing page with "Compliant Platform" heading and "Get Started" button

### 2. Login Page
- **URL**: `https://github.com/user-attachments/assets/34325be0-8dbd-4510-84d3-0c259a42f141`
- **Page**: http://localhost:3000/login
- **Description**: Login form with email/password fields and demo credentials

### 3. Admin Dashboard
- **URL**: `https://github.com/user-attachments/assets/d46bda76-5d7e-4163-a84d-e4c490897ff2`
- **Page**: http://localhost:3000/dashboard
- **Login**: admin@compliant.com / Admin123!@#
- **Description**: Admin dashboard with statistics (GCs, Projects, COI Reviews, Compliance Rate)

### 4. Manager Dashboard
- **URL**: `https://github.com/user-attachments/assets/46f38764-de76-4790-808f-fea0a3a5a327`
- **Page**: http://localhost:3000/dashboard
- **Login**: manager@compliant.com / Manager123!@#
- **Description**: Manager dashboard with MANAGER badge

### 5. Swagger API Documentation
- **URL**: `https://github.com/user-attachments/assets/bfa57402-1132-4ce5-b838-886c64fcf418`
- **Page**: http://localhost:3001/api/docs
- **Description**: Swagger UI with all API endpoints (Auth, Users, Contractors, Generated COI)

### 6. API Endpoint Details
- **URL**: `https://github.com/user-attachments/assets/23d2e685-fd60-4e2e-bc87-7155947360ff`
- **Page**: http://localhost:3001/api/docs#/Contractors/ContractorsController_findAll
- **Description**: Detailed view of GET /api/contractors endpoint with parameters

---

## Admin Pages (7+ screenshots needed)

### 7. Admin - General Contractors List
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/admin/general-contractors
- **Login**: admin@compliant.com / Admin123!@#
- **Description**: List of all General Contractors (GCs) with ability to manage them

### 8. Admin - General Contractor Details
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/admin/general-contractors/[id]
- **Login**: admin@compliant.com / Admin123!@#
- **Description**: Individual GC details page showing projects and information

### 9. Admin - COI Reviews (Notification Page)
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/admin/coi-reviews
- **Login**: admin@compliant.com / Admin123!@#
- **Description**: Page where admin receives notifications and reviews COI documents submitted by brokers
- **File**: `packages/frontend/app/admin/coi-reviews/page.tsx`

### 10. Admin - Contractors Management
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/admin/contractors/new
- **Login**: admin@compliant.com / Admin123!@#
- **Description**: Page to add/manage contractors

### 11. Admin - Projects List
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/admin/projects
- **Login**: admin@compliant.com / Admin123!@#
- **Description**: List of all projects

### 12. Admin - New Project
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/admin/projects/new
- **Login**: admin@compliant.com / Admin123!@#
- **Description**: Form to create a new project

### 13. Admin - Add Project to GC
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/admin/general-contractors/[id]/projects/new
- **Login**: admin@compliant.com / Admin123!@#
- **Description**: Form to add a project to a specific GC

---

## GC (Contractor) Dashboard & Pages (4+ screenshots needed)

### 14. GC Dashboard
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/dashboard
- **Login**: contractor@compliant.com / Contractor123!@#
- **Component**: `packages/frontend/app/dashboard/components/ContractorDashboard.tsx`
- **Description**: GC dashboard with blue "CONTRACTOR" badge
- **Features**:
  - Statistics: My Projects (5), My Subcontractors (18), Compliance Issues (2)
  - Quick Actions: My Projects, Add Subcontractors, Compliance Status, Project Reports

### 15. GC - Subcontractors List
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/gc/subcontractors
- **Login**: contractor@compliant.com / Contractor123!@#
- **Description**: List of all subcontractors for this GC

### 16. GC - Project Subcontractors
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/gc/projects/[id]/subcontractors
- **Login**: contractor@compliant.com / Contractor123!@#
- **Description**: Manage subcontractors for a specific project

---

## Subcontractor Dashboard & Pages (4+ screenshots needed)

### 17. Subcontractor Dashboard
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/dashboard
- **Login**: subcontractor@compliant.com / Subcontractor123!@#
- **Component**: `packages/frontend/app/dashboard/components/SubcontractorDashboard.tsx`
- **Description**: Subcontractor dashboard with purple "SUBCONTRACTOR" badge
- **Features**:
  - Statistics: Active Assignments (3), Insurance Status (✓ Valid), Pending Items (1)
  - Quick Actions: My Assignments, Insurance Documents, Timesheets, Profile

### 18. Subcontractor - My Projects
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/subcontractor/projects
- **Login**: subcontractor@compliant.com / Subcontractor123!@#
- **Description**: List of projects assigned to this subcontractor

### 19. Subcontractor - Broker Assignment
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/subcontractor/broker
- **Login**: subcontractor@compliant.com / Subcontractor123!@#
- **Description**: Page to assign/manage broker information

### 20. Subcontractor - Compliance Status
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/subcontractor/compliance
- **Login**: subcontractor@compliant.com / Subcontractor123!@#
- **Description**: View compliance status and insurance documents

---

## Broker Dashboard & Pages (5+ screenshots needed)

### 21. Broker Dashboard
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/dashboard
- **Login**: broker@compliant.com / Broker123!@#
- **Component**: `packages/frontend/app/dashboard/components/BrokerDashboard.tsx`
- **Description**: Broker dashboard with emerald "BROKER" badge
- **Features**:
  - Statistics: My Contractors (12), Pending COI Uploads (5), Expiring Soon (3)
  - Quick Actions: My Contractors, Upload COI, Manage Documents, Expiring Policies (includes renewals)

### 22. Broker - Upload COI
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/broker/upload
- **Login**: broker@compliant.com / Broker123!@#
- **Description**: Page to upload Certificate of Insurance documents

### 23. Broker - Manage Documents (Renewals)
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/broker/documents
- **Login**: broker@compliant.com / Broker123!@#
- **Description**: Manage existing COI documents including renewals and expiring policies
- **File**: `packages/frontend/app/broker/documents/page.tsx`

### 24. Broker - Sign/Review Document
- **URL**: *Screenshot needed*
- **Page**: http://localhost:3000/broker/sign/[id]
- **Login**: broker@compliant.com / Broker123!@#
- **Description**: Sign or review a specific COI document

---

## All Screenshot URLs - Complete List

### Existing (6 with URLs):
1. Homepage: `https://github.com/user-attachments/assets/58937ae0-db2d-419c-891e-d78d33fe9f84`
2. Login Page: `https://github.com/user-attachments/assets/34325be0-8dbd-4510-84d3-0c259a42f141`
3. Admin Dashboard: `https://github.com/user-attachments/assets/d46bda76-5d7e-4163-a84d-e4c490897ff2`
4. Manager Dashboard: `https://github.com/user-attachments/assets/46f38764-de76-4790-808f-fea0a3a5a327`
5. Swagger API Docs: `https://github.com/user-attachments/assets/bfa57402-1132-4ce5-b838-886c64fcf418`
6. API Endpoint Details: `https://github.com/user-attachments/assets/23d2e685-fd60-4e2e-bc87-7155947360ff`

### Admin Pages (7 to be captured):
7. Admin - General Contractors List
8. Admin - General Contractor Details
9. Admin - COI Reviews (where notifications appear)
10. Admin - Contractors Management
11. Admin - Projects List
12. Admin - New Project
13. Admin - Add Project to GC

### GC/Contractor Pages (3 to be captured):
14. GC Dashboard
15. GC - Subcontractors List
16. GC - Project Subcontractors

### Subcontractor Pages (4 to be captured):
17. Subcontractor Dashboard
18. Subcontractor - My Projects
19. Subcontractor - Broker Assignment
20. Subcontractor - Compliance Status

### Broker Pages (4 to be captured):
21. Broker Dashboard
22. Broker - Upload COI
23. Broker - Manage Documents (includes renewals)
24. Broker - Sign/Review Document

---

## Test Accounts

All test accounts with their respective roles:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Admin | admin@compliant.com | Admin123!@# | AdminDashboard |
| Manager | manager@compliant.com | Manager123!@# | AdminDashboard (same as Admin) |
| Contractor | contractor@compliant.com | Contractor123!@# | ContractorDashboard |
| Subcontractor | subcontractor@compliant.com | Subcontractor123!@# | SubcontractorDashboard |
| Broker | broker@compliant.com | Broker123!@# | BrokerDashboard |

---

## Notes

- The original document said "Total Screenshots: 5" but actually has 6 screenshots
- PR #53 included these 6 screenshots
- Based on expanded requirements, **24 total pages need screenshots**:
  - 6 existing screenshots (Homepage, Login, Admin/Manager Dashboards, API Docs)
  - 7 Admin pages (GC management, COI reviews/notifications, Projects)
  - 3 GC/Contractor pages (Dashboard, Subcontractors management)
  - 4 Subcontractor pages (Dashboard, Projects, Broker, Compliance)
  - 4 Broker pages (Dashboard, Upload, Documents/Renewals, Sign)

## Key Pages by User Request

### "Contractor page in admin dashboards"
- Admin - General Contractors List (#7)
- Admin - General Contractor Details (#8)

### "GC dashboard"
- GC Dashboard (#14)
- GC - Subcontractors List (#15)
- GC - Project Subcontractors (#16)

### "Renewal dashboard"
- Broker - Manage Documents (#23) - includes renewals and expiring policies

### "Where admin will be notified of the review"
- Admin - COI Reviews (#9) - page where admin receives notifications and reviews COI documents

### "Sub dashboard and pages"
- Subcontractor Dashboard (#17)
- Subcontractor - My Projects (#18)
- Subcontractor - Broker Assignment (#19)
- Subcontractor - Compliance Status (#20)

### "Broker dashboard and pages"
- Broker Dashboard (#21)
- Broker - Upload COI (#22)
- Broker - Manage Documents (#23)
- Broker - Sign/Review Document (#24)

## Next Steps

To complete the screenshot collection:
1. Run the application (backend + frontend)
2. Take fresh screenshots of all 6 existing pages
3. Take screenshots of the 18 additional pages across all dashboards
4. Save screenshots to `docs/images/` directory with naming convention: `01-homepage.png`, `02-login.png`, etc.
5. Update `docs/WORKFLOW_TEST_RESULTS.md` to reference local image files
