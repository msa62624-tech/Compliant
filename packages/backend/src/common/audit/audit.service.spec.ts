import { Test, TestingModule } from "@nestjs/testing";
import { AuditService, AuditAction, AuditResourceType } from "./audit.service";
import { PrismaService } from "../../config/prisma.service";

describe("AuditService", () => {
  let service: AuditService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("log", () => {
    it("should log an audit entry to database", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const createSpy = jest
        .spyOn(prismaService.auditLog, "create")
        .mockResolvedValue({} as any);

      await service.log({
        userId: "user-123",
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.CONTRACTOR,
        resourceId: "contractor-456",
        details: { name: "Test Contractor" },
      });

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuditAction.CREATE,
          resource: AuditResourceType.CONTRACTOR,
          resourceId: "contractor-456",
        }),
      });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log anonymous events to database", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const createSpy = jest
        .spyOn(prismaService.auditLog, "create")
        .mockResolvedValue({} as any);

      await service.log({
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.USER,
        details: {
          attemptCount: 1,
          success: false,
          reason: "Invalid credentials",
        },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
      });

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          action: AuditAction.LOGIN,
          resource: AuditResourceType.USER,
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
        }),
      });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const createSpy = jest
        .spyOn(prismaService.auditLog, "create")
        .mockRejectedValue(new Error("Test error"));

      await service.log({
        userId: "user-123",
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.CONTRACTOR,
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
      createSpy.mockRestore();
    });
  });

  describe("logAuth", () => {
    it("should log authentication events", async () => {
      const logSpy = jest.spyOn(service, "log").mockResolvedValue();

      await service.logAuth(
        "user-123",
        AuditAction.LOGIN,
        "127.0.0.1",
        "Test Agent",
      );

      expect(logSpy).toHaveBeenCalledWith({
        userId: "user-123",
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.USER,
        resourceId: "user-123",
        ipAddress: "127.0.0.1",
        userAgent: "Test Agent",
      });

      logSpy.mockRestore();
    });
  });

  describe("logAccess", () => {
    it("should log data access events", async () => {
      const logSpy = jest.spyOn(service, "log").mockResolvedValue();

      await service.logAccess(
        "user-123",
        AuditResourceType.CONTRACTOR,
        "contractor-456",
        { action: "view" },
      );

      expect(logSpy).toHaveBeenCalledWith({
        userId: "user-123",
        action: AuditAction.READ,
        resourceType: AuditResourceType.CONTRACTOR,
        resourceId: "contractor-456",
        details: { action: "view" },
      });

      logSpy.mockRestore();
    });
  });

  describe("logModification", () => {
    it("should log data modification events", async () => {
      const logSpy = jest.spyOn(service, "log").mockResolvedValue();

      await service.logModification(
        "user-123",
        AuditAction.UPDATE,
        AuditResourceType.CONTRACTOR,
        "contractor-456",
        { field: "name", oldValue: "Old Name", newValue: "New Name" },
      );

      expect(logSpy).toHaveBeenCalledWith({
        userId: "user-123",
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.CONTRACTOR,
        resourceId: "contractor-456",
        details: { field: "name", oldValue: "Old Name", newValue: "New Name" },
      });

      logSpy.mockRestore();
    });
  });

  describe("logSecurityEvent", () => {
    it("should log security-sensitive events", async () => {
      const logSpy = jest.spyOn(service, "log").mockResolvedValue();

      await service.logSecurityEvent(
        "user-123",
        AuditAction.LOGIN,
        { attemptCount: 3, success: false },
        "127.0.0.1",
        "Test Agent",
      );

      expect(logSpy).toHaveBeenCalledWith({
        userId: "user-123",
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.USER,
        details: { attemptCount: 3, success: false, securityEvent: true },
        ipAddress: "127.0.0.1",
        userAgent: "Test Agent",
      });

      logSpy.mockRestore();
    });

    it("should log anonymous security events (failed login attempts)", async () => {
      const logSpy = jest.spyOn(service, "log").mockResolvedValue();

      await service.logSecurityEvent(
        undefined,
        AuditAction.LOGIN,
        { attemptCount: 5, success: false, reason: "Invalid credentials" },
        "192.168.1.100",
        "Mozilla/5.0",
      );

      expect(logSpy).toHaveBeenCalledWith({
        userId: undefined,
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.USER,
        details: {
          attemptCount: 5,
          success: false,
          reason: "Invalid credentials",
          securityEvent: true,
        },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
      });

      logSpy.mockRestore();
    });
  });

  describe("queryLogs", () => {
    it("should query audit logs with filters from database", async () => {
      const mockLogs = [
        {
          id: "1",
          userId: "user-123",
          action: AuditAction.CREATE,
          resource: AuditResourceType.CONTRACTOR,
          resourceId: "contractor-456",
          changes: { name: "Test Contractor" },
          metadata: null,
          ipAddress: "127.0.0.1",
          userAgent: "Test Agent",
          timestamp: new Date("2026-01-15"),
        },
      ];

      const findManySpy = jest
        .spyOn(prismaService.auditLog, "findMany")
        .mockResolvedValue(mockLogs as any);

      const result = await service.queryLogs({
        userId: "user-123",
        action: AuditAction.CREATE,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
      });

      expect(findManySpy).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          action: AuditAction.CREATE,
          resource: undefined,
          timestamp: {
            gte: new Date("2026-01-01"),
            lte: new Date("2026-12-31"),
          },
        },
        take: 100,
        orderBy: { timestamp: "desc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("user-123");
    });
  });

  describe("exportLogs", () => {
    it("should export logs in JSON format", async () => {
      jest.spyOn(prismaService.auditLog, "findMany").mockResolvedValue([]);

      const result = await service.exportLogs({
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        format: "json",
      });

      expect(result).toBe("[]");
    });

    it("should export logs in CSV format", async () => {
      jest.spyOn(prismaService.auditLog, "findMany").mockResolvedValue([]);

      const result = await service.exportLogs({
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        format: "csv",
      });

      expect(result).toContain(
        "timestamp,userId,action,resourceType,resourceId,details",
      );
    });
  });
});
