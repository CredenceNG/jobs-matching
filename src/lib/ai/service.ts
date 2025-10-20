import { AnthropicClient } from "./anthropic";
import { OpenAIClient } from "./openai";
import { config } from "@/lib/config";
import { logger } from "@/lib/utils/logger";

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  content: string;
  usage: AIUsage;
  model: string;
  provider: "anthropic" | "openai";
}

export interface StreamingOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  onChunk?: (chunk: string) => void;
}

export class AIService {
  private anthropic?: AnthropicClient;
  private openai?: OpenAIClient;

  constructor() {
    // Initialize clients based on available API keys
    try {
      if (config.ai.anthropicApiKey) {
        this.anthropic = new AnthropicClient();
        logger.info("Anthropic client initialized");
      }
    } catch (error) {
      logger.warn("Failed to initialize Anthropic client", { error });
    }

    try {
      if (config.ai.openaiApiKey) {
        this.openai = new OpenAIClient();
        logger.info("OpenAI client initialized");
      }
    } catch (error) {
      logger.warn("Failed to initialize OpenAI client", { error });
    }

    if (!this.anthropic && !this.openai) {
      throw new Error(
        "No AI providers configured. Please check your API keys."
      );
    }
  }

  /**
   * Generate text using the primary AI provider with fallback
   */
  async generateText(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
      preferProvider?: "anthropic" | "openai";
    } = {}
  ): Promise<AIResponse> {
    const { preferProvider, ...aiOptions } = options;

    // Determine which provider to try first
    const primaryProvider = preferProvider || this.getPrimaryProvider();
    const fallbackProvider =
      primaryProvider === "anthropic" ? "openai" : "anthropic";

    try {
      return await this.callProvider(
        primaryProvider,
        "generateText",
        prompt,
        aiOptions
      );
    } catch (error) {
      logger.warn(
        `Primary provider (${primaryProvider}) failed, trying fallback`,
        { error }
      );

      try {
        return await this.callProvider(
          fallbackProvider,
          "generateText",
          prompt,
          {
            ...aiOptions,
            model: aiOptions.model || config.ai.fallbackModel,
          }
        );
      } catch (fallbackError) {
        logger.error("Both AI providers failed", {
          primaryError: error,
          fallbackError,
        });
        throw new Error("All AI providers failed. Please try again later.");
      }
    }
  }

  /**
   * Generate streaming text with fallback
   */
  async streamText(
    prompt: string,
    options: StreamingOptions = {}
  ): Promise<AIResponse> {
    const { ...aiOptions } = options;

    const primaryProvider = this.getPrimaryProvider();
    const fallbackProvider =
      primaryProvider === "anthropic" ? "openai" : "anthropic";

    try {
      return await this.callProvider(
        primaryProvider,
        "streamText",
        prompt,
        aiOptions
      );
    } catch (error) {
      logger.warn(
        `Primary provider (${primaryProvider}) failed for streaming, trying fallback`,
        { error }
      );

      try {
        return await this.callProvider(fallbackProvider, "streamText", prompt, {
          ...aiOptions,
          model: aiOptions.model || config.ai.fallbackModel,
        });
      } catch (fallbackError) {
        logger.error("Both AI providers failed for streaming", {
          primaryError: error,
          fallbackError,
        });
        throw new Error(
          "All AI providers failed for streaming. Please try again later."
        );
      }
    }
  }

  /**
   * Generate embeddings (OpenAI only)
   */
  async generateEmbedding(
    text: string,
    model: string = "text-embedding-3-small"
  ): Promise<{
    embedding: number[];
    usage: Omit<AIUsage, "outputTokens">;
  }> {
    if (!this.openai) {
      throw new Error("OpenAI client not available for embeddings");
    }

    const result = await this.openai.generateEmbedding(text, model);
    return {
      embedding: result.embedding,
      usage: {
        inputTokens: result.usage.inputTokens,
        totalTokens: result.usage.totalTokens,
      },
    };
  }

  /**
   * Get the primary provider based on configuration
   */
  private getPrimaryProvider(): "anthropic" | "openai" {
    // Prefer Anthropic if both are available and default model is Claude
    if (this.anthropic && config.ai.defaultModel.includes("claude")) {
      return "anthropic";
    }

    // Otherwise prefer OpenAI if available
    if (this.openai) {
      return "openai";
    }

    // Fallback to Anthropic
    return "anthropic";
  }

  /**
   * Call a specific provider method
   */
  private async callProvider(
    provider: "anthropic" | "openai",
    method: "generateText" | "streamText",
    prompt: string,
    options: any
  ): Promise<AIResponse> {
    const client = provider === "anthropic" ? this.anthropic : this.openai;

    if (!client) {
      throw new Error(`${provider} client not available`);
    }

    const result = await client[method](prompt, options);

    return {
      content: result.content,
      usage: result.usage,
      model:
        options.model ||
        (provider === "anthropic"
          ? config.ai.defaultModel
          : config.ai.fallbackModel),
      provider,
    };
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: "anthropic" | "openai"): boolean {
    return provider === "anthropic" ? !!this.anthropic : !!this.openai;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): Array<"anthropic" | "openai"> {
    const providers: Array<"anthropic" | "openai"> = [];
    if (this.anthropic) providers.push("anthropic");
    if (this.openai) providers.push("openai");
    return providers;
  }
}

// Singleton instance
export const aiService = new AIService();
