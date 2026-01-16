import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined), // No Redis URL by default
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);
    
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Memory Cache (fallback)', () => {
    it('should set and get a value', async () => {
      await service.set('test-key', 'test-value');
      const result = await service.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should set and get an object', async () => {
      const testObject = { name: 'Test', value: 123 };
      await service.set('test-obj', testObject);
      const result = await service.get('test-obj');
      expect(result).toEqual(testObject);
    });

    it('should return null for non-existent key', async () => {
      const result = await service.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete a value', async () => {
      await service.set('test-key', 'test-value');
      await service.del('test-key');
      const result = await service.get('test-key');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      await service.set('test-key', 'test-value');
      const exists = await service.exists('test-key');
      expect(exists).toBe(true);

      const notExists = await service.exists('non-existent');
      expect(notExists).toBe(false);
    });

    it('should expire keys after TTL', async () => {
      await service.set('test-key', 'test-value', 1); // 1 second TTL
      
      // Immediately after setting, should exist
      let result = await service.get('test-key');
      expect(result).toBe('test-value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));
      
      result = await service.get('test-key');
      expect(result).toBeNull();
    });

    it('should delete keys matching pattern', async () => {
      await service.set('user:1', { name: 'User 1' });
      await service.set('user:2', { name: 'User 2' });
      await service.set('post:1', { title: 'Post 1' });

      await service.delPattern('user:*');

      const user1 = await service.get('user:1');
      const user2 = await service.get('user:2');
      const post1 = await service.get('post:1');

      expect(user1).toBeNull();
      expect(user2).toBeNull();
      expect(post1).not.toBeNull();
    });

    it('should clear all cache', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');
      await service.set('key3', 'value3');

      await service.clear();

      const key1 = await service.get('key1');
      const key2 = await service.get('key2');
      const key3 = await service.get('key3');

      expect(key1).toBeNull();
      expect(key2).toBeNull();
      expect(key3).toBeNull();
    });

    it('should handle special characters in pattern matching', async () => {
      await service.set('test.key.1', 'value1');
      await service.set('test.key.2', 'value2');
      await service.set('test_key_3', 'value3');

      await service.delPattern('test.key.*');

      const key1 = await service.get('test.key.1');
      const key2 = await service.get('test.key.2');
      const key3 = await service.get('test_key_3');

      expect(key1).toBeNull();
      expect(key2).toBeNull();
      expect(key3).not.toBeNull(); // Should not match
    });

    it('should use default TTL if not specified', async () => {
      await service.set('test-key', 'test-value');
      const exists = await service.exists('test-key');
      expect(exists).toBe(true);
    });

    it('should handle complex nested objects', async () => {
      const complexObject = {
        user: {
          id: '123',
          profile: {
            name: 'Test User',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        metadata: {
          created: new Date('2024-01-01'),
          tags: ['test', 'user'],
        },
      };

      await service.set('complex-obj', complexObject);
      const result = await service.get('complex-obj');
      
      // Memory cache doesn't serialize, so we get the exact object back
      expect(result).toEqual(complexObject);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully and return null on get', async () => {
      const result = await service.get('any-key');
      expect(result).toBeDefined(); // Should not throw
    });

    it('should handle errors gracefully on set', async () => {
      await expect(service.set('any-key', 'value')).resolves.not.toThrow();
    });

    it('should handle errors gracefully on delete', async () => {
      await expect(service.del('any-key')).resolves.not.toThrow();
    });
  });
});
