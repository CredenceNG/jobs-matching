import { cacheManager } from "./manager";
import { logger } from "@/lib/utils/logger";
import { config } from "@/lib/config";

export interface CachedAIResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: "anthropic" | "openai";
  timestamp: number;
  hitCount: number;
}

export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  preferProvider?: "anthropic" | "openai";
  useCache?: boolean;
  cacheTtl?: number;
}

/**
 * AI cache service that provides intelligent caching for AI responses
 */
export class AICacheService {
  private readonly keyPrefix = "ai:";

  /**
   * Generate a cache key for an AI request
   */
  generateCacheKey(
    prompt: string,
    options: Omit<AIRequestOptions, "useCache" | "cacheTtl"> = {}
  ): string {
    // Normalize options for consistent caching
    const normalizedOptions = {
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      model: options.model || config.ai.defaultModel,
      preferProvider: options.preferProvider,
    };

    const cacheData = {
      prompt: prompt.trim(),
      options: normalizedOptions,
    };

    const key = cacheManager.generateKey(JSON.stringify(cacheData));
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Get cached AI response
   */
  async get(cacheKey: string): Promise<CachedAIResponse | null> {
    try {
      const cached = await cacheManager.get<CachedAIResponse>(cacheKey);

      if (cached) {
        // Increment hit count
        cached.hitCount = (cached.hitCount || 0) + 1;

        // Update cache with new hit count (short TTL to avoid overhead)
        await cacheManager.set(cacheKey, cached, 300);

        logger.info("AI cache hit", {
          cacheKey: cacheKey.substring(0, 16) + "...",
          model: cached.model,
          provider: cached.provider,
          hitCount: cached.hitCount,
          tokensSaved: cached.usage.totalTokens,
        });

        return cached;
      }

      return null;
    } catch (error) {
      logger.error("AI cache get error", { cacheKey, error });
      return null;
    }
  }

  /**
   * Cache AI response
   */
  async set(
    cacheKey: string,
    response: {
      content: string;
      usage: { inputTokens: number; outputTokens: number; totalTokens: number };
      model: string;
      provider: "anthropic" | "openai";
    },
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const cachedResponse: CachedAIResponse = {
        ...response,
        timestamp: Date.now(),
        hitCount: 0,
      };

      const ttl = ttlSeconds || config.ai.cacheTtlHours * 3600;
      await cacheManager.set(cacheKey, cachedResponse, ttl);

      logger.info("AI response cached", {
        cacheKey: cacheKey.substring(0, 16) + "...",
        model: response.model,
        provider: response.provider,
        tokens: response.usage.totalTokens,
        ttl,
      });
    } catch (error) {
      logger.error("AI cache set error", { cacheKey, error });
    }
  }

  /**
   * Check if response is cacheable based on content and settings
   */
  isCacheable(
    prompt: string,
    response: string,
    options: AIRequestOptions = {}
  ): boolean {
    // Don't cache if explicitly disabled
    if (options.useCache === false) {
      return false;
    }

    // Don't cache very short responses (likely errors)
    if (response.length < 50) {
      return false;
    }

    // Don't cache high-temperature responses (more creative/random)
    if ((options.temperature || 0.7) > 0.9) {
      return false;
    }

    // Don't cache prompts that contain current timestamps or random elements
    const timePatterns = [
      /\b(today|now|current|latest|recent)\b/i,
      /\b\d{4}-\d{2}-\d{2}\b/, // Date patterns
      /\b\d{1,2}:\d{2}\b/, // Time patterns
    ];

    for (const pattern of timePatterns) {
      if (pattern.test(prompt)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalCacheHits: number;
    totalCacheMisses: number;
    hitRate: number;
    estimatedTokensSaved: number;
    estimatedCostSaved: number;
  }> {
    try {
      const stats = await cacheManager.getStats();

      // Estimate cost savings (rough calculation)
      // Assuming average of $0.001 per 1K tokens
      const estimatedCostSaved = (stats.totalHits * 500 * 0.001) / 1000;

      return {
        totalCacheHits: stats.totalHits,
        totalCacheMisses: stats.totalMisses,
        hitRate: stats.hitRate,
        estimatedTokensSaved: stats.totalHits * 500, // Rough estimate
        estimatedCostSaved,
      };
    } catch (error) {
      logger.error("AI cache stats error", { error });
      return {
        totalCacheHits: 0,
        totalCacheMisses: 0,
        hitRate: 0,
        estimatedTokensSaved: 0,
        estimatedCostSaved: 0,
      };
    }
  }

  /**
   * Clear cache entries older than specified hours
   */
  async clearExpired(olderThanHours: number = 24): Promise<void> {
    try {
      // This is a simplified version - in production you'd want more sophisticated cleanup
      logger.info("Cache cleanup initiated", { olderThanHours });

      // Note: This is a basic implementation. For Redis, you'd use TTL automatically
      // For memory cache, you'd iterate through entries and check timestamps
    } catch (error) {
      logger.error("Cache cleanup error", { error });
    }
  }

  /**
   * Warm up cache with common queries
   */
  async warmup(commonPrompts: string[] = []): Promise<void> {
    logger.info("Cache warmup started", { promptCount: commonPrompts.length });

    // This would be called during app startup to pre-populate cache
    // with common queries that users frequently make

    for (const prompt of commonPrompts) {
      const cacheKey = this.generateCacheKey(prompt);
      const exists = await cacheManager.exists(cacheKey);

      if (!exists) {
        logger.debug("Cache miss during warmup", {
          prompt: prompt.substring(0, 50) + "...",
        });
        // Could pre-generate responses here for common queries
      }
    }

    logger.info("Cache warmup completed");
  }
}

// Singleton instance
export const aiCacheService = new AICacheService();
