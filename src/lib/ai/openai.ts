import OpenAI from "openai";
import { config } from "@/lib/config";
import { logger } from "@/lib/utils/logger";

export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    if (!config.ai.openaiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    this.client = new OpenAI({
      apiKey: config.ai.openaiApiKey,
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
        model = config.ai.fallbackModel,
      } = options;

      logger.info("OpenAI API call started", {
        model,
        maxTokens,
        temperature,
        promptLength: prompt.length,
      });

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error("No content received from OpenAI");
      }

      const usage = {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      };

      logger.info("OpenAI API call completed", {
        model,
        usage,
        contentLength: choice.message.content.length,
      });

      return {
        content: choice.message.content,
        usage,
      };
    } catch (error) {
      logger.error("OpenAI API call failed", {
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
        model = config.ai.fallbackModel,
        onChunk,
      } = options;

      logger.info("OpenAI streaming API call started", {
        model,
        maxTokens,
        temperature,
        promptLength: prompt.length,
      });

      const stream = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        stream: true,
      });

      let fullContent = "";
      let usage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk?.(delta.content);
        }

        // Note: OpenAI streaming doesn't provide usage info in real-time
        // We'll estimate based on the content length
        if (chunk.usage) {
          usage = {
            inputTokens: chunk.usage.prompt_tokens || 0,
            outputTokens: chunk.usage.completion_tokens || 0,
            totalTokens: chunk.usage.total_tokens || 0,
          };
        }
      }

      // Estimate usage if not provided
      if (usage.totalTokens === 0) {
        const estimatedInputTokens = Math.ceil(prompt.length / 4);
        const estimatedOutputTokens = Math.ceil(fullContent.length / 4);
        usage = {
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
          totalTokens: estimatedInputTokens + estimatedOutputTokens,
        };
      }

      logger.info("OpenAI streaming API call completed", {
        model,
        usage,
        contentLength: fullContent.length,
      });

      return {
        content: fullContent,
        usage,
      };
    } catch (error) {
      logger.error("OpenAI streaming API call failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        prompt: prompt.substring(0, 100) + "...",
      });
      throw error;
    }
  }

  async generateEmbedding(
    text: string,
    model: string = "text-embedding-3-small"
  ): Promise<{
    embedding: number[];
    usage: {
      inputTokens: number;
      totalTokens: number;
    };
  }> {
    try {
      logger.info("OpenAI embedding API call started", {
        model,
        textLength: text.length,
      });

      const response = await this.client.embeddings.create({
        model,
        input: text,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error("No embedding received from OpenAI");
      }

      const usage = {
        inputTokens: response.usage?.prompt_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      };

      logger.info("OpenAI embedding API call completed", {
        model,
        usage,
        embeddingDimensions: embedding.length,
      });

      return {
        embedding,
        usage,
      };
    } catch (error) {
      logger.error("OpenAI embedding API call failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        text: text.substring(0, 100) + "...",
      });
      throw error;
    }
  }
}

// Singleton instance
export const openaiClient = new OpenAIClient();
