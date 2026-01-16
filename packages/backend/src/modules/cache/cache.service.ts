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
            if (times > 2) {
              this.logger.warn('Redis connection failed, falling back to memory cache');
              return null;
            }
            return Math.min(times * 100, 2000);
          },
          maxRetriesPerRequest: 2,
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
      this.logger.error(`Failed to initialize Redis: ${error.message}`);
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
      this.logger.error(`Cache get error for key ${key}: ${error.message}`);
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
      this.logger.error(`Cache set error for key ${key}: ${error.message}`);
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
      this.logger.error(`Cache delete error for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete all keys matching a pattern
   * Note: Use sparingly as this can be expensive with many keys
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          // Batch delete for better performance
          if (keys.length > 100) {
            this.logger.warn(`Deleting ${keys.length} keys matching pattern ${pattern}`);
          }
          await this.redis.del(...keys);
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
      this.logger.error(`Cache delete pattern error for ${pattern}: ${error.message}`);
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
      this.logger.error(`Cache exists error for key ${key}: ${error.message}`);
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
      this.logger.error(`Cache clear error: ${error.message}`);
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
