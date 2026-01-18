import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { PrismaService } from "../../config/prisma.service";

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  VIEW = "VIEW",
  DOWNLOAD = "DOWNLOAD",
  UPLOAD = "UPLOAD",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export enum AuditResource {
  USER = "USER",
  CONTRACTOR = "CONTRACTOR",
  PROJECT = "PROJECT",
  INSURANCE_DOCUMENT = "INSURANCE_DOCUMENT",
  COI = "COI",
  SYSTEM = "SYSTEM",
}

export interface AuditLogData {
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Log an audit event
   * Records both to database and structured logs
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      // Sanitize metadata to remove sensitive information
      const sanitizedMetadata = this.sanitizeMetadata(data.metadata);

      // Log to structured logger
      this.logger.log({
        message: `Audit: ${data.action} ${data.resource}`,
        context: "Audit",
        ...data,
        metadata: sanitizedMetadata,
      });

      // Store in database
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          changes: data.changes || {},
          metadata: sanitizedMetadata || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent ? data.userAgent.substring(0, 200) : null,
        },
      });
    } catch (error) {
      // Don't fail the request if audit logging fails, but log the error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error({
        message: "Failed to create audit log",
        context: "Audit",
        error: errorMessage,
        stack: errorStack,
        auditData: data,
      });
    }
  }

  /**
   * Sanitize metadata to remove sensitive information
   */
  private sanitizeMetadata(metadata: any): any {
    if (!metadata) return {};

    // Remove sensitive fields
    const sanitized = { ...metadata };
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "apiKey",
      "authorization",
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    }

    return sanitized;
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(
    resource: AuditResource,
    resourceId: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        resource,
        resourceId,
      },
      orderBy: {
        timestamp: "desc",
      },
      skip: options?.skip || 0,
      take: options?.take || 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        timestamp: "desc",
      },
      skip: options?.skip || 0,
      take: options?.take || 50,
    });
  }

  /**
   * Get all audit logs with filters
   */
  async getAuditLogs(filters?: AuditLogFilters) {
    const where: {
      userId?: string;
      action?: string;
      resource?: string;
      resourceId?: string;
      timestamp?: { gte?: Date; lte?: Date };
    } = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.resourceId) where.resourceId = filters.resourceId;

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      skip: filters?.skip || 0,
      take: filters?.take || 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }
}
