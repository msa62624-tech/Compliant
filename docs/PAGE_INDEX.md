# Page Index - Quick Reference

Quick reference guide to all pages in the Compliant platform.

## 🔗 Quick Links
- [Complete Page Renders with Screenshots](./ALL_PAGE_RENDERS.md)
- [E2E Testing Documentation](./e2e-screenshots/README.md)

---

## Public Pages (No Authentication Required)

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page |
| Login | `/login` | Authentication page |
| 404 | `/not-found` | Error page |

---

## Admin Pages (`/admin/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin/dashboard` | Main admin overview |
| Contractors List | `/admin/contractors` | View all contractors |
| New Contractor | `/admin/contractors/new` | Create contractor |
| General Contractors | `/admin/general-contractors` | Manage GCs |
| GC Details | `/admin/general-contractors/[id]` | View GC details |
| New GC Project | `/admin/general-contractors/[id]/projects/new` | Create project for GC |
| Projects List | `/admin/projects` | View all projects |
| New Project | `/admin/projects/new` | Create new project |
| Programs List | `/admin/programs` | View all programs |
| New Program | `/admin/programs/new` | Create new program |
| Program Details | `/admin/programs/[id]` | View program details |
| Edit Program | `/admin/programs/[id]/edit` | Edit program |
| COI List | `/admin/coi` | View all COIs |
| COI Reviews | `/admin/coi-reviews` | Review pending COIs |
| Users | `/admin/users` | Manage users |
| Reports | `/admin/reports` | System reports |
| Settings | `/admin/settings` | System settings |

---

## General Contractor Pages (`/gc/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/gc/dashboard` | GC overview |
| Projects | `/gc/projects` | GC's projects |
| Project Subs | `/gc/projects/[id]/subcontractors` | Subcontractors for project |
| Subcontractors | `/gc/subcontractors` | All subcontractors |
| Compliance | `/gc/compliance` | Compliance tracking |

---

## Subcontractor Pages (`/subcontractor/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/subcontractor/dashboard` | Subcontractor overview |
| Projects | `/subcontractor/projects` | Assigned projects |
| Documents | `/subcontractor/documents` | Upload documents |
| Compliance | `/subcontractor/compliance` | Compliance status |
| Broker | `/subcontractor/broker` | Broker contact |

---

## Contractor Pages (`/contractor/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/contractor/dashboard` | Contractor overview |
| Projects | `/contractor/projects` | Contractor projects |
| Documents | `/contractor/documents` | Manage documents |
| Compliance | `/contractor/compliance` | Compliance tracking |

---

## Broker Pages (`/broker/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/broker/dashboard` | Broker overview |
| Projects | `/broker/projects` | Projects needing insurance |
| Documents | `/broker/documents` | Manage policies |
| Compliance | `/broker/compliance` | Compliance tracking |
| Upload | `/broker/upload` | Upload insurance docs |
| Upload for Sub | `/broker/upload/[subId]` | Upload for specific sub |
| Sign Document | `/broker/sign/[id]` | Sign and certify |

---

## Shared/Generic Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Role-based dashboard |
| COI | `/coi` | COI management |
| Contractors | `/contractors` | Contractors list |
| Projects | `/projects` | Projects list |
| Programs | `/programs` | Programs list |
| Documents | `/documents` | Document management |
| Compliance | `/compliance` | Compliance tracking |
| Settings | `/settings` | User settings |
| Users | `/users` | User management |

---

## Summary

- **Total Unique Pages:** 44
- **Public Pages:** 3
- **Admin Pages:** 17
- **GC Pages:** 5
- **Subcontractor Pages:** 5
- **Contractor Pages:** 4
- **Broker Pages:** 7
- **Shared Pages:** 9

---

## Role-Based Access Matrix

| Role | Access Level | Page Count |
|------|-------------|------------|
| **SUPER_ADMIN** | Full system access | All pages |
| **ADMIN** | Admin functions | Admin + Shared |
| **MANAGER** | Management functions | Shared |
| **CONTRACTOR** | Contractor-specific | Contractor + Shared |
| **GENERAL_CONTRACTOR** | GC-specific | GC + Shared |
| **SUBCONTRACTOR** | Sub-specific | Subcontractor + Shared |
| **BROKER** | Broker-specific | Broker + Shared |
| **Public** | No authentication | Public pages only |

---

**Last Updated:** January 20, 2026
