import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AuditService, AuditAction, AuditResource } from "./audit.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("Audit")
@Controller("audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Get audit logs with filters" })
  @ApiResponse({ status: 200, description: "Audit logs retrieved" })
  @ApiQuery({ name: "userId", required: false, type: String })
  @ApiQuery({ name: "action", required: false, enum: AuditAction })
  @ApiQuery({ name: "resource", required: false, enum: AuditResource })
  @ApiQuery({ name: "resourceId", required: false, type: String })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  async getAuditLogs(
    @Query("userId") userId?: string,
    @Query("action") action?: AuditAction,
    @Query("resource") resource?: AuditResource,
    @Query("resourceId") resourceId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("skip") skip?: number,
    @Query("take") take?: number,
  ) {
    return this.auditService.getAuditLogs({
      userId,
      action,
      resource,
      resourceId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get("resource")
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Get audit logs for a specific resource" })
  @ApiResponse({ status: 200, description: "Resource audit logs retrieved" })
  @ApiQuery({ name: "resource", required: true, enum: AuditResource })
  @ApiQuery({ name: "resourceId", required: true, type: String })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  async getResourceAuditLogs(
    @Query("resource") resource: AuditResource,
    @Query("resourceId") resourceId: string,
    @Query("skip") skip?: number,
    @Query("take") take?: number,
  ) {
    return this.auditService.getResourceAuditLogs(resource, resourceId, {
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get("user")
  @ApiOperation({ summary: "Get audit logs for a specific user" })
  @ApiResponse({ status: 200, description: "User audit logs retrieved" })
  @ApiQuery({ name: "userId", required: true, type: String })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  async getUserAuditLogs(
    @Query("userId") userId: string,
    @Query("skip") skip?: number,
    @Query("take") take?: number,
  ) {
    return this.auditService.getUserAuditLogs(userId, {
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }
}
