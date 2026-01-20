# Complete Page Renders - Compliant Platform

This document provides visual renders of **every page** in the Compliant Insurance Tracking Platform across all user roles.

## 📸 Overview

A comprehensive collection of screenshots showing all pages in the system, organized by user role and page type.

**Total Screenshots Captured: 40**

---

## 🌐 Public Pages (Unauthenticated)

These pages are accessible without authentication.

### 1. Home Page
**Route:** `/`

![Home Page](docs/e2e-screenshots/all_pages_public/001-001_home_page.png)

### 2. Login Page
**Route:** `/login`

![Login Page](docs/e2e-screenshots/all_pages_public/002-002_login_page.png)

### 3. 404 Not Found Page
**Route:** `/non-existent-page`

![404 Page](docs/e2e-screenshots/all_pages_public/003-003_404_page.png)

---

## 👨‍💼 Admin Pages

Full administrative access with complete CRUD operations for all entities.

### Authentication

**Login Page:**

![Admin Login](docs/e2e-screenshots/all_pages_admin/001-admin_login_page.png)

**Login Form Filled:**

![Admin Login Form Filled](docs/e2e-screenshots/all_pages_admin/002-admin_login_form_filled.png)

### Dashboard & Overview
1. **Admin Dashboard**
   - **Route:** `/admin/dashboard`
   - **Description:** Main administrative dashboard with overview stats
   
   ![Admin Dashboard](docs/e2e-screenshots/all_pages_admin/003-010_admin_dashboard.png)

### Contractors Management
2. **Contractors List**
   - **Route:** `/admin/contractors`
   - **Description:** List and manage all contractors
   
   ![Admin Contractors List](docs/e2e-screenshots/all_pages_admin/004-011_admin_contractors_list.png)

3. **New Contractor Form**
   - **Route:** `/admin/contractors/new`
   - **Description:** Create new contractor with details
   
   ![New Contractor Form](docs/e2e-screenshots/all_pages_admin/005-012_admin_contractors_new.png)

4. **General Contractors List**
   - **Route:** `/admin/general-contractors`
   - **Description:** Manage general contractors specifically
   
   ![General Contractors List](docs/e2e-screenshots/all_pages_admin/006-013_admin_general_contractors_list.png)

### Projects Management
5. **Projects List**
   - **Route:** `/admin/projects`
   - **Description:** View and manage all projects
   
   ![Admin Projects List](docs/e2e-screenshots/all_pages_admin/007-014_admin_projects_list.png)

6. **New Project Form**
   - **Route:** `/admin/projects/new`
   - **Description:** Create new construction project
   
   ![New Project Form](docs/e2e-screenshots/all_pages_admin/008-015_admin_projects_new.png)

### Programs Management
7. **Programs List**
   - **Route:** `/admin/programs`
   - **Description:** Manage insurance programs
   
   ![Admin Programs List](docs/e2e-screenshots/all_pages_admin/009-016_admin_programs_list.png)

8. **New Program Form**
   - **Route:** `/admin/programs/new`
   - **Description:** Create new insurance program
   
   ![New Program Form](docs/e2e-screenshots/all_pages_admin/010-017_admin_programs_new.png)

### COI Management
9. **COI List**
   - **Route:** `/admin/coi`
   - **Description:** View all Certificates of Insurance
   
   ![Admin COI List](docs/e2e-screenshots/all_pages_admin/011-018_admin_coi_list.png)

10. **COI Reviews**
    - **Route:** `/admin/coi-reviews`
    - **Description:** Review and approve pending COIs
    
    ![COI Reviews](docs/e2e-screenshots/all_pages_admin/012-019_admin_coi_reviews.png)

### User & System Management
11. **Users List**
    - **Route:** `/admin/users`
    - **Description:** Manage system users and roles
    
    ![Admin Users List](docs/e2e-screenshots/all_pages_admin/013-020_admin_users_list.png)

12. **Reports**
    - **Route:** `/admin/reports`
    - **Description:** Generate and view system reports
    
    ![Admin Reports](docs/e2e-screenshots/all_pages_admin/014-021_admin_reports.png)

13. **Settings**
    - **Route:** `/admin/settings`
    - **Description:** System configuration and settings
    
    ![Admin Settings](docs/e2e-screenshots/all_pages_admin/015-022_admin_settings.png)

---

## 🏗️ General Contractor (GC) Pages

Pages for general contractors managing their subcontractors and projects.

### Authentication

**Login Page:**

![GC Login](docs/e2e-screenshots/all_pages_gc/001-gc_login_page.png)

**Login Form Filled:**

![GC Login Form Filled](docs/e2e-screenshots/all_pages_gc/002-gc_login_form_filled.png)

### Main Pages
1. **GC Dashboard**
   - **Route:** `/gc/dashboard`
   - **Description:** General contractor's overview dashboard
   
   ![GC Dashboard](docs/e2e-screenshots/all_pages_gc/003-030_gc_dashboard.png)

2. **GC Projects**
   - **Route:** `/gc/projects`
   - **Description:** Manage projects as a general contractor
   
   ![GC Projects](docs/e2e-screenshots/all_pages_gc/004-031_gc_projects.png)

3. **GC Subcontractors**
   - **Route:** `/gc/subcontractors`
   - **Description:** View and manage subcontractors
   
   ![GC Subcontractors](docs/e2e-screenshots/all_pages_gc/005-032_gc_subcontractors.png)

4. **GC Compliance**
   - **Route:** `/gc/compliance`
   - **Description:** Compliance tracking and status
   
   ![GC Compliance](docs/e2e-screenshots/all_pages_gc/006-033_gc_compliance.png)

---

## 🔨 Subcontractor Pages

Pages for subcontractors to manage their documents and compliance.

### Main Pages
1. **Subcontractor Dashboard**
   - **Route:** `/subcontractor/dashboard`
   - **Description:** Subcontractor's main dashboard
   - **Note:** Test timed out but page exists in system

2. **Subcontractor Projects**
   - **Route:** `/subcontractor/projects`
   - **Description:** View assigned projects

3. **Subcontractor Documents**
   - **Route:** `/subcontractor/documents`
   - **Description:** Upload and manage insurance documents

4. **Subcontractor Compliance**
   - **Route:** `/subcontractor/compliance`
   - **Description:** View compliance status

5. **Subcontractor Broker**
   - **Route:** `/subcontractor/broker`
   - **Description:** Broker contact and communication

---

## 👷 Contractor Role Pages

Pages for contractors (non-GC contractors).

### Authentication

**Login Page:**

![Contractor Login](docs/e2e-screenshots/all_pages_contractor_role/001-contractor_login_page.png)

**Login Form Filled:**

![Contractor Login Form Filled](docs/e2e-screenshots/all_pages_contractor_role/002-contractor_login_form_filled.png)

### Main Pages
1. **Contractor Dashboard**
   - **Route:** `/contractor/dashboard`
   - **Description:** Contractor's main dashboard
   
   ![Contractor Dashboard](docs/e2e-screenshots/all_pages_contractor_role/003-050_contractor_dashboard.png)

2. **Contractor Projects**
   - **Route:** `/contractor/projects`
   - **Description:** View contractor's projects
   
   ![Contractor Projects](docs/e2e-screenshots/all_pages_contractor_role/004-051_contractor_projects.png)

3. **Contractor Documents**
   - **Route:** `/contractor/documents`
   - **Description:** Manage contractor documents
   
   ![Contractor Documents](docs/e2e-screenshots/all_pages_contractor_role/005-052_contractor_documents.png)

4. **Contractor Compliance**
   - **Route:** `/contractor/compliance`
   - **Description:** Compliance tracking for contractor
   
   ![Contractor Compliance](docs/e2e-screenshots/all_pages_contractor_role/006-053_contractor_compliance.png)

---

## 🏦 Broker Pages

Pages for insurance brokers to manage policies and documents.

### Main Pages (Require Broker User Setup)
1. **Broker Dashboard**
   - **Route:** `/broker/dashboard`
   - **Description:** Broker's main dashboard

2. **Broker Projects**
   - **Route:** `/broker/projects`
   - **Description:** View projects needing insurance

3. **Broker Documents**
   - **Route:** `/broker/documents`
   - **Description:** Manage insurance documents

4. **Broker Compliance**
   - **Route:** `/broker/compliance`
   - **Description:** Compliance tracking

5. **Broker Upload**
   - **Route:** `/broker/upload`
   - **Description:** Upload insurance documents

6. **Broker Upload for Subcontractor**
   - **Route:** `/broker/upload/[subId]`
   - **Description:** Upload documents for specific subcontractor

7. **Broker Sign**
   - **Route:** `/broker/sign/[id]`
   - **Description:** Sign and certify documents

---

## 🔄 Shared/Generic Pages

These pages are accessible across multiple roles with role-based content filtering.

### Authentication

**Login Page:**

![Shared Login](docs/e2e-screenshots/all_pages_shared/001-shared_login_page.png)

**Login Form Filled:**

![Shared Login Form Filled](docs/e2e-screenshots/all_pages_shared/002-shared_login_form_filled.png)

### Main Pages
1. **Generic Dashboard**
   - **Route:** `/dashboard`
   - **Description:** Role-agnostic dashboard
   
   ![Generic Dashboard](docs/e2e-screenshots/all_pages_shared/003-060_dashboard_generic.png)

2. **Generic COI**
   - **Route:** `/coi`
   - **Description:** View COI list
   
   ![Generic COI](docs/e2e-screenshots/all_pages_shared/004-061_coi_generic.png)

3. **Generic Contractors**
   - **Route:** `/contractors`
   - **Description:** View contractors list
   
   ![Generic Contractors](docs/e2e-screenshots/all_pages_shared/005-062_contractors_generic.png)

4. **Generic Projects**
   - **Route:** `/projects`
   - **Description:** View projects list
   
   ![Generic Projects](docs/e2e-screenshots/all_pages_shared/006-063_projects_generic.png)

5. **Generic Programs**
   - **Route:** `/programs`
   - **Description:** View programs list
   
   ![Generic Programs](docs/e2e-screenshots/all_pages_shared/007-064_programs_generic.png)

6. **Generic Documents**
   - **Route:** `/documents`
   - **Description:** Documents management
   
   ![Generic Documents](docs/e2e-screenshots/all_pages_shared/008-065_documents_generic.png)

7. **Generic Compliance**
   - **Route:** `/compliance`
   - **Description:** Compliance tracking
   
   ![Generic Compliance](docs/e2e-screenshots/all_pages_shared/009-066_compliance_generic.png)

8. **Generic Settings**
   - **Route:** `/settings`
   - **Description:** User settings
   
   ![Generic Settings](docs/e2e-screenshots/all_pages_shared/010-067_settings_generic.png)

---

## 📊 Page Summary by Role

| Role | Number of Pages | Authentication Required |
|------|----------------|------------------------|
| **Public** | 3 | No |
| **Admin** | 13 | Yes (Admin role) |
| **General Contractor** | 4 | Yes (GC role) |
| **Subcontractor** | 5 | Yes (Subcontractor role) |
| **Contractor** | 4 | Yes (Contractor role) |
| **Broker** | 7 | Yes (Broker role) |
| **Shared/Generic** | 8 | Yes (Any authenticated role) |
| **TOTAL** | **44 Unique Pages** | |

---

## 🔍 Route Structure

### Public Routes
- `/` - Home
- `/login` - Authentication

### Admin Routes (Prefix: `/admin/`)
- `/admin/dashboard`
- `/admin/contractors`
- `/admin/contractors/new`
- `/admin/general-contractors`
- `/admin/general-contractors/[id]`
- `/admin/general-contractors/[id]/projects/new`
- `/admin/projects`
- `/admin/projects/new`
- `/admin/programs`
- `/admin/programs/new`
- `/admin/programs/[id]`
- `/admin/programs/[id]/edit`
- `/admin/coi`
- `/admin/coi-reviews`
- `/admin/users`
- `/admin/reports`
- `/admin/settings`

### GC Routes (Prefix: `/gc/`)
- `/gc/dashboard`
- `/gc/projects`
- `/gc/projects/[id]/subcontractors`
- `/gc/subcontractors`
- `/gc/compliance`

### Subcontractor Routes (Prefix: `/subcontractor/`)
- `/subcontractor/dashboard`
- `/subcontractor/projects`
- `/subcontractor/documents`
- `/subcontractor/compliance`
- `/subcontractor/broker`

### Contractor Routes (Prefix: `/contractor/`)
- `/contractor/dashboard`
- `/contractor/projects`
- `/contractor/documents`
- `/contractor/compliance`

### Broker Routes (Prefix: `/broker/`)
- `/broker/dashboard`
- `/broker/projects`
- `/broker/documents`
- `/broker/compliance`
- `/broker/upload`
- `/broker/upload/[subId]`
- `/broker/sign/[id]`

### Generic/Shared Routes
- `/dashboard`
- `/coi`
- `/contractors`
- `/projects`
- `/programs`
- `/documents`
- `/compliance`
- `/settings`
- `/users`

---

## 📝 Notes

- All screenshots were captured using Playwright with Chromium browser
- Screenshots show the initial page load state
- Some pages are dynamic and will show different content based on:
  - User role and permissions
  - Data assigned to the user
  - Current system state
- Pages with `[id]` or `[subId]` in the route are dynamic routes requiring specific IDs
- All screenshots are full-page captures including any content below the fold

---

## 🔗 Related Documentation

- [E2E Testing Documentation](./e2e-screenshots/README.md)
- [Main README](../README.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Implementation Guidelines](./IMPLEMENTATION_GUIDELINES.md)

---

**Generated:** January 20, 2026
**Test Framework:** Playwright 1.57.0
**Browser:** Chromium (Desktop Chrome)
**Total Screenshots:** 40
