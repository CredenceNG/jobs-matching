/**
 * AI Services Configuration
 *
 * Central configuration for AI services including Claude and OpenAI.
 * Handles model selection, cost tracking, and quota management.
 *
 * @description AI service configuration and cost controls
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// =============================================================================
// AI SERVICE CONFIGURATION
// =============================================================================

export const AI_CONFIG = {
  // Model configurations
  models: {
    primary: "claude-sonnet-4-5-20250929" as const,
    fallback: "gpt-4o-mini" as const, // Updated to use GPT-4o-mini (better quality, similar cost)
    economical: "gpt-4o-mini" as const,
  },

  // Cost per 1K tokens (approximate, update based on current pricing)
  costs: {
    "claude-sonnet-4-5-20250929": {
      input: 0.003, // $3 per million input tokens
      output: 0.015, // $15 per million output tokens
    },
    "gpt-4o-mini": {
      input: 0.00015, // $0.15 per million input tokens (very cheap!)
      output: 0.0006, // $0.60 per million output tokens
    },
    "gpt-3.5-turbo": {
      input: 0.0005, // $0.50 per million input tokens
      output: 0.0015, // $1.50 per million output tokens
    },
    "gpt-4o": {
      input: 0.0025, // $2.50 per million input tokens
      output: 0.01, // $10 per million output tokens
    },
  },

  // Usage quotas and limits
  quotas: {
    free: {
      dailyRequests: 10,
      dailyCostUsd: 0.5,
      monthlyRequests: 100,
      monthlyCostUsd: 5.0,
    },
    premium: {
      dailyRequests: 200,
      dailyCostUsd: 10.0,
      monthlyRequests: 2000,
      monthlyCostUsd: 100.0,
    },
  },

  // Request timeouts and retries
  timeouts: {
    default: 30000, // 30 seconds
    complex: 60000, // 1 minute for complex operations
    batch: 120000, // 2 minutes for batch operations
  },

  // Cache TTL settings (in seconds) - mapped to AIFeature names
  cacheTtl: {
    job_matching: 3600, // 1 hour
    resume_parsing: 86400, // 24 hours (resumes don't change often)
    cover_letter_generation: 1800, // 30 minutes
    resume_optimization: 1800, // 30 minutes (job-specific resumes)
    interview_preparation: 1800, // 30 minutes
    career_insights: 7200, // 2 hours
    salary_analysis: 43200, // 12 hours
  },
} as const;

// =============================================================================
// AI CLIENT INITIALIZATION
// =============================================================================

/**
 * Initialize Anthropic Claude client
 */
export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Optional: Custom base URL if using a proxy
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

/**
 * Initialize OpenAI client (lazy initialization to avoid build-time errors)
 */
let _openaiClient: OpenAI | null = null;
export function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('[OpenAI Config] Initializing OpenAI client...', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      hasBaseUrl: !!process.env.OPENAI_BASE_URL,
    });

    _openaiClient = new OpenAI({
      apiKey: apiKey || '',
      // Optional: Custom base URL if using a proxy
      baseURL: process.env.OPENAI_BASE_URL,
    });

    console.log('[OpenAI Config] OpenAI client initialized successfully');
  }
  return _openaiClient;
}

// Deprecated: Use getOpenAIClient() instead
export const openaiClient = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAIClient() as any)[prop];
  }
});

// =============================================================================
// AI MODEL TYPES AND INTERFACES
// =============================================================================

export type AIModel = "claude-sonnet-4-5-20250929" | "gpt-4o-mini" | "gpt-3.5-turbo" | "gpt-4o";

export type AIProvider = "anthropic" | "openai";

export interface AIRequest {
  userId: string;
  model: AIModel;
  feature: AIFeature;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requestId: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export type AIFeature =
  | "job_matching"
  | "resume_parsing"
  | "cover_letter_generation"
  | "resume_optimization"
  | "interview_preparation"
  | "career_insights"
  | "salary_analysis";

export interface AIUsageQuota {
  userId: string;
  subscriptionStatus: "free" | "premium";
  dailyRequests: number;
  dailyCost: number;
  monthlyRequests: number;
  monthlyCost: number;
  lastResetDate: Date;
}

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  model: AIModel;
  cached: boolean;
  requestId: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get AI provider from model name
 */
export function getProviderFromModel(model: AIModel): AIProvider {
  if (model.startsWith("claude")) {
    return "anthropic";
  }
  if (model.startsWith("gpt")) {
    return "openai";
  }
  throw new Error(`Unknown model: ${model}`);
}

/**
 * Calculate cost for AI request
 */
export function calculateAICost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): number {
  const modelCosts = AI_CONFIG.costs[model];
  if (!modelCosts) {
    throw new Error(`Cost configuration not found for model: ${model}`);
  }

  const inputCost = (inputTokens / 1000) * modelCosts.input;
  const outputCost = (outputTokens / 1000) * modelCosts.output;

  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Get recommended model based on feature and user subscription
 */
export function getRecommendedModel(
  feature: AIFeature,
  subscriptionStatus: "free" | "premium",
  complexity: "simple" | "complex" = "simple"
): AIModel {
  // For free users, always use economical model
  if (subscriptionStatus === "free") {
    return AI_CONFIG.models.economical;
  }

  // For premium users, use appropriate model based on complexity
  if (complexity === "complex" || feature === "career_insights") {
    return AI_CONFIG.models.primary;
  }

  return AI_CONFIG.models.fallback;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get cache key for AI request
 */
export function getCacheKey(
  feature: AIFeature,
  userId: string,
  contentHash: string
): string {
  return `ai_cache:${feature}:${userId}:${contentHash}`;
}

/**
 * Hash content for cache key generation
 */
export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public model?: AIModel,
    public feature?: AIFeature
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export class AIQuotaExceededError extends AIServiceError {
  constructor(quotaType: "daily" | "monthly", limit: number) {
    super(
      `AI quota exceeded: ${quotaType} limit of ${limit} reached`,
      "QUOTA_EXCEEDED"
    );
  }
}

export class AIModelUnavailableError extends AIServiceError {
  constructor(model: AIModel) {
    super(`AI model unavailable: ${model}`, "MODEL_UNAVAILABLE", model);
  }
}
