# Feature Requirements - Project Notifications and User Management

## 1. Project Creation Workflow & Notifications

### When a Project is Added:
- **GC Notification**: General Contractor receives immediate notification
- **Dashboard Update**: Project automatically appears on GC's dashboard
- **Email Notification**: 
  - Contains direct link to the specific project
  - GC can click link to go directly to project details
  - From project page, GC can navigate back to view entire dashboard
  - Email template should include:
    - Project name
    - Project address
    - Start date
    - Direct link button: "View Project"
    - Link to full dashboard

### Email Template Structure:
```
Subject: New Project Assigned: [Project Name]

Dear [GC Contact Person Name],

A new project has been assigned to [GC Company Name]:

Project: [Project Name]
Address: [Property Address]
Start Date: [Date]
Structure Type: [Condos/Rentals/Commercial]

[View Project Button] → Direct link to project
[View Dashboard Button] → Link to full GC dashboard

---
This is an automated notification from Compliant Platform
```

## 2. GC Account Creation & Onboarding

### Initial GC Setup:
- When a GC is first added to the system:
  - **Username**: Automatically set to their email address
  - **Password**: System generates a strong, secure password
    - Example format: `Gc2024!xK9mP#vN`
    - Minimum 16 characters
    - Mix of uppercase, lowercase, numbers, special characters
  
### Welcome Email:
```
Subject: Welcome to Compliant Platform

Dear [GC Name],

Your account has been created for [Company Name].

Dashboard Link: [Dashboard URL]
Username: [email@company.com]
Temporary Password: [Generated Password]

For security, please change your password after first login.

[Access Dashboard Button]
```

## 3. Password Management Features

### Password Visibility Toggle (Eye Icon):
- **Login Page**: Add eye icon next to password field
- **Change Password Page**: Add eye icon for both old and new password fields
- **Behavior**:
  - Default: Password hidden (type="password")
  - Click eye icon: Show password (type="text")
  - Click again: Hide password
  - Icon changes: 👁️ (show) ⟷ 👁️‍🗨️ (hide)

### Forgot Password Flow:
1. **Login Page**: Add "Forgot Password?" link below password field
2. **Reset Request Page**:
   - User enters email
   - System sends reset link to email
   - Link expires in 1 hour
3. **Reset Password Page**:
   - User clicks link in email
   - Enters new password (with eye icon)
   - Confirms new password
   - Submits to update

### Change Username/Email:
- **Profile Settings Page**:
  - Current email displayed
  - "Change Email" button
  - Verification required (send code to new email)
  - Username (login) automatically updates to new email

## 4. Subcontractor Management Within Projects

### Add Subcontractor from Project Page:
- When GC is viewing a specific project
- **"Add Subcontractor" button** visible
- Opens modal/form with:
  - Subcontractor selection (existing or new)
  - **Trade Type Selector** (dropdown menu)

### Construction Trade Types Menu:
Comprehensive list of all construction trades:

**Structural:**
- General Contractor
- Concrete/Foundation
- Steel Erection
- Masonry
- Carpentry/Framing

**Building Envelope:**
- Roofing
- Waterproofing
- Window/Glazing
- Siding/Cladding
- Insulation

**Mechanical:**
- HVAC
- Plumbing
- Fire Protection/Sprinklers
- Gas Fitting

**Electrical:**
- Electrical
- Low Voltage/Data
- Security Systems
- Fire Alarm

**Interior:**
- Drywall
- Painting
- Flooring
- Tile/Stone
- Millwork/Cabinetry
- Doors/Hardware

**Specialty:**
- Elevators
- Scaffolding
- Demolition
- Excavation/Site Work
- Landscaping
- Paving/Concrete
- Environmental/Asbestos
- Testing/Inspection

### Multi-Trade Selection:
- Subcontractors can be assigned multiple trades
- Example: "Plumbing" and "HVAC" for MEP contractor
- Checkboxes for selecting multiple trades

## 5. Insurance Programs Section (Admin Dashboard)

### Feature: AI-Powered Insurance Program Management

**New Quick Action Card:**
- **Title**: "Insurance Programs"
- **Description**: "Manage insurance program templates with AI-powered PDF import"
- **Link**: `/admin/insurance-programs`

### Insurance Programs Features:

**1. AI-Powered PDF Import:**
- Upload insurance program PDF documents
- AI automatically extracts and structures:
  - Program name and description
  - Multi-tier requirements (Tier 1, Tier 2, Tier 3, etc.)
  - Trade-specific coverage requirements
  - GL, WC, Auto, Umbrella policy limits per trade/tier
  - Scope and endorsement requirements
  - Additional insured requirements per tier
- Preview AI-extracted data before confirming import
- Saves time vs manual data entry

**2. Manual Program Creation:**
- Create program templates from scratch
- Define custom tiers and trades
- Set coverage requirements per tier per trade
- Configure endorsement requirements
- Add scope descriptions

**3. Template Management:**
- **Store & Reuse**: Save program templates for reuse across multiple projects
- **Update/Overwrite**: Replace existing programs with new PDF versions
- **Version Control**: Track program template changes over time
- **Search & Filter**: Find programs by name, tier, or trade type

**4. Project Customization:**
- **Apply Templates**: Apply saved program template to specific projects
- **Customize Requirements**: Override template values for specific projects
- **Trade Selection**: Choose which trades apply to each project
- **Tier Assignment**: Assign contractors to appropriate tiers

### Multi-Tier System:
Programs support multiple tiers with varying requirements:
- **Tier 1**: Highest risk trades (e.g., structural steel, roofing)
  - Example: GL $2M/$5M aggregate, Umbrella $5M
- **Tier 2**: Medium risk trades (e.g., electrical, plumbing)
  - Example: GL $1M/$2M aggregate, Umbrella $2M
- **Tier 3**: Lower risk trades (e.g., painting, flooring)
  - Example: GL $1M/$2M aggregate, Umbrella $1M

### Trade-Specific Requirements:
Each construction trade can have different coverage requirements:
- **Structural**: Concrete, Steel, Masonry, Carpentry
- **Building Envelope**: Roofing, Waterproofing, Windows
- **Mechanical**: HVAC, Plumbing, Fire Protection
- **Electrical**: Electrical, Low Voltage, Security
- **Interior**: Drywall, Painting, Flooring, Tile
- **Specialty**: Elevators, Scaffolding, Demolition

### Auto-Assignment to Projects:
- Each project assigned to an insurance program template
- Insurance requirements automatically populated from template
- Compliance checking uses program requirements
- Deficiencies identified based on program vs actual coverage

### Compliance Tracking:
- Dashboard shows program compliance status per project
- Visual indicators for compliant/non-compliant trades
- Drill-down into specific trade compliance
- Export compliance reports per program

## 6. Implementation Priority

### Phase 1 (High Priority):
1. Password visibility toggle (eye icon) - Simple UI enhancement
2. GC account creation with generated password
3. Welcome email with credentials
4. Project notification emails with direct links

### Phase 2 (Medium Priority):
1. Forgot password functionality
2. Change email/username feature
3. Programs section in admin dashboard
4. Program types and levels configuration

### Phase 3 (Lower Priority):
1. Add subcontractor from within project
2. Construction trades dropdown menu
3. Multi-trade assignment
4. Enhanced notification preferences

## Database Schema Updates Needed

### Users Table:
```sql
- passwordResetToken: string (nullable)
- passwordResetExpires: datetime (nullable)
- emailVerificationToken: string (nullable)
- lastPasswordChange: datetime
```

### Projects Table:
```sql
- programType: enum (OCIP, CCIP, WRAP_UP, TRADITIONAL)
- programLevel: string
- notificationsSent: boolean
```

### ProjectSubcontractors Table:
```sql
- trades: string[] (array of trade types)
- assignedDate: datetime
- notificationSent: boolean
```

### Programs Table (New):
```sql
- id: string
- name: string
- type: enum
- level: string
- glCoverage: number
- umbrellaCoverage: number
- autoCoverage: number
- additionalInsuredRequired: boolean
- waiverOfSubrogation: boolean
- noticePeriod: number
```

## UI Components to Create

1. **PasswordInput Component** - With eye icon toggle
2. **ForgotPasswordForm** - Email submission form
3. **ResetPasswordForm** - New password entry
4. **TradeSelector** - Dropdown with all trade types
5. **ProgramCard** - Display program info
6. **ProgramForm** - Create/edit programs
7. **NotificationSettings** - User preferences for emails

## Email Templates to Create

1. **GC Welcome Email** - Account credentials
2. **Project Assignment Email** - New project notification
3. **Password Reset Email** - Reset link
4. **Email Change Verification** - Verify new email
5. **Subcontractor Assignment Email** - Notify sub of project assignment

---

*This document outlines the complete feature requirements for the next development phase.*
