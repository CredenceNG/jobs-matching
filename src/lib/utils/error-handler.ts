import { logger } from "./logger";

export enum ErrorType {
  AI_PROVIDER_ERROR = "AI_PROVIDER_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  QUOTA_EXCEEDED_ERROR = "QUOTA_EXCEEDED_ERROR",
  CACHE_ERROR = "CACHE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  PARSING_ERROR = "PARSING_ERROR",
  CONFIG_ERROR = "CONFIG_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  operation?: string;
  provider?: "anthropic" | "openai";
  model?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export class AIError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly retryable: boolean;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(message);
    this.name = "AIError";
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    this.retryable = this.isRetryable(type);
    this.originalError = originalError;

    // Maintain proper stack trace
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, AIError);
    }
  }

  private isRetryable(type: ErrorType): boolean {
    const retryableErrors = [
      ErrorType.NETWORK_ERROR,
      ErrorType.AI_PROVIDER_ERROR,
      ErrorType.CACHE_ERROR,
    ];
    return retryableErrors.indexOf(type) !== -1;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Advanced error handling and recovery system for AI operations
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorMetrics = new Map<ErrorType, number>();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and classify errors from AI operations
   */
  handleError(error: unknown, context: ErrorContext = {}): AIError {
    let aiError: AIError;

    if (error instanceof AIError) {
      aiError = error;
    } else if (error instanceof Error) {
      const { type, severity } = this.classifyError(error);
      aiError = new AIError(error.message, type, severity, context, error);
    } else {
      aiError = new AIError(
        "An unknown error occurred",
        ErrorType.UNKNOWN_ERROR,
        ErrorSeverity.MEDIUM,
        context
      );
    }

    // Log the error
    this.logError(aiError);

    // Update metrics
    this.updateErrorMetrics(aiError.type);

    return aiError;
  }

  /**
   * Classify error type and severity based on error characteristics
   */
  private classifyError(error: Error): {
    type: ErrorType;
    severity: ErrorSeverity;
  } {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Rate limiting errors
    if (
      message.includes("rate limit") ||
      message.includes("too many requests")
    ) {
      return {
        type: ErrorType.RATE_LIMIT_ERROR,
        severity: ErrorSeverity.MEDIUM,
      };
    }

    // Quota exceeded errors
    if (
      message.includes("quota") ||
      message.includes("budget") ||
      message.includes("limit exceeded")
    ) {
      return {
        type: ErrorType.QUOTA_EXCEEDED_ERROR,
        severity: ErrorSeverity.HIGH,
      };
    }

    // Authentication errors
    if (
      message.includes("unauthorized") ||
      message.includes("api key") ||
      message.includes("authentication")
    ) {
      return {
        type: ErrorType.AUTHENTICATION_ERROR,
        severity: ErrorSeverity.CRITICAL,
      };
    }

    // Network/connectivity errors
    if (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("timeout")
    ) {
      return {
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.MEDIUM,
      };
    }

    // Parsing/validation errors
    if (
      message.includes("json") ||
      message.includes("parse") ||
      message.includes("invalid format")
    ) {
      return {
        type: ErrorType.PARSING_ERROR,
        severity: ErrorSeverity.LOW,
      };
    }

    // Cache errors
    if (message.includes("cache") || message.includes("redis")) {
      return {
        type: ErrorType.CACHE_ERROR,
        severity: ErrorSeverity.LOW,
      };
    }

    // AI provider specific errors
    if (
      message.includes("anthropic") ||
      message.includes("openai") ||
      message.includes("model")
    ) {
      return {
        type: ErrorType.AI_PROVIDER_ERROR,
        severity: ErrorSeverity.HIGH,
      };
    }

    // Default classification
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
    };
  }

  /**
   * Log error with appropriate level and context
   */
  private logError(error: AIError): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      context: error.context,
      retryable: error.retryable,
      originalError: error.originalError?.message,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`CRITICAL ERROR: ${error.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error(`HIGH SEVERITY: ${error.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`MEDIUM SEVERITY: ${error.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        logger.info(`LOW SEVERITY: ${error.message}`, logData);
        break;
    }
  }

  /**
   * Update error metrics for monitoring
   */
  private updateErrorMetrics(errorType: ErrorType): void {
    const currentCount = this.errorMetrics.get(errorType) || 0;
    this.errorMetrics.set(errorType, currentCount + 1);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.errorMetrics.forEach((count, type) => {
      stats[type] = count;
    });
    return stats;
  }

  /**
   * Execute function with retry logic and error handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {},
    retryConfig: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    }
  ): Promise<T> {
    let lastError: AIError | null = null;
    let delay = retryConfig.initialDelayMs;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        logger.debug(
          `Executing operation attempt ${attempt}/${retryConfig.maxAttempts}`,
          {
            context,
            delay: attempt > 1 ? delay : 0,
          }
        );

        const result = await operation();

        if (attempt > 1) {
          logger.info(`Operation succeeded on attempt ${attempt}`, { context });
        }

        return result;
      } catch (error) {
        const aiError = this.handleError(error, {
          ...context,
          metadata: {
            ...context.metadata,
            attempt,
            maxAttempts: retryConfig.maxAttempts,
          },
        });

        lastError = aiError;

        // Don't retry if error is not retryable or we've reached max attempts
        if (!aiError.retryable || attempt === retryConfig.maxAttempts) {
          logger.error(`Operation failed after ${attempt} attempts`, {
            context,
            finalError: aiError.type,
          });
          break;
        }

        // Wait before retry with exponential backoff
        logger.warn(
          `Operation failed on attempt ${attempt}, retrying in ${delay}ms`,
          {
            context,
            error: aiError.type,
            nextDelay: Math.min(
              delay * retryConfig.backoffMultiplier,
              retryConfig.maxDelayMs
            ),
          }
        );

        await this.sleep(delay);
        delay = Math.min(
          delay * retryConfig.backoffMultiplier,
          retryConfig.maxDelayMs
        );
      }
    }

    throw lastError;
  }

  /**
   * Create user-friendly error messages
   */
  getUserFriendlyMessage(error: AIError): string {
    switch (error.type) {
      case ErrorType.RATE_LIMIT_ERROR:
        return "Our AI service is experiencing high demand. Please try again in a few moments.";

      case ErrorType.QUOTA_EXCEEDED_ERROR:
        return "You have reached your daily usage limit. Please upgrade your plan or try again tomorrow.";

      case ErrorType.AUTHENTICATION_ERROR:
        return "There was an authentication issue. Please contact support if this persists.";

      case ErrorType.NETWORK_ERROR:
        return "Network connection issue. Please check your internet connection and try again.";

      case ErrorType.PARSING_ERROR:
        return "There was an issue processing your request. Please try rephrasing or contact support.";

      case ErrorType.AI_PROVIDER_ERROR:
        return "Our AI service is temporarily unavailable. Please try again in a few minutes.";

      case ErrorType.CACHE_ERROR:
        return "Temporary service issue. Your request will still be processed, but it may take longer.";

      case ErrorType.VALIDATION_ERROR:
        return "Please check your input and try again.";

      default:
        return "An unexpected error occurred. Please try again or contact support if the issue persists.";
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reset error metrics (useful for testing or periodic cleanup)
   */
  resetMetrics(): void {
    this.errorMetrics.clear();
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
