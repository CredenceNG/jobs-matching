import { logger } from "@/lib/utils/logger";
import { config } from "@/lib/config";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: "USD";
}

export interface UsageRecord {
  userId?: string;
  sessionId: string;
  provider: "anthropic" | "openai";
  model: string;
  usage: TokenUsage;
  cost: CostBreakdown;
  timestamp: Date;
  operation: "text-generation" | "embedding" | "streaming";
  cached: boolean;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface UserQuota {
  userId: string;
  dailyTokenLimit: number;
  dailyCostLimit: number;
  currentDailyTokens: number;
  currentDailyCost: number;
  lastResetDate: string;
}

/**
 * Pricing information for different AI models
 * Prices are per 1,000 tokens in USD
 */
const MODEL_PRICING = {
  // Anthropic Claude pricing
  "claude-3-sonnet-20241022": {
    input: 0.003, // $3 per million input tokens
    output: 0.015, // $15 per million output tokens
  },
  "claude-3-haiku-20241022": {
    input: 0.00025, // $0.25 per million input tokens
    output: 0.00125, // $1.25 per million output tokens
  },
  "claude-3-opus-20241022": {
    input: 0.015, // $15 per million input tokens
    output: 0.075, // $75 per million output tokens
  },

  // OpenAI GPT pricing
  "gpt-4o": {
    input: 0.0025, // $2.5 per million input tokens
    output: 0.01, // $10 per million output tokens
  },
  "gpt-4o-mini": {
    input: 0.00015, // $0.15 per million input tokens
    output: 0.0006, // $0.6 per million output tokens
  },
  "gpt-4": {
    input: 0.03, // $30 per million input tokens
    output: 0.06, // $60 per million output tokens
  },
  "gpt-3.5-turbo": {
    input: 0.0005, // $0.5 per million input tokens
    output: 0.0015, // $1.5 per million output tokens
  },

  // OpenAI Embedding pricing
  "text-embedding-3-small": {
    input: 0.00002, // $0.02 per million tokens
    output: 0, // No output tokens for embeddings
  },
  "text-embedding-3-large": {
    input: 0.00013, // $0.13 per million tokens
    output: 0, // No output tokens for embeddings
  },
  "text-embedding-ada-002": {
    input: 0.0001, // $0.1 per million tokens
    output: 0, // No output tokens for embeddings
  },
} as const;

/**
 * Cost tracking service for AI usage monitoring
 */
export class CostTrackingService {
  private usageRecords: UsageRecord[] = [];
  private userQuotas = new Map<string, UserQuota>();

  /**
   * Calculate cost for token usage based on model pricing
   */
  calculateCost(model: string, usage: TokenUsage): CostBreakdown {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];

    if (!pricing) {
      logger.warn("Unknown model for cost calculation", { model });
      // Default pricing if model not found
      const defaultPricing = { input: 0.001, output: 0.002 };
      return {
        inputCost: (usage.inputTokens / 1000) * defaultPricing.input,
        outputCost: (usage.outputTokens / 1000) * defaultPricing.output,
        totalCost:
          (usage.inputTokens / 1000) * defaultPricing.input +
          (usage.outputTokens / 1000) * defaultPricing.output,
        currency: "USD",
      };
    }

    const inputCost = (usage.inputTokens / 1000) * pricing.input;
    const outputCost = (usage.outputTokens / 1000) * pricing.output;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: "USD",
    };
  }

  /**
   * Record AI usage for cost tracking
   */
  async recordUsage(
    sessionId: string,
    provider: "anthropic" | "openai",
    model: string,
    usage: TokenUsage,
    options: {
      userId?: string;
      operation?: "text-generation" | "embedding" | "streaming";
      cached?: boolean;
    } = {}
  ): Promise<UsageRecord> {
    const cost = this.calculateCost(model, usage);

    const record: UsageRecord = {
      userId: options.userId,
      sessionId,
      provider,
      model,
      usage,
      cost,
      timestamp: new Date(),
      operation: options.operation || "text-generation",
      cached: options.cached || false,
    };

    this.usageRecords.push(record);

    // Update user quota if userId provided
    if (options.userId) {
      await this.updateUserQuota(options.userId, usage, cost);
    }

    // Check budget alerts
    await this.checkBudgetAlerts(record);

    logger.info("AI usage recorded", {
      sessionId,
      provider,
      model,
      tokens: usage.totalTokens,
      cost: cost.totalCost,
      cached: options.cached,
    });

    return record;
  }

  /**
   * Update user daily quota
   */
  private async updateUserQuota(
    userId: string,
    usage: TokenUsage,
    cost: CostBreakdown
  ): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    let quota = this.userQuotas.get(userId);

    if (!quota || quota.lastResetDate !== today) {
      // Create new quota or reset for new day
      quota = {
        userId,
        dailyTokenLimit: (config.ai.userDailyLimitUsd * 1000) / 0.001, // Rough estimate
        dailyCostLimit: config.ai.userDailyLimitUsd,
        currentDailyTokens: 0,
        currentDailyCost: 0,
        lastResetDate: today,
      };
    }

    quota.currentDailyTokens += usage.totalTokens;
    quota.currentDailyCost += cost.totalCost;

    this.userQuotas.set(userId, quota);

    // Check if user exceeded limits
    if (quota.currentDailyCost >= quota.dailyCostLimit) {
      logger.warn("User exceeded daily cost limit", {
        userId,
        currentCost: quota.currentDailyCost,
        limit: quota.dailyCostLimit,
      });
    }
  }

  /**
   * Check if user can make AI request within quota
   */
  async checkUserQuota(
    userId: string,
    estimatedCost: number = 0.01
  ): Promise<{
    allowed: boolean;
    remainingCost: number;
    remainingTokens: number;
    reason?: string;
  }> {
    const quota = this.userQuotas.get(userId);
    const today = new Date().toISOString().split("T")[0];

    if (!quota || quota.lastResetDate !== today) {
      // First request of the day or new user
      return {
        allowed: true,
        remainingCost: config.ai.userDailyLimitUsd,
        remainingTokens: (config.ai.userDailyLimitUsd * 1000) / 0.001,
      };
    }

    const remainingCost = quota.dailyCostLimit - quota.currentDailyCost;
    const remainingTokens = quota.dailyTokenLimit - quota.currentDailyTokens;

    if (remainingCost < estimatedCost) {
      return {
        allowed: false,
        remainingCost,
        remainingTokens,
        reason: "Daily cost limit exceeded",
      };
    }

    return {
      allowed: true,
      remainingCost,
      remainingTokens,
    };
  }

  /**
   * Check budget alerts and send notifications
   */
  private async checkBudgetAlerts(record: UsageRecord): Promise<void> {
    if (!config.ai.enableCostAlerts) return;

    const today = new Date().toISOString().split("T")[0];
    const dailyUsage = this.getDailyUsage(today);
    const dailyBudget = config.ai.dailyBudgetUsd;

    // Alert thresholds
    const warningThreshold = dailyBudget * 0.8; // 80%
    const criticalThreshold = dailyBudget * 0.95; // 95%

    if (
      dailyUsage.totalCost >= criticalThreshold &&
      dailyUsage.totalCost < dailyBudget
    ) {
      logger.error("Critical budget alert: 95% of daily budget reached", {
        currentCost: dailyUsage.totalCost,
        budget: dailyBudget,
        percentage: (dailyUsage.totalCost / dailyBudget) * 100,
      });
    } else if (
      dailyUsage.totalCost >= warningThreshold &&
      dailyUsage.totalCost < criticalThreshold
    ) {
      logger.warn("Budget warning: 80% of daily budget reached", {
        currentCost: dailyUsage.totalCost,
        budget: dailyBudget,
        percentage: (dailyUsage.totalCost / dailyBudget) * 100,
      });
    }

    if (dailyUsage.totalCost >= dailyBudget) {
      logger.error("Daily budget exceeded! AI requests should be limited", {
        currentCost: dailyUsage.totalCost,
        budget: dailyBudget,
        excess: dailyUsage.totalCost - dailyBudget,
      });
    }
  }

  /**
   * Get daily usage statistics
   */
  getDailyUsage(
    date: string = new Date().toISOString().split("T")[0]
  ): DailyUsage {
    const dayRecords = this.usageRecords.filter(
      (record) => record.timestamp.toISOString().split("T")[0] === date
    );

    return {
      date,
      totalTokens: dayRecords.reduce(
        (sum, record) => sum + record.usage.totalTokens,
        0
      ),
      totalCost: dayRecords.reduce(
        (sum, record) => sum + record.cost.totalCost,
        0
      ),
      requestCount: dayRecords.length,
      cacheHits: dayRecords.filter((record) => record.cached).length,
      cacheMisses: dayRecords.filter((record) => !record.cached).length,
    };
  }

  /**
   * Get user usage statistics
   */
  getUserUsage(
    userId: string,
    days: number = 7
  ): {
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    dailyBreakdown: DailyUsage[];
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const userRecords = this.usageRecords.filter(
      (record) => record.userId === userId && record.timestamp >= cutoffDate
    );

    const dailyBreakdown: DailyUsage[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayRecords = userRecords.filter(
        (record) => record.timestamp.toISOString().split("T")[0] === dateStr
      );

      dailyBreakdown.push({
        date: dateStr,
        totalTokens: dayRecords.reduce(
          (sum, record) => sum + record.usage.totalTokens,
          0
        ),
        totalCost: dayRecords.reduce(
          (sum, record) => sum + record.cost.totalCost,
          0
        ),
        requestCount: dayRecords.length,
        cacheHits: dayRecords.filter((record) => record.cached).length,
        cacheMisses: dayRecords.filter((record) => !record.cached).length,
      });
    }

    return {
      totalCost: userRecords.reduce(
        (sum, record) => sum + record.cost.totalCost,
        0
      ),
      totalTokens: userRecords.reduce(
        (sum, record) => sum + record.usage.totalTokens,
        0
      ),
      requestCount: userRecords.length,
      dailyBreakdown,
    };
  }

  /**
   * Get cost savings from caching
   */
  getCacheSavings(days: number = 7): {
    tokensSaved: number;
    costSaved: number;
    cacheHitRate: number;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentRecords = this.usageRecords.filter(
      (record) => record.timestamp >= cutoffDate
    );

    const cachedRecords = recentRecords.filter((record) => record.cached);
    const totalRecords = recentRecords.length;

    const tokensSaved = cachedRecords.reduce(
      (sum, record) => sum + record.usage.totalTokens,
      0
    );
    const costSaved = cachedRecords.reduce(
      (sum, record) => sum + record.cost.totalCost,
      0
    );
    const cacheHitRate =
      totalRecords > 0 ? cachedRecords.length / totalRecords : 0;

    return {
      tokensSaved,
      costSaved,
      cacheHitRate,
    };
  }

  /**
   * Export usage data for analysis
   */
  exportUsageData(startDate?: Date, endDate?: Date): UsageRecord[] {
    let records = this.usageRecords;

    if (startDate) {
      records = records.filter((record) => record.timestamp >= startDate);
    }

    if (endDate) {
      records = records.filter((record) => record.timestamp <= endDate);
    }

    return records;
  }
}

// Singleton instance
export const costTrackingService = new CostTrackingService();
