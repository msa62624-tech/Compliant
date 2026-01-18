import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AuditAction, AuditResourceType } from './audit.service';
import { PrismaService } from '../../config/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            // Mock PrismaService
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log an audit entry', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.log({
        userId: 'user-123',
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.CONTRACTOR,
        resourceId: 'contractor-456',
        details: { name: 'Test Contractor' },
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Test error');
      });

      await service.log({
        userId: 'user-123',
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.CONTRACTOR,
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('logAuth', () => {
    it('should log authentication events', async () => {
      const logSpy = jest.spyOn(service, 'log').mockResolvedValue();

      await service.logAuth('user-123', AuditAction.LOGIN, '127.0.0.1', 'Test Agent');

      expect(logSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.USER,
        resourceId: 'user-123',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      });

      logSpy.mockRestore();
    });
  });

  describe('logAccess', () => {
    it('should log data access events', async () => {
      const logSpy = jest.spyOn(service, 'log').mockResolvedValue();

      await service.logAccess(
        'user-123',
        AuditResourceType.CONTRACTOR,
        'contractor-456',
        { action: 'view' },
      );

      expect(logSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        action: AuditAction.READ,
        resourceType: AuditResourceType.CONTRACTOR,
        resourceId: 'contractor-456',
        details: { action: 'view' },
      });

      logSpy.mockRestore();
    });
  });

  describe('logModification', () => {
    it('should log data modification events', async () => {
      const logSpy = jest.spyOn(service, 'log').mockResolvedValue();

      await service.logModification(
        'user-123',
        AuditAction.UPDATE,
        AuditResourceType.CONTRACTOR,
        'contractor-456',
        { field: 'name', oldValue: 'Old Name', newValue: 'New Name' },
      );

      expect(logSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.CONTRACTOR,
        resourceId: 'contractor-456',
        details: { field: 'name', oldValue: 'Old Name', newValue: 'New Name' },
      });

      logSpy.mockRestore();
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security-sensitive events', async () => {
      const logSpy = jest.spyOn(service, 'log').mockResolvedValue();

      await service.logSecurityEvent(
        'user-123',
        AuditAction.LOGIN,
        { attemptCount: 3, success: false },
        '127.0.0.1',
        'Test Agent',
      );

      expect(logSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.USER,
        details: { attemptCount: 3, success: false, securityEvent: true },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      });

      logSpy.mockRestore();
    });
  });

  describe('queryLogs', () => {
    it('should query audit logs with filters', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.queryLogs({
        userId: 'user-123',
        action: AuditAction.CREATE,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      });

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('exportLogs', () => {
    it('should export logs in JSON format', async () => {
      const result = await service.exportLogs({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        format: 'json',
      });

      expect(result).toBe('[]');
    });

    it('should export logs in CSV format', async () => {
      const result = await service.exportLogs({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        format: 'csv',
      });

      expect(result).toContain('timestamp,userId,action,resourceType,resourceId,details');
    });
  });
});
