import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";
import { logger } from "@/lib/utils/logger";

export class AnthropicClient {
  private client: Anthropic;

  constructor() {
    if (!config.ai.anthropicApiKey) {
      throw new Error("Anthropic API key is not configured");
    }

    this.client = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });
  }

  async generateText(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<{
    content: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
  }> {
    try {
      const {
        maxTokens = 1000,
        temperature = 0.7,
        model = config.ai.defaultModel,
      } = options;

      logger.info("Anthropic API call started", {
        model,
        maxTokens,
        temperature,
        promptLength: prompt.length,
      });

      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
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

      const usage = {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      };

      logger.info("Anthropic API call completed", {
        model,
        usage,
        contentLength: content.text.length,
      });

      return {
        content: content.text,
        usage,
      };
    } catch (error) {
      logger.error("Anthropic API call failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        prompt: prompt.substring(0, 100) + "...",
      });
      throw error;
    }
  }

  async streamText(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
      onChunk?: (chunk: string) => void;
    } = {}
  ): Promise<{
    content: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
  }> {
    try {
      const {
        maxTokens = 1000,
        temperature = 0.7,
        model = config.ai.defaultModel,
        onChunk,
      } = options;

      logger.info("Anthropic streaming API call started", {
        model,
        maxTokens,
        temperature,
        promptLength: prompt.length,
      });

      const stream = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: true,
      });

      let fullContent = "";
      let usage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };

      for await (const event of stream) {
        if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            const chunk = event.delta.text;
            fullContent += chunk;
            onChunk?.(chunk);
          }
        } else if (event.type === "message_delta") {
          if (event.usage) {
            const eventUsage = event.usage as any; // Type assertion due to SDK type inconsistency
            usage = {
              inputTokens: eventUsage.input_tokens || 0,
              outputTokens: eventUsage.output_tokens || 0,
              totalTokens:
                (eventUsage.input_tokens || 0) +
                (eventUsage.output_tokens || 0),
            };
          }
        }
      }

      logger.info("Anthropic streaming API call completed", {
        model,
        usage,
        contentLength: fullContent.length,
      });

      return {
        content: fullContent,
        usage,
      };
    } catch (error) {
      logger.error("Anthropic streaming API call failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        prompt: prompt.substring(0, 100) + "...",
      });
      throw error;
    }
  }
}

// Singleton instance
export const anthropicClient = new AnthropicClient();
