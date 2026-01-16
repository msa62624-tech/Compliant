import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContractorsService } from '../contractors.service';
import { PrismaService } from '../../../config/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { InsuranceStatus } from '@compliant/shared';

describe('ContractorsService', () => {
  let service: ContractorsService;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  const mockContractor = {
    id: 'contractor-123',
    company: 'Test Company',
    email: 'test@company.com',
    phone: '555-1234',
    address: '123 Test St',
    status: 'ACTIVE',
    insuranceStatus: InsuranceStatus.COMPLIANT,
    createdById: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: {
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
    insuranceDocuments: [],
    projectContractors: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractorsService,
        {
          provide: PrismaService,
          useValue: {
            contractor: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delPattern: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContractorsService>(ContractorsService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a contractor and invalidate list cache', async () => {
      const createDto = {
        company: 'Test Company',
        email: 'test@company.com',
        phone: '555-1234',
        address: '123 Test St',
      };
      const userId = 'user-123';

      jest.spyOn(prismaService.contractor, 'create').mockResolvedValue(mockContractor as any);
      const delPatternSpy = jest.spyOn(cacheService, 'delPattern').mockResolvedValue();

      const result = await service.create(createDto as any, userId);

      expect(result).toEqual(mockContractor);
      expect(prismaService.contractor.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          createdById: userId,
        },
        include: expect.any(Object),
      });
      expect(delPatternSpy).toHaveBeenCalledWith('contractor:list:*');
    });
  });

  describe('findAll', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        data: [mockContractor],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedData);

      const result = await service.findAll();

      expect(result).toEqual(cachedData);
      expect(cacheService.get).toHaveBeenCalledWith('contractor:list:1:10:all');
      expect(prismaService.contractor.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.contractor, 'findMany').mockResolvedValue([mockContractor] as any);
      jest.spyOn(prismaService.contractor, 'count').mockResolvedValue(1);
      const setSpy = jest.spyOn(cacheService, 'set').mockResolvedValue();

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: [mockContractor],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(setSpy).toHaveBeenCalledWith(
        'contractor:list:1:10:all',
        expect.any(Object),
        300,
      );
    });

    it('should support pagination', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.contractor, 'findMany').mockResolvedValue([mockContractor] as any);
      jest.spyOn(prismaService.contractor, 'count').mockResolvedValue(25);

      await service.findAll(2, 10);

      expect(prismaService.contractor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should filter by status', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.contractor, 'findMany').mockResolvedValue([mockContractor] as any);
      jest.spyOn(prismaService.contractor, 'count').mockResolvedValue(1);

      await service.findAll(1, 10, 'ACTIVE');

      expect(prismaService.contractor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return cached contractor if available', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(mockContractor);

      const result = await service.findOne('contractor-123');

      expect(result).toEqual(mockContractor);
      expect(cacheService.get).toHaveBeenCalledWith('contractor:contractor-123');
      expect(prismaService.contractor.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.contractor, 'findUnique').mockResolvedValue(mockContractor as any);
      const setSpy = jest.spyOn(cacheService, 'set').mockResolvedValue();

      const result = await service.findOne('contractor-123');

      expect(result).toEqual(mockContractor);
      expect(setSpy).toHaveBeenCalledWith('contractor:contractor-123', mockContractor, 300);
    });

    it('should throw NotFoundException if contractor not found', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.contractor, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update contractor and invalidate caches', async () => {
      const updateDto = {
        company: 'Updated Company',
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(mockContractor);
      jest.spyOn(prismaService.contractor, 'update').mockResolvedValue({
        ...mockContractor,
        ...updateDto,
      } as any);
      const delSpy = jest.spyOn(cacheService, 'del').mockResolvedValue();
      const delPatternSpy = jest.spyOn(cacheService, 'delPattern').mockResolvedValue();

      const result = await service.update('contractor-123', updateDto as any);

      expect(result.company).toBe('Updated Company');
      expect(delSpy).toHaveBeenCalledWith('contractor:contractor-123');
      expect(delPatternSpy).toHaveBeenCalledWith('contractor:list:*');
    });

    it('should throw NotFoundException if contractor not found', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.contractor, 'findUnique').mockResolvedValue(null);

      await expect(service.update('non-existent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete contractor and invalidate caches', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(mockContractor);
      jest.spyOn(prismaService.contractor, 'delete').mockResolvedValue(mockContractor as any);
      const delSpy = jest.spyOn(cacheService, 'del').mockResolvedValue();
      const delPatternSpy = jest.spyOn(cacheService, 'delPattern').mockResolvedValue();

      const result = await service.remove('contractor-123');

      expect(result).toEqual({ message: 'Contractor deleted successfully' });
      expect(delSpy).toHaveBeenCalledWith('contractor:contractor-123');
      expect(delPatternSpy).toHaveBeenCalledWith('contractor:list:*');
    });

    it('should throw NotFoundException if contractor not found', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.contractor, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInsuranceStatus', () => {
    it('should return COMPLIANT when all documents are valid', async () => {
      const contractorWithDocs = {
        ...mockContractor,
        insuranceDocuments: [
          {
            id: 'doc-1',
            status: 'VERIFIED',
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(contractorWithDocs);

      const result = await service.getInsuranceStatus('contractor-123');

      expect(result).toHaveProperty('status', InsuranceStatus.COMPLIANT);
      expect(result.documents).toHaveLength(1);
    });

    it('should return EXPIRED when documents are expired', async () => {
      const contractorWithExpired = {
        ...mockContractor,
        insuranceDocuments: [
          {
            id: 'doc-1',
            status: 'VERIFIED',
            expirationDate: new Date(Date.now() - 1000),
          },
        ],
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(contractorWithExpired);

      const result = await service.getInsuranceStatus('contractor-123');

      expect(result).toHaveProperty('status', InsuranceStatus.EXPIRED);
    });

    it('should return NON_COMPLIANT when documents are rejected', async () => {
      const contractorWithRejected = {
        ...mockContractor,
        insuranceDocuments: [
          {
            id: 'doc-1',
            status: 'REJECTED',
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(contractorWithRejected);

      const result = await service.getInsuranceStatus('contractor-123');

      expect(result).toHaveProperty('status', InsuranceStatus.NON_COMPLIANT);
    });

    it('should return PENDING when documents are pending', async () => {
      const contractorWithPending = {
        ...mockContractor,
        insuranceDocuments: [
          {
            id: 'doc-1',
            status: 'PENDING',
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(contractorWithPending);

      const result = await service.getInsuranceStatus('contractor-123');

      expect(result).toHaveProperty('status', InsuranceStatus.PENDING);
    });

    it('should return PENDING when no documents exist', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(mockContractor);

      const result = await service.getInsuranceStatus('contractor-123');

      expect(result).toHaveProperty('status', InsuranceStatus.PENDING);
    });
  });
});
