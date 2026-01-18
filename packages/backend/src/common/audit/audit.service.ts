import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  EXPORT = 'EXPORT',
}

export enum AuditResourceType {
  USER = 'USER',
  CONTRACTOR = 'CONTRACTOR',
  PROJECT = 'PROJECT',
  PROGRAM = 'PROGRAM',
  COI = 'COI',
  HOLD_HARMLESS = 'HOLD_HARMLESS',
  INSURANCE_DOCUMENT = 'INSURANCE_DOCUMENT',
  REMINDER = 'REMINDER',
}

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Audit Service for comprehensive activity tracking
 * 
 * Features:
 * - User action logging
 * - Data change tracking
 * - Security event logging
 * - Compliance audit trail
 * 
 * Usage:
 * ```typescript
 * await this.auditService.log({
 *   userId: user.id,
 *   action: AuditAction.CREATE,
 *   resourceType: AuditResourceType.CONTRACTOR,
 *   resourceId: contractor.id,
 *   details: { name: contractor.name },
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'],
 * });
 * ```
 */
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      const auditLog = {
        userId: entry.userId || null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId || null,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        timestamp: new Date(),
      };

      // Store in database if audit log table exists
      // Otherwise, log to console for development
      console.log('[AUDIT]', JSON.stringify(auditLog, null, 2));

      // In production, you would:
      // await this.prisma.auditLog.create({ data: auditLog });
    } catch (error) {
      // Don't throw errors from audit logging to avoid disrupting main operations
      console.error('[AUDIT ERROR]', error);
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(
    userId: string,
    action: AuditAction.LOGIN | AuditAction.LOGOUT,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: AuditResourceType.USER,
      resourceId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log data access events
   */
  async logAccess(
    userId: string,
    resourceType: AuditResourceType,
    resourceId: string,
    details?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.READ,
      resourceType,
      resourceId,
      details,
    });
  }

  /**
   * Log data modification events
   */
  async logModification(
    userId: string,
    action: AuditAction.CREATE | AuditAction.UPDATE | AuditAction.DELETE,
    resourceType: AuditResourceType,
    resourceId: string,
    details?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType,
      resourceId,
      details,
    });
  }

  /**
   * Log security-sensitive events
   */
  async logSecurityEvent(
    userId: string | undefined,
    action: AuditAction,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: AuditResourceType.USER,
      details: {
        ...details,
        securityEvent: true,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Query audit logs (for compliance reporting)
   */
  async queryLogs(filter: {
    userId?: string;
    action?: AuditAction;
    resourceType?: AuditResourceType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    // In production, implement database query:
    // return await this.prisma.auditLog.findMany({
    //   where: {
    //     userId: filter.userId,
    //     action: filter.action,
    //     resourceType: filter.resourceType,
    //     timestamp: {
    //       gte: filter.startDate,
    //       lte: filter.endDate,
    //     },
    //   },
    //   take: filter.limit || 100,
    //   orderBy: { timestamp: 'desc' },
    // });

    console.log('[AUDIT QUERY]', filter);
    return [];
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(filter: {
    startDate: Date;
    endDate: Date;
    format?: 'json' | 'csv';
  }): Promise<string> {
    const logs = await this.queryLogs({
      startDate: filter.startDate,
      endDate: filter.endDate,
      limit: 10000,
    });

    if (filter.format === 'csv') {
      // Convert to CSV format
      const headers = 'timestamp,userId,action,resourceType,resourceId,details\n';
      const rows = logs
        .map(
          (log) =>
            `${log.timestamp.toISOString()},${log.userId},${log.action},${log.resourceType},${log.resourceId},"${JSON.stringify(log.details)}"`,
        )
        .join('\n');
      return headers + rows;
    }

    // Default to JSON
    return JSON.stringify(logs, null, 2);
  }
}
