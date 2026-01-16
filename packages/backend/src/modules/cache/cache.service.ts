import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * CacheService provides Redis-based caching functionality
 * with fallback to in-memory cache when Redis is unavailable
 */
@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          retryStrategy: (times) => {
            if (times > 5) {
              this.logger.warn('Redis connection failed after 5 retries, falling back to memory cache');
              return null;
            }
            // Linear backoff with cap: 100ms, 200ms, 300ms, 400ms, 500ms (capped at 2000ms)
            return Math.min(times * 100, 2000);
          },
          maxRetriesPerRequest: 5,
        });

        this.redis.on('connect', () => {
          this.logger.log('Redis connected successfully');
        });

        this.redis.on('error', (err) => {
          this.logger.error(`Redis error: ${err.message}`);
        });
      } else {
        this.logger.warn('REDIS_URL not configured, using in-memory cache');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to initialize Redis: ${message}`);
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return this.getFromMemory(key);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Cache get error for key ${key}: ${message}`);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const ttlSeconds = ttl || this.DEFAULT_TTL;
      
      if (this.redis) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        this.setInMemory(key, value, ttlSeconds);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Cache set error for key ${key}: ${message}`);
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Cache delete error for key ${key}: ${message}`);
    }
  }

  /**
   * Delete all keys matching a pattern
   * Uses non-blocking SCAN to avoid production issues with large datasets
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        let cursor = '0';
        let totalDeleted = 0;
        
        // Use SCAN to iterate through keys without blocking
        do {
          const [nextCursor, keys] = await this.redis.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            100
          );
          
          cursor = nextCursor;
          
          // Delete keys immediately after each SCAN iteration
          if (keys.length > 0) {
            await this.redis.del(...keys);
            totalDeleted += keys.length;
            this.logger.debug(`Deleted batch of ${keys.length} keys matching pattern ${pattern}`);
          }
        } while (cursor !== '0');
        
        if (totalDeleted > 0) {
          this.logger.log(`Deleted total of ${totalDeleted} keys matching pattern ${pattern}`);
        }
      } else {
        // For memory cache, use simple pattern matching
        // Escape special regex characters except *
        const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('^' + escapedPattern.replace(/\*/g, '.*') + '$');
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Cache delete pattern error for ${pattern}: ${message}`);
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.redis) {
        const result = await this.redis.exists(key);
        return result === 1;
      } else {
        return this.memoryCache.has(key) && this.memoryCache.get(key)!.expiry > Date.now();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Cache exists error for key ${key}: ${message}`);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushdb();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Cache clear error: ${message}`);
    }
  }

  // Memory cache helpers
  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    if (cached.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  private setInMemory(key: string, value: any, ttlSeconds: number): void {
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }
}
