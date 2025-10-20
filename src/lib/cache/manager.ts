import { createHash } from "crypto";
import { config } from "@/lib/config";
import { logger } from "@/lib/utils/logger";

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheStats {
  totalKeys: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage?: number;
}

/**
 * Abstract cache interface
 */
export abstract class CacheAdapter {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract clear(): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
  abstract getStats(): Promise<CacheStats>;
  abstract close(): Promise<void>;
}

/**
 * In-memory cache implementation for development/fallback
 */
class MemoryCache extends CacheAdapter {
  private cache = new Map<string, CacheEntry>();
  private stats = { hits: 0, misses: 0 };

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data as T;
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 3600
  ): Promise<void> {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds,
      hits: 0,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      totalKeys: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  async close(): Promise<void> {
    this.cache.clear();
  }

  private getMemoryUsage(): number {
    let size = 0;
    this.cache.forEach((entry, key) => {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2;
      size += 32; // Approximate overhead
    });
    return size;
  }
}

/**
 * Redis cache implementation for production
 */
class RedisCache extends CacheAdapter {
  private client: any;
  private isConnected = false;
  private stats = { hits: 0, misses: 0 };

  constructor() {
    super();
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // Import Redis only when needed
      const { Redis } = await import("ioredis");

      if (!config.cache.redisUrl) {
        throw new Error("Redis URL not configured");
      }

      this.client = new Redis(config.cache.redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        logger.info("Redis cache connected");
      });

      this.client.on("error", (error: Error) => {
        logger.error("Redis cache error", { error: error.message });
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error("Failed to initialize Redis cache", { error });
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;

      const data = await this.client.get(key);
      if (!data) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(data);
    } catch (error) {
      logger.error("Redis get error", { key, error });
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 3600
  ): Promise<void> {
    try {
      if (!this.isConnected) return;

      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      logger.error("Redis set error", { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.del(key);
    } catch (error) {
      logger.error("Redis delete error", { key, error });
    }
  }

  async clear(): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.flushdb();
      this.stats = { hits: 0, misses: 0 };
    } catch (error) {
      logger.error("Redis clear error", { error });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Redis exists error", { key, error });
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      if (!this.isConnected) {
        return {
          totalKeys: 0,
          totalHits: this.stats.hits,
          totalMisses: this.stats.misses,
          hitRate: 0,
        };
      }

      const info = await this.client.info("keyspace");
      const dbInfo = info.match(/db0:keys=(\d+)/);
      const totalKeys = dbInfo ? parseInt(dbInfo[1]) : 0;

      const totalRequests = this.stats.hits + this.stats.misses;

      return {
        totalKeys,
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      };
    } catch (error) {
      logger.error("Redis stats error", { error });
      return {
        totalKeys: 0,
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        hitRate: 0,
      };
    }
  }

  async close(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
      }
    } catch (error) {
      logger.error("Redis close error", { error });
    }
  }
}

/**
 * Cache manager that handles both Redis and memory cache
 */
export class CacheManager {
  private adapter: CacheAdapter;

  constructor() {
    if (config.cache.enabled && config.cache.redisUrl && config.isProduction) {
      try {
        this.adapter = new RedisCache();
        logger.info("Using Redis cache");
      } catch (error) {
        logger.warn(
          "Failed to initialize Redis, falling back to memory cache",
          { error }
        );
        this.adapter = new MemoryCache();
      }
    } else {
      this.adapter = new MemoryCache();
      logger.info("Using in-memory cache");
    }
  }

  /**
   * Generate a cache key from prompt and options
   */
  generateKey(prompt: string, options: Record<string, any> = {}): string {
    const content = JSON.stringify({ prompt, options });
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Get cached response
   */
  async get<T>(key: string): Promise<T | null> {
    return this.adapter.get<T>(key);
  }

  /**
   * Cache a response
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || config.cache.defaultTtl;
    return this.adapter.set(key, value, ttl);
  }

  /**
   * Delete a cached entry
   */
  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  /**
   * Clear all cached entries
   */
  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return this.adapter.exists(key);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    return this.adapter.getStats();
  }

  /**
   * Close cache connections
   */
  async close(): Promise<void> {
    return this.adapter.close();
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
