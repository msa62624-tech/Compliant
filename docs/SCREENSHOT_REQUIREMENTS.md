# Screenshot Requirements

This document outlines all screenshots needed for the Compliant Platform documentation.

## Current Screenshots (6)

These screenshots exist in `docs/WORKFLOW_TEST_RESULTS.md` and should be refreshed:

1. **Homepage** - http://localhost:3000
   - Current URL: `https://github.com/user-attachments/assets/58937ae0-db2d-419c-891e-d78d33fe9f84`
   - New file: `docs/images/01-homepage.png`

2. **Login Page** - http://localhost:3000/login
   - Current URL: `https://github.com/user-attachments/assets/34325be0-8dbd-4510-84d3-0c259a42f141`
   - New file: `docs/images/02-login-page.png`

3. **Admin Dashboard** - http://localhost:3000/dashboard (logged in as Admin)
   - Current URL: `https://github.com/user-attachments/assets/d46bda76-5d7e-4163-a84d-e4c490897ff2`
   - New file: `docs/images/03-admin-dashboard.png`
   - Test account: `admin@compliant.com` / `Admin123!@#`

4. **Manager Dashboard** - http://localhost:3000/dashboard (logged in as Manager)
   - Current URL: `https://github.com/user-attachments/assets/46f38764-de76-4790-808f-fea0a3a5a327`
   - New file: `docs/images/04-manager-dashboard.png`
   - Test account: `manager@compliant.com` / `Manager123!@#`

5. **Swagger API Docs** - http://localhost:3001/api/docs
   - Current URL: `https://github.com/user-attachments/assets/bfa57402-1132-4ce5-b838-886c64fcf418`
   - New file: `docs/images/05-swagger-api-docs.png`

6. **API Endpoint Details** - http://localhost:3001/api/docs#/Contractors/ContractorsController_findAll
   - Current URL: `https://github.com/user-attachments/assets/23d2e685-fd60-4e2e-bc87-7155947360ff`
   - New file: `docs/images/06-api-endpoint-details.png`

## Additional Screenshots Needed (3)

These dashboards are implemented but were only code-verified, not screenshotted:

7. **Contractor/GC Dashboard** - http://localhost:3000/dashboard (logged in as Contractor)
   - New file: `docs/images/07-contractor-dashboard.png`
   - Test account: `contractor@compliant.com` / `Contractor123!@#`
   - Component: `packages/frontend/app/dashboard/components/ContractorDashboard.tsx`
   - Features:
     - Blue "CONTRACTOR" badge
     - Statistics: My Projects (5), My Subcontractors (18), Compliance Issues (2)
     - Quick Actions: My Projects, Add Subcontractors, Compliance Status, Project Reports

8. **Subcontractor Dashboard** - http://localhost:3000/dashboard (logged in as Subcontractor)
   - New file: `docs/images/08-subcontractor-dashboard.png`
   - Test account: `subcontractor@compliant.com` / `Subcontractor123!@#`
   - Component: `packages/frontend/app/dashboard/components/SubcontractorDashboard.tsx`
   - Features:
     - Purple "SUBCONTRACTOR" badge
     - Statistics: Active Assignments (3), Insurance Status (Valid), Pending Items (1)
     - Quick Actions: My Assignments, Insurance Documents, Timesheets, Profile

9. **Broker Dashboard** - http://localhost:3000/dashboard (logged in as Broker)
   - New file: `docs/images/09-broker-dashboard.png`
   - Test account: `broker@compliant.com` / `Broker123!@#`
   - Component: `packages/frontend/app/dashboard/components/BrokerDashboard.tsx`
   - Features:
     - Emerald "BROKER" badge
     - Statistics: My Contractors (12), Pending COI Uploads (5), Expiring Soon (3)
     - Quick Actions: My Contractors, Upload COI, Manage Documents, Expiring Policies

## Total Screenshots: 9

## How to Take Screenshots

### Prerequisites
1. Install dependencies: `pnpm install`
2. Set up PostgreSQL database
3. Configure environment variables in `packages/backend/.env`
4. Run database migrations: `pnpm db:push`
5. Seed database: `cd packages/backend && pnpm db:seed`

### Run Application
```bash
# Terminal 1 - Backend
pnpm backend

# Terminal 2 - Frontend  
pnpm frontend
```

### Screenshot Instructions
1. Open browser to http://localhost:3000
2. Take homepage screenshot
3. Navigate to login page and take screenshot
4. Log in with each test account and take dashboard screenshots
5. Navigate to API docs and take screenshots
6. Save all screenshots to `docs/images/` with the filenames listed above
7. Update `docs/WORKFLOW_TEST_RESULTS.md` to reference local files instead of GitHub URLs

### Update Documentation
Replace GitHub user-attachments URLs with local references:
```markdown
**Screenshot:** ![Homepage](./images/01-homepage.png)
```
