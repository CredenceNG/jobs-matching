/**
 * Request-Scoped AI Service Factory
 *
 * This solves the cookie scope error by creating AI service instances
 * only within request contexts, not at module load time.
 */

import { AIService } from "./ai-service";

let requestScopedAIService: AIService | null = null;

/**
 * Get or create an AI service instance within request scope
 * This avoids the "cookies called outside request scope" error
 */
export function getAIService(): AIService {
  if (!requestScopedAIService) {
    requestScopedAIService = new AIService();
  }
  return requestScopedAIService;
}

/**
 * Reset the AI service instance (useful for testing or cleanup)
 */
export function resetAIService(): void {
  requestScopedAIService = null;
}

/**
 * Check if AI service is available
 */
export function isAIServiceAvailable(): boolean {
  try {
    getAIService();
    return true;
  } catch (error) {
    console.error("AI Service not available:", error);
    return false;
  }
}
