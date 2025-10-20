/**
 * Environment validation and configuration utilities
 * This file validates environment variables and provides type-safe access
 */

import { z } from "zod";

/**
 * Environment variable schema with validation rules
 *
 * @description Validates all required environment variables at startup
 * to prevent runtime errors and ensure proper configuration
 */
const envSchema = z.object({
  // Next.js configuration
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI Services
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  AI_DEFAULT_MODEL: z.string().default("claude-sonnet-4-5-20250929"),
  AI_FALLBACK_MODEL: z.string().default("gpt-4o-mini"),
  AI_CACHE_TTL_HOURS: z.coerce.number().int().min(1).default(24),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).default(3),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),

  // Cost Controls
  AI_DAILY_BUDGET_USD: z.coerce.number().min(0).default(50),
  AI_USER_DAILY_LIMIT_USD: z.coerce.number().min(0).default(1),
  AI_ENABLE_COST_ALERTS: z.coerce.boolean().default(true),

  // Stripe (optional in development)
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PREMIUM_PRICE_ID: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  RESEND_FROM_NAME: z.string().default("JobAI"),

  // SMS (Twilio - optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SMS_ENABLED: z.coerce.boolean().default(false),

  // Caching (Redis - optional)
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
  CACHE_ENABLED: z.coerce.boolean().default(true),
  CACHE_DEFAULT_TTL: z.coerce.number().int().min(0).default(3600),

  // Scraping configuration
  SCRAPING_ENABLED: z.coerce.boolean().default(true),
  SCRAPING_CONCURRENT_LIMIT: z.coerce.number().int().min(1).default(3),
  SCRAPING_REQUEST_DELAY_MS: z.coerce.number().int().min(100).default(2000),

  // File upload limits
  MAX_RESUME_SIZE_MB: z.coerce.number().min(1).default(5),
  MAX_PROFILE_IMAGE_SIZE_MB: z.coerce.number().min(1).default(2),

  // Rate limiting
  RATE_LIMIT_JOB_SEARCH: z.coerce.number().int().min(1).default(100),
  RATE_LIMIT_AI_REQUESTS: z.coerce.number().int().min(1).default(50),
  RATE_LIMIT_GLOBAL_REQUESTS: z.coerce.number().int().min(100).default(10000),

  // Security
  ENABLE_SECURITY_HEADERS: z.coerce.boolean().default(true),
  ENABLE_RATE_LIMITING: z.coerce.boolean().default(true),

  // Feature flags
  FEATURE_RESUME_PARSING: z.coerce.boolean().default(true),
  FEATURE_COVER_LETTER_GENERATION: z.coerce.boolean().default(true),
  FEATURE_INTERVIEW_PREP: z.coerce.boolean().default(true),
  FEATURE_SALARY_ANALYSIS: z.coerce.boolean().default(true),
  FEATURE_SMS_ALERTS: z.coerce.boolean().default(false),

  // Development settings
  DEV_SKIP_AUTH: z.coerce.boolean().default(false),
  DEV_MOCK_AI_RESPONSES: z.coerce.boolean().default(false),
  DEV_MOCK_PAYMENTS: z.coerce.boolean().default(true),
  DEBUG_AI_REQUESTS: z.coerce.boolean().default(false),

  // Analytics (optional)
  SENTRY_DSN: z.string().url().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Compliance
  GDPR_COMPLIANCE_MODE: z.coerce.boolean().default(true),
  CCPA_COMPLIANCE_MODE: z.coerce.boolean().default(true),
});

/**
 * Validated environment variables
 *
 * @description Type-safe access to environment variables with validation
 * Throws error at startup if required variables are missing or invalid
 */
export const env = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Environment validation failed:");
    if (error && typeof error === "object" && "errors" in error) {
      console.error(error.errors);
    } else {
      console.error(error);
    }
    throw new Error(
      "Invalid environment configuration. Check your .env.local file."
    );
  }
})();

/**
 * Environment-specific configuration
 *
 * @description Configuration that changes based on environment
 */
export const config = {
  // Determine if we're in development
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTesting: env.NODE_ENV === "test",

  // API endpoints
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  appUrl: env.NEXT_PUBLIC_APP_URL,

  // AI configuration
  ai: {
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    defaultModel: env.AI_DEFAULT_MODEL,
    fallbackModel: env.AI_FALLBACK_MODEL,
    cacheTtlHours: env.AI_CACHE_TTL_HOURS,
    maxRetries: env.AI_MAX_RETRIES,
    timeoutMs: env.AI_TIMEOUT_MS,
    dailyBudgetUsd: env.AI_DAILY_BUDGET_USD,
    userDailyLimitUsd: env.AI_USER_DAILY_LIMIT_USD,
    enableCostAlerts: env.AI_ENABLE_COST_ALERTS,
  },

  // Payment configuration
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    premiumPriceId: env.STRIPE_PREMIUM_PRICE_ID,
  },

  // Email configuration
  email: {
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.RESEND_FROM_EMAIL,
    fromName: env.RESEND_FROM_NAME,
  },

  // SMS configuration
  sms: {
    enabled: env.SMS_ENABLED,
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
  },

  // Cache configuration
  cache: {
    enabled: env.CACHE_ENABLED,
    redisUrl: env.UPSTASH_REDIS_URL,
    redisToken: env.UPSTASH_REDIS_TOKEN,
    defaultTtl: env.CACHE_DEFAULT_TTL,
  },

  // Scraping configuration
  scraping: {
    enabled: env.SCRAPING_ENABLED,
    concurrentLimit: env.SCRAPING_CONCURRENT_LIMIT,
    requestDelayMs: env.SCRAPING_REQUEST_DELAY_MS,
  },

  // File upload limits
  upload: {
    maxResumeSizeMb: env.MAX_RESUME_SIZE_MB,
    maxImageSizeMb: env.MAX_PROFILE_IMAGE_SIZE_MB,
    maxResumeSizeBytes: env.MAX_RESUME_SIZE_MB * 1024 * 1024,
    maxImageSizeBytes: env.MAX_PROFILE_IMAGE_SIZE_MB * 1024 * 1024,
  },

  // Rate limiting
  rateLimit: {
    jobSearch: env.RATE_LIMIT_JOB_SEARCH,
    aiRequests: env.RATE_LIMIT_AI_REQUESTS,
    globalRequests: env.RATE_LIMIT_GLOBAL_REQUESTS,
    enabled: env.ENABLE_RATE_LIMITING,
  },

  // Feature flags
  features: {
    resumeParsing: env.FEATURE_RESUME_PARSING,
    coverLetterGeneration: env.FEATURE_COVER_LETTER_GENERATION,
    interviewPrep: env.FEATURE_INTERVIEW_PREP,
    salaryAnalysis: env.FEATURE_SALARY_ANALYSIS,
    smsAlerts: env.FEATURE_SMS_ALERTS,
  },

  // Development settings
  development: {
    skipAuth: env.DEV_SKIP_AUTH,
    mockAiResponses: env.DEV_MOCK_AI_RESPONSES,
    mockPayments: env.DEV_MOCK_PAYMENTS,
    debugAiRequests: env.DEBUG_AI_REQUESTS,
  },

  // Security settings
  security: {
    enableHeaders: env.ENABLE_SECURITY_HEADERS,
    enableRateLimit: env.ENABLE_RATE_LIMITING,
  },

  // Analytics
  analytics: {
    sentryDsn: env.SENTRY_DSN,
    googleAnalyticsId: env.GOOGLE_ANALYTICS_ID,
    logLevel: env.LOG_LEVEL,
  },

  // Compliance
  compliance: {
    gdpr: env.GDPR_COMPLIANCE_MODE,
    ccpa: env.CCPA_COMPLIANCE_MODE,
  },
} as const;

/**
 * Validate required environment variables for specific features
 *
 * @description Runtime validation for feature-specific env vars
 */
export const validateFeatureConfig = {
  /**
   * Validate AI service configuration
   */
  ai: () => {
    if (!env.ANTHROPIC_API_KEY && !env.OPENAI_API_KEY) {
      throw new Error(
        "At least one AI API key (Anthropic or OpenAI) must be configured"
      );
    }
  },

  /**
   * Validate payment configuration (for production)
   */
  payments: () => {
    if (env.NODE_ENV === "production" && !env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe configuration required for production");
    }
  },

  /**
   * Validate SMS configuration (if enabled)
   */
  sms: () => {
    if (
      env.SMS_ENABLED &&
      (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN)
    ) {
      throw new Error("Twilio configuration required when SMS is enabled");
    }
  },

  /**
   * Validate all required configurations
   */
  all: () => {
    validateFeatureConfig.ai();
    if (env.NODE_ENV === "production") {
      validateFeatureConfig.payments();
    }
    if (env.SMS_ENABLED) {
      validateFeatureConfig.sms();
    }
  },
};

// Validate configuration at startup (in production)
if (env.NODE_ENV === "production") {
  validateFeatureConfig.all();
}

// Export types
export type Environment = typeof env;
export type Config = typeof config;
