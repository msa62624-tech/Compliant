# Compliance and Data Governance Guide

## Overview

This document outlines compliance measures, data retention policies, and GDPR implementation for the Compliant Platform.

## 1. Regulatory Compliance

### Applicable Regulations

#### GDPR (General Data Protection Regulation)
- **Applies to**: EU citizens' data
- **Key Requirements**:
  - Right to access
  - Right to deletion
  - Right to data portability
  - Consent management
  - Data breach notification

#### SOC 2 (Service Organization Control 2)
- **Trust Service Criteria**:
  - Security
  - Availability
  - Processing Integrity
  - Confidentiality
  - Privacy

#### PCI DSS (if handling payment data)
- **Requirements**:
  - Secure network
  - Encrypt cardholder data
  - Access control
  - Regular monitoring

## 2. Data Classification

### Sensitive Data (High Protection)
- **Personal Identifiable Information (PII)**:
  - Social Security Numbers (SSN)
  - Tax IDs
  - Driver's License Numbers
  - Bank Account Information

- **Authentication Data**:
  - Passwords (hashed)
  - JWT tokens (in httpOnly cookies)
  - API keys

- **Insurance Documents**:
  - Policy numbers
  - Coverage details
  - Claims information

**Protection Measures**:
- ✅ Field-level encryption (implemented)
- ✅ httpOnly cookies for auth (implemented)
- ✅ Audit logging (implemented)
- Database encryption at rest (infrastructure)
- TLS in transit (infrastructure)

### Confidential Data (Medium Protection)
- Email addresses
- Phone numbers
- Company names
- Contractor details
- Project information

**Protection Measures**:
- Access control (RBAC)
- Audit logging
- Secure transmission

### Public Data (Low Protection)
- User names (first/last)
- Public company information
- General system metadata

## 3. Data Retention Policies

### Retention Periods

#### User Data
```
Active Users: Retained indefinitely
Inactive Users (>2 years): Anonymize after 30 days notice
Deleted Account Requests: Delete within 30 days
```

#### Audit Logs
```
Security Events: 7 years
Access Logs: 1 year
System Logs: 90 days
```

#### Business Data
```
Active Contractors: Retained while active
Inactive Contractors: Archive after 3 years
Insurance Documents: Retain for 7 years after expiration
Projects: Archive after 5 years of completion
```

#### Backup Data
```
Database Backups: 30 days
File Backups: 90 days
```

### Implementation

Create `packages/backend/src/modules/retention/retention.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run daily at 2 AM to archive old data
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async archiveOldData() {
    this.logger.log('Starting data archival process');
    
    try {
      await this.archiveOldAuditLogs();
      await this.archiveInactiveContractors();
      await this.archiveCompletedProjects();
      
      this.logger.log('Data archival completed successfully');
    } catch (error) {
      this.logger.error(`Data archival failed: ${error.message}`);
    }
  }

  private async archiveOldAuditLogs() {
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() - 7);
    
    // Move to cold storage or delete based on policy
    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: retentionDate,
        },
      },
    });
    
    this.logger.log(`Archived ${result.count} old audit logs`);
  }

  private async archiveInactiveContractors() {
    const inactiveDate = new Date();
    inactiveDate.setFullYear(inactiveDate.getFullYear() - 3);
    
    // Mark as archived instead of deleting
    const result = await this.prisma.contractor.updateMany({
      where: {
        status: 'INACTIVE',
        updatedAt: {
          lt: inactiveDate,
        },
      },
      data: {
        // Add archived field to schema
        // archived: true,
      },
    });
    
    this.logger.log(`Archived ${result.count} inactive contractors`);
  }

  private async archiveCompletedProjects() {
    const completionDate = new Date();
    completionDate.setFullYear(completionDate.getFullYear() - 5);
    
    // Archive projects completed > 5 years ago
    // Implementation depends on business requirements
    this.logger.log('Project archival completed');
  }
}
```

## 4. GDPR Implementation

### Right to Access

Create endpoint to export user's data:

```typescript
// packages/backend/src/modules/users/users.controller.ts

@Get(':id/export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
async exportUserData(@Param('id') userId: string, @GetUser('id') requestUserId: string) {
  // Users can only export their own data unless admin
  if (userId !== requestUserId && !this.isAdmin(requestUserId)) {
    throw new UnauthorizedException();
  }

  const userData = await this.usersService.exportUserData(userId);
  return userData;
}
```

### Right to Deletion (Right to be Forgotten)

```typescript
// packages/backend/src/modules/users/users.service.ts

async deleteUserData(userId: string) {
  // Anonymize user data instead of hard delete (for audit trail)
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${userId}@anonymous.local`,
      firstName: 'Deleted',
      lastName: 'User',
      isActive: false,
      deletedAt: new Date(),
    },
  });

  // Delete or anonymize related data
  await this.anonymizeContractorData(userId);
  await this.anonymizeAuditLogs(userId);
}
```

### Consent Management

Add consent tracking:

```prisma
// packages/backend/prisma/schema.prisma

model UserConsent {
  id String @id @default(uuid())
  userId String
  user User @relation(fields: [userId], references: [id])
  
  consentType String  // marketing, analytics, etc.
  granted Boolean
  grantedAt DateTime @default(now())
  revokedAt DateTime?
  
  @@index([userId])
}
```

### Data Breach Notification

Create incident response plan:

```typescript
// packages/backend/src/modules/security/breach-notification.service.ts

@Injectable()
export class BreachNotificationService {
  private readonly logger = new Logger(BreachNotificationService.name);

  async notifyBreach(breachDetails: BreachDetails) {
    // Log the breach
    this.logger.error('Security breach detected', breachDetails);
    
    // Notify affected users within 72 hours (GDPR requirement)
    await this.notifyAffectedUsers(breachDetails);
    
    // Notify data protection authority
    await this.notifyAuthority(breachDetails);
    
    // Document the breach
    await this.documentBreach(breachDetails);
  }
}
```

## 5. Access Control and Permissions

### Role-Based Access Control (RBAC)

Already implemented with roles:
- ADMIN: Full system access
- MANAGER: Manage contractors and projects
- USER: Limited access
- CONTRACTOR: Self-service portal
- BROKER: Insurance broker portal

### Field-Level Access Control

Implement data masking for sensitive fields:

```typescript
// packages/backend/src/common/decorators/mask-sensitive.decorator.ts

export function MaskSensitive() {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Mask sensitive fields based on user role
      if (!this.isAdmin()) {
        result.ssn = result.ssn ? '***-**-****' : null;
        result.taxId = result.taxId ? '**-*******' : null;
      }
      
      return result;
    };
    
    return descriptor;
  };
}
```

## 6. Audit and Compliance Reporting

### Audit Reports

Create compliance reports:

```typescript
// packages/backend/src/modules/compliance/compliance.service.ts

@Injectable()
export class ComplianceService {
  async generateAccessReport(startDate: Date, endDate: Date) {
    // Report all data access within date range
    const accessLogs = await this.prisma.auditLog.findMany({
      where: {
        action: 'VIEW',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    return this.formatReport(accessLogs);
  }

  async generateChangeReport(startDate: Date, endDate: Date) {
    // Report all data modifications
    const changeLogs = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: ['CREATE', 'UPDATE', 'DELETE'],
        },
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    return this.formatReport(changeLogs);
  }
}
```

## 7. Data Backup and Recovery

### Backup Strategy

#### Database Backups
```bash
# Daily automated backups
pg_dump -U postgres -d compliant_prod > backup_$(date +%Y%m%d).sql

# Retention: 30 days
# Location: S3 or similar with encryption
```

#### File Backups
```bash
# Backup uploaded files (insurance documents, etc.)
aws s3 sync ./uploads s3://compliant-backups/uploads-$(date +%Y%m%d)/
```

### Recovery Testing
- Test restores monthly
- Document recovery procedures
- Maintain Recovery Time Objective (RTO) < 4 hours
- Maintain Recovery Point Objective (RPO) < 1 hour

## 8. Privacy by Design

### Data Minimization
- Only collect necessary data
- Don't store credit card numbers (use payment processor)
- Delete temporary data promptly

### Encryption
- ✅ Field-level encryption for PII (implemented)
- ✅ Password hashing with bcrypt (implemented)
- Database encryption at rest (infrastructure)
- TLS 1.3 for data in transit (infrastructure)

### Anonymization
- Remove identifying information from analytics
- Aggregate data for reporting
- Use pseudonyms in logs when possible

## 9. Third-Party Data Processing

### Data Processing Agreements (DPA)

Required for:
- Cloud providers (AWS, Azure, GCP)
- Email services (SendGrid)
- Analytics providers
- Payment processors

### Sub-processor Management
- Maintain list of all sub-processors
- Document their data access
- Ensure they comply with regulations

## 10. Employee Training

### Security Awareness
- Annual security training
- Phishing awareness
- Password best practices
- Incident reporting procedures

### Compliance Training
- GDPR fundamentals
- Data handling procedures
- Privacy requirements
- Breach notification process

## 11. Documentation Requirements

### Privacy Policy
- What data is collected
- How it's used
- How long it's retained
- User rights
- Contact information

### Terms of Service
- Acceptable use
- User responsibilities
- Service limitations
- Termination conditions

### Cookie Policy
- What cookies are used
- Purpose of cookies
- How to opt-out

## 12. Compliance Checklist

### GDPR Compliance
- [ ] Privacy policy published
- [ ] Cookie consent banner
- [ ] Data export functionality
- [ ] Right to deletion
- [ ] Data retention policies
- [ ] Breach notification procedures
- [ ] Data processing agreements
- [ ] Security measures documented

### SOC 2 Compliance
- [ ] Security controls documented
- [ ] Access controls implemented
- [ ] Audit logging enabled
- [ ] Incident response plan
- [ ] Change management process
- [ ] Vendor management
- [ ] Business continuity plan

### General Security
- [x] Authentication (JWT with httpOnly cookies)
- [x] Authorization (RBAC)
- [x] Encryption (field-level + TLS)
- [x] Audit logging
- [x] Health monitoring
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Security code reviews

## 13. Incident Response Plan

### Phases
1. **Detection**: Identify security incident
2. **Containment**: Limit the damage
3. **Eradication**: Remove the threat
4. **Recovery**: Restore normal operations
5. **Lessons Learned**: Document and improve

### Response Team
- Security Officer (lead)
- Development Team
- Operations Team
- Legal/Compliance
- Communications

## 14. Regular Reviews

### Quarterly
- Access control review
- Audit log review
- Security patch review
- Compliance checklist review

### Annual
- Security audit
- Penetration testing
- Privacy policy review
- Data retention review
- Employee training

## Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [SOC 2 Requirements](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Controls](https://www.cisecurity.org/controls)
