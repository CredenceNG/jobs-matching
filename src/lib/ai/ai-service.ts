/**
 * AI Service Core
 *
 * Main AI service class that handles requests to Claude and OpenAI.
 * Includes cost tracking, quota management, caching, and error handling.
 *
 * @description Core AI service with integrated cost controls and caching
 */

import { prisma } from "@/lib/prisma";
import {
  anthropicClient,
  openaiClient,
  AI_CONFIG,
  AIModel,
  AIFeature,
  AIResponse,
  AIRequest,
  AIUsageQuota,
  calculateAICost,
  getProviderFromModel,
  getRecommendedModel,
  generateRequestId,
  getCacheKey,
  hashContent,
  AIServiceError,
  AIQuotaExceededError,
  AIModelUnavailableError,
} from "./config";

// =============================================================================
// MAIN AI SERVICE CLASS
// =============================================================================

export class AIService {
  /**
   * Helper method to get database client (using Prisma)
   * Removed Supabase dependency - using Prisma with Neon
   */
  private getDatabase() {
    return prisma;
  }

  /**
   * Make an AI request with automatic cost tracking and quota checking
   *
   * @param userId - User making the request
   * @param feature - AI feature being used
   * @param prompt - The prompt to send to AI
   * @param options - Additional options
   * @returns Promise<AIResponse>
   */
  async makeRequest<T = string>(
    userId: string,
    feature: AIFeature,
    prompt: string,
    options: {
      model?: AIModel;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      complexity?: "simple" | "complex";
      bypassCache?: boolean;
    } = {}
  ): Promise<AIResponse<T>> {
    const requestId = generateRequestId();

    console.log('[AI Service] Starting AI request', {
      requestId,
      userId,
      feature,
      promptLength: prompt.length,
      options: {
        model: options.model,
        complexity: options.complexity,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      },
    });

    try {
      // Handle anonymous users without database lookups
      const isAnonymous = userId === "anonymous-user" || !userId;
      let subscriptionStatus: "free" | "premium" = "free";

      if (!isAnonymous) {
        console.log('[AI Service] Checking user subscription status...');
        // Get user's subscription status from database (Prisma/Neon)
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isPremium: true },
        });

        subscriptionStatus = user?.isPremium ? "premium" : "free";
        console.log('[AI Service] User subscription status:', subscriptionStatus);

        // Check user quotas before making request (only for registered users)
        await this.checkUserQuotas(userId, subscriptionStatus);
      }

      // Determine the model to use
      const model =
        options.model ||
        getRecommendedModel(feature, subscriptionStatus, options.complexity);

      console.log('[AI Service] Selected model:', model);

      // Check cache first (unless bypassed)
      if (!options.bypassCache) {
        const cached = await this.getCachedResponse<T>(feature, userId, prompt);
        if (cached) {
          console.log('[AI Service] Cache hit - returning cached response');
          return {
            ...cached,
            cached: true,
            requestId,
          };
        }
      }

      console.log('[AI Service] No cache found - executing AI request...');
      // Make the AI request
      const response = await this.executeAIRequest<T>(
        model,
        prompt,
        options.systemPrompt,
        options.temperature,
        options.maxTokens
      );

      console.log('[AI Service] AI request completed successfully', {
        contentLength: typeof response.content === 'string' ? response.content.length : 'N/A',
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      });

      // Calculate cost and track usage
      const cost = calculateAICost(
        model,
        response.inputTokens,
        response.outputTokens
      );

      console.log('[AI Service] Request cost:', `$${cost.toFixed(4)}`);

      await this.trackAIUsage({
        userId,
        model,
        feature,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        cost,
        requestId,
        timestamp: new Date(),
        success: true,
      });

      // Cache the response
      await this.cacheResponse(feature, userId, prompt, {
        success: true,
        data: response.content,
        model,
        cached: false,
        requestId,
        usage: {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          cost,
        },
      });

      console.log('[AI Service] Returning successful response');

      return {
        success: true,
        data: response.content,
        model,
        cached: false,
        requestId,
        usage: {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          cost,
        },
      };
    } catch (error) {
      console.error('[AI Service] CRITICAL ERROR in makeRequest:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        requestId,
      });

      // Track failed request
      await this.trackAIUsage({
        userId,
        model: options.model || AI_CONFIG.models.fallback,
        feature,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        requestId,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        model: options.model || AI_CONFIG.models.fallback,
        cached: false,
        requestId,
      };
    }
  }

  /**
   * Execute AI request to specific provider
   */
  private async executeAIRequest<T>(
    model: AIModel,
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<{
    content: T;
    inputTokens: number;
    outputTokens: number;
  }> {
    const provider = getProviderFromModel(model);

    if (provider === "anthropic") {
      return this.executeAnthropicRequest<T>(
        model as "claude-sonnet-4-5-20250929",
        prompt,
        systemPrompt,
        temperature,
        maxTokens
      );
    } else {
      return this.executeOpenAIRequest<T>(
        model as "gpt-3.5-turbo" | "gpt-4o",
        prompt,
        systemPrompt,
        temperature,
        maxTokens
      );
    }
  }

  /**
   * Execute Anthropic Claude request
   */
  private async executeAnthropicRequest<T>(
    model: "claude-sonnet-4-5-20250929",
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<{
    content: T;
    inputTokens: number;
    outputTokens: number;
  }> {
    try {
      const response = await anthropicClient.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Anthropic");
      }

      return {
        content: content.text as T,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AIModelUnavailableError(model);
      }
      throw error;
    }
  }

  /**
   * Execute OpenAI request
   */
  private async executeOpenAIRequest<T>(
    model: "gpt-3.5-turbo" | "gpt-4o",
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<{
    content: T;
    inputTokens: number;
    outputTokens: number;
  }> {
    console.log('[AI Service - OpenAI] Starting OpenAI request...', {
      model,
      promptLength: prompt.length,
      hasSystemPrompt: !!systemPrompt,
      temperature,
      maxTokens,
    });

    try {
      const messages: any[] = [];

      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }

      messages.push({ role: "user", content: prompt });

      console.log('[AI Service - OpenAI] Calling OpenAI API...');
      const response = await openaiClient.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      console.log('[AI Service - OpenAI] OpenAI API response received', {
        hasChoices: !!response.choices,
        choicesCount: response.choices?.length || 0,
        hasUsage: !!response.usage,
        finishReason: response.choices?.[0]?.finish_reason,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('[AI Service - OpenAI] No content in OpenAI response', {
          response: JSON.stringify(response, null, 2),
        });
        throw new Error("No content in OpenAI response");
      }

      console.log('[AI Service - OpenAI] Successfully extracted content', {
        contentLength: content.length,
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      });

      return {
        content: content as T,
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      };
    } catch (error) {
      console.error('[AI Service - OpenAI] OpenAI request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });

      if (error instanceof Error) {
        throw new AIModelUnavailableError(model);
      }
      throw error;
    }
  }

  /**
   * Check user's AI usage quotas
   * Simplified version - database tracking optional for now
   */
  private async checkUserQuotas(
    userId: string,
    subscriptionStatus: "free" | "premium"
  ): Promise<void> {
    // Skip quota checks for anonymous users or test users
    if (userId === "anonymous-user" || userId.startsWith("test-")) {
      console.log("📊 Quota check skipped for test/anonymous user");
      return;
    }

    // TODO: Implement database-based quota tracking when needed
    // For now, just log and allow
    console.log("📊 Quota check (simplified):", {
      userId,
      subscriptionStatus,
      quotaLimits: AI_CONFIG.quotas[subscriptionStatus]
    });
  }

  /**
   * Track AI usage in database
   * Simplified version - logs to console for now
   */
  private async trackAIUsage(request: AIRequest): Promise<void> {
    // Log usage to console
    console.log("📊 AI Usage Tracking:", {
      userId: request.userId,
      model: request.model,
      feature: request.feature,
      inputTokens: request.inputTokens,
      outputTokens: request.outputTokens,
      cost: `$${request.cost.toFixed(4)}`,
      success: request.success,
      requestId: request.requestId,
    });

    // TODO: Store in database when needed
    // For now, we're just logging
  }

  /**
   * Get cached AI response
   * Simplified - no caching for now
   */
  private async getCachedResponse<T>(
    feature: AIFeature,
    userId: string,
    prompt: string
  ): Promise<AIResponse<T> | null> {
    // TODO: Implement caching when needed
    // For now, always return null (no cache)
    return null;
  }

  /**
   * Cache AI response
   * Simplified - no caching for now
   */
  private async cacheResponse<T>(
    feature: AIFeature,
    userId: string,
    prompt: string,
    response: AIResponse<T>
  ): Promise<void> {
    // TODO: Implement caching when needed
    // For now, skip caching
    console.log("💾 Cache skipped (not implemented yet)");
  }

  /**
   * Get user's AI usage statistics
   * Simplified - returns default quotas for now
   */
  async getUserUsageStats(userId: string): Promise<{
    today: { requests: number; cost: number };
    month: { requests: number; cost: number };
    quotas: { daily: any; monthly: any };
  }> {
    // TODO: Implement database-based usage tracking
    // For now, return default quotas
    const subscriptionStatus = "free"; // Default to free tier
    const quotas = AI_CONFIG.quotas[subscriptionStatus];

    return {
      today: {
        requests: 0,
        cost: 0,
      },
      month: {
        requests: 0,
        cost: 0,
      },
      quotas: {
        daily: {
          requests: quotas.dailyRequests,
          cost: quotas.dailyCostUsd,
        },
        monthly: {
          requests: quotas.monthlyRequests,
          cost: quotas.monthlyCostUsd,
        },
      },
    };
  }
}

// Export singleton instance - Now safe with lazy initialization
export const aiService = new AIService();
