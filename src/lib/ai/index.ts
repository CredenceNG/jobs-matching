/**
 * AI Services Index
 *
 * Central export point for all AI services.
 * Provides easy access to job matching, resume parsing, cover letter generation, and more.
 *
 * @description Main AI services module with unified exports
 */

// Core AI service and configuration
export * from "./config";
export * from "./ai-service";

// Specialized AI services
export * from "./job-matching";
export * from "./resume-parsing";
export * from "./cover-letter";
export * from "./resume-optimizer";

// Service instances (ready to use)
export { aiService } from "./ai-service";
export { jobMatchingService } from "./job-matching";
export { resumeParsingService } from "./resume-parsing";
export { coverLetterService } from "./cover-letter";
export { resumeOptimizerService } from "./resume-optimizer";

// =============================================================================
// UNIFIED AI SERVICES INTERFACE
// =============================================================================

import { aiService } from "./ai-service";
import { jobMatchingService } from "./job-matching";
import { resumeParsingService } from "./resume-parsing";
import { coverLetterService } from "./cover-letter";

/**
 * Unified AI services interface
 */
export class JobAIServices {
  public readonly ai = aiService;
  public readonly jobMatching = jobMatchingService;
  public readonly resumeParsing = resumeParsingService;
  public readonly coverLetter = coverLetterService;

  async getUserAIStats(userId: string) {
    return this.ai.getUserUsageStats(userId);
  }

  // Re-enabled - AI service now available with lazy initialization
  async canMakeRequest(userId: string): Promise<{
    canMake: boolean;
    reason?: string;
    quotaInfo?: any;
  }> {
    try {
      const stats = await this.getUserAIStats(userId);

      // Check daily limits
      if (stats.today.requests >= stats.quotas.daily.requests) {
        return {
          canMake: false,
          reason: "Daily request limit exceeded",
          quotaInfo: stats,
        };
      }

      if (stats.today.cost >= stats.quotas.daily.cost) {
        return {
          canMake: false,
          reason: "Daily cost limit exceeded",
          quotaInfo: stats,
        };
      }

      // Check monthly limits
      if (stats.month.requests >= stats.quotas.monthly.requests) {
        return {
          canMake: false,
          reason: "Monthly request limit exceeded",
          quotaInfo: stats,
        };
      }

      if (stats.month.cost >= stats.quotas.monthly.cost) {
        return {
          canMake: false,
          reason: "Monthly cost limit exceeded",
          quotaInfo: stats,
        };
      }

      return {
        canMake: true,
        quotaInfo: stats,
      };
    } catch (error) {
      console.error("Error checking AI request eligibility:", error);
      return {
        canMake: false,
        reason: "Unable to verify quota status",
      };
    }
  }

  getFeatureAvailability(subscriptionStatus: "free" | "premium") {
    const freeFeatures = ["job_matching", "resume_parsing"];

    const premiumFeatures = [
      "job_matching",
      "resume_parsing",
      "cover_letter_generation",
      "interview_preparation",
      "career_insights",
      "salary_analysis",
    ];

    return {
      available:
        subscriptionStatus === "premium" ? premiumFeatures : freeFeatures,
      unavailable:
        subscriptionStatus === "premium"
          ? []
          : premiumFeatures.filter((f) => !freeFeatures.includes(f)),
    };
  }
}

// Export singleton instance
export const jobAI = new JobAIServices();
