import { AIService } from './service';
import { aiCacheService, type AIRequestOptions } from '@/lib/cache/ai-cache';
import { costTrackingService } from './cost-tracking';
import { logger, errorHandler, monitoringService } from '@/lib/utils';
import { config } from '@/lib/config';
import type { AIResponse, StreamingOptions } from './service';

/**
 * Cached AI service that wraps the base AI service with intelligent caching
 */
export class CachedAIService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Generate text with caching support
   */
  async generateText(
    prompt: string,
    options: AIRequestOptions & {
      preferProvider?: 'anthropic' | 'openai';
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const sessionId = options.sessionId || `session_${Date.now()}`;
    
    // Check user quota if userId provided
    if (options.userId) {
      const quotaCheck = await costTrackingService.checkUserQuota(options.userId);
      if (!quotaCheck.allowed) {
        throw new Error(`AI request denied: ${quotaCheck.reason}`);
      }
    }
    
    // Check cache if enabled
    if (options.useCache !== false && config.cache.enabled) {
      const cacheKey = aiCacheService.generateCacheKey(prompt, options);
      const cached = await aiCacheService.get(cacheKey);
      
      if (cached) {
        const responseTime = Date.now() - startTime;
        
        // Record cached usage (no cost)
        await costTrackingService.recordUsage(
          sessionId,
          cached.provider,
          cached.model,
          cached.usage,
          {
            userId: options.userId,
            operation: 'text-generation',
            cached: true,
          }
        );
        
        logger.info('Cache hit for AI request', {
          responseTimeMs: responseTime,
          tokensSaved: cached.usage.totalTokens,
          model: cached.model,
          provider: cached.provider,
        });
        
        return {
          content: cached.content,
          usage: cached.usage,
          model: cached.model,
          provider: cached.provider,
        };
      }
    }

    // Generate new response with error handling and monitoring
    try {
      const response = await errorHandler.executeWithRetry(
        () => this.aiService.generateText(prompt, {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          model: options.model,
          preferProvider: options.preferProvider,
        }),
        {
          userId: options.userId,
          sessionId,
          operation: 'generateText',
        }
      );

      const responseTime = Date.now() - startTime;
      
      // Record usage and cost
      const usageRecord = await costTrackingService.recordUsage(
        sessionId,
        response.provider,
        response.model,
        response.usage,
        {
          userId: options.userId,
          operation: 'text-generation',
          cached: false,
        }
      );
      
      // Record monitoring metrics
      monitoringService.recordRequest(
        responseTime,
        options.userId,
        usageRecord.cost.totalCost
      );
      
      logger.info('AI request completed', {
        responseTimeMs: responseTime,
        tokens: response.usage.totalTokens,
        model: response.model,
        provider: response.provider,
        cached: false,
      });

      // Cache the response if it's cacheable
      if (
        options.useCache !== false &&
        config.cache.enabled &&
        aiCacheService.isCacheable(prompt, response.content, options)
      ) {
        const cacheKey = aiCacheService.generateCacheKey(prompt, options);
        await aiCacheService.set(cacheKey, response, options.cacheTtl);
      }

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Handle and classify the error
      const aiError = errorHandler.handleError(error, {
        userId: options.userId,
        sessionId,
        operation: 'generateText',
      });
      
      // Record failed request metrics
      monitoringService.recordRequest(
        responseTime,
        options.userId,
        0, // No cost for failed requests
        aiError
      );
      
      throw aiError;
    }
  }

  /**
   * Stream text (caching not applicable for streaming)
   */
  async streamText(
    prompt: string,
    options: StreamingOptions & {
      preferProvider?: 'anthropic' | 'openai';
    } = {}
  ): Promise<AIResponse> {
    // Streaming responses are not cached due to their interactive nature
    return this.aiService.streamText(prompt, options);
  }

  /**
   * Generate embeddings with caching
   */
  async generateEmbedding(
    text: string,
    options: {
      model?: string;
      useCache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<{
    embedding: number[];
    usage: {
      inputTokens: number;
      totalTokens: number;
    };
  }> {
    const startTime = Date.now();
    
    // Check cache for embeddings
    if (options.useCache !== false && config.cache.enabled) {
      const cacheKey = aiCacheService.generateCacheKey(text, { 
        model: options.model || 'text-embedding-3-small',
      } as any);
      
      const cached = await aiCacheService.get(cacheKey);
      if (cached && cached.content) {
        try {
          const embedding = JSON.parse(cached.content);
          const responseTime = Date.now() - startTime;
          
          logger.info('Embedding cache hit', {
            responseTimeMs: responseTime,
            tokensSaved: cached.usage.inputTokens,
            embeddingDimensions: embedding.length,
          });
          
          return {
            embedding,
            usage: {
              inputTokens: cached.usage.inputTokens,
              totalTokens: cached.usage.totalTokens,
            },
          };
        } catch (error) {
          logger.warn('Failed to parse cached embedding', { error });
        }
      }
    }

    // Generate new embedding
    try {
      const result = await this.aiService.generateEmbedding(text, options.model);
      const responseTime = Date.now() - startTime;
      
      logger.info('Embedding request completed', {
        responseTimeMs: responseTime,
        tokens: result.usage.totalTokens,
        embeddingDimensions: result.embedding.length,
        cached: false,
      });

      // Cache the embedding
      if (options.useCache !== false && config.cache.enabled) {
        const cacheKey = aiCacheService.generateCacheKey(text, { 
          model: options.model || 'text-embedding-3-small',
        } as any);
        
        const cacheResponse = {
          content: JSON.stringify(result.embedding),
          usage: {
            inputTokens: result.usage.inputTokens,
            outputTokens: 0,
            totalTokens: result.usage.totalTokens,
          },
          model: options.model || 'text-embedding-3-small',
          provider: 'openai' as const,
        };
        
        await aiCacheService.set(cacheKey, cacheResponse, options.cacheTtl);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Embedding request failed', {
        responseTimeMs: responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        text: text.substring(0, 100) + '...',
      });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return aiCacheService.getStats();
  }

  /**
   * Clear cache
   */
  async clearCache() {
    return aiCacheService.clearExpired(0); // Clear all
  }

  /**
   * Warm up cache with common queries
   */
  async warmupCache(commonQueries: string[] = []) {
    return aiCacheService.warmup(commonQueries);
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: 'anthropic' | 'openai'): boolean {
    return this.aiService.isProviderAvailable(provider);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): Array<'anthropic' | 'openai'> {
    return this.aiService.getAvailableProviders();
  }
}

// Singleton instance
export const cachedAIService = new CachedAIService();