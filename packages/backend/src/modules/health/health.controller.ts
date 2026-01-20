import { Controller, Get, Version } from "@nestjs/common";
import {
  HealthCheckService,
  HttpHealthIndicator,
  PrismaHealthIndicator,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from "@nestjs/terminus";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PrismaService } from "../../config/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Check application health" })
  @ApiResponse({ status: 200, description: "Health check passed" })
  @ApiResponse({ status: 503, description: "Health check failed" })
  check() {
    return this.health.check([
      // Database health check
      () => this.prismaHealth.pingCheck("database", this.prisma),

      // Memory health check (heap should not exceed 300MB)
      () => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024),

      // Memory RSS check (should not exceed 500MB)
      () => this.memory.checkRSS("memory_rss", 500 * 1024 * 1024),

      // Disk health check (should not exceed 90% usage, i.e., at least 10% free space)
      // Note: Using 90% threshold (0.9) to allow for CI/test environments with limited disk space
      () =>
        this.disk.checkStorage("disk", {
          path: "/",
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get("liveness")
  @ApiOperation({ summary: "Liveness probe - checks if app is running" })
  @ApiResponse({ status: 200, description: "App is alive" })
  liveness() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Get("readiness")
  @HealthCheck()
  @ApiOperation({
    summary: "Readiness probe - checks if app is ready to accept traffic",
  })
  @ApiResponse({ status: 200, description: "App is ready" })
  @ApiResponse({ status: 503, description: "App is not ready" })
  readiness() {
    return this.health.check([
      // Only check critical services for readiness
      () => this.prismaHealth.pingCheck("database", this.prisma),
    ]);
  }
}
