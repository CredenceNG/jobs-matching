/**
 * Job Matching AI Service
 *
 * Specialized AI service for matching jobs to user profiles.
 * Uses Claude/GPT for intelligent job analysis and scoring.
 *
 * @description AI-powered job matching with detailed analysis
 */

import { aiService } from "./ai-service";
import { AIFeature } from "./config";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface UserProfile {
  skills: string[];
  experience: string[];
  education: string[];
  preferences: {
    location?: string;
    remote?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    jobTypes?: string[];
    industries?: string[];
  };
  resumeText?: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  remote: boolean;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  jobType: string;
  industry?: string;
  url: string;
}

export interface JobMatch {
  jobId: string;
  userId: string;
  matchScore: number;
  matchReasons: string[];
  skillsMatch: {
    matching: string[];
    missing: string[];
    transferable: string[];
  };
  salaryMatch: {
    score: number;
    explanation: string;
  };
  locationMatch: {
    score: number;
    explanation: string;
  };
  overallAnalysis: string;
  recommendations: string[];
  confidenceScore: number;
}

export interface JobMatchingResponse {
  matches: JobMatch[];
  summary: {
    totalJobs: number;
    goodMatches: number;
    averageScore: number;
    topRecommendations: string[];
  };
}

// =============================================================================
// JOB MATCHING SERVICE
// =============================================================================

export class JobMatchingService {
  /**
   * Find and score job matches for a user
   */
  async findJobMatches(
    userId: string,
    userProfile: UserProfile,
    jobs: JobListing[],
    options: {
      maxResults?: number;
      minScore?: number;
      includeAnalysis?: boolean;
    } = {}
  ): Promise<JobMatchingResponse> {
    const { maxResults = 20, minScore = 0.6, includeAnalysis = true } = options;

    // Process jobs in batches to manage AI costs and token limits
    const batchSize = 5;
    const allMatches: JobMatch[] = [];

    for (let i = 0; i < jobs.length; i += batchSize) {
      const jobBatch = jobs.slice(i, i + batchSize);
      const batchMatches = await this.processJobBatch(
        userId,
        userProfile,
        jobBatch,
        includeAnalysis
      );
      allMatches.push(...batchMatches);
    }

    // Filter and sort matches
    const filteredMatches = allMatches
      .filter((match) => match.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxResults);

    // Generate summary
    const summary = {
      totalJobs: jobs.length,
      goodMatches: filteredMatches.length,
      averageScore:
        filteredMatches.length > 0
          ? filteredMatches.reduce((sum, match) => sum + match.matchScore, 0) /
            filteredMatches.length
          : 0,
      topRecommendations: this.generateTopRecommendations(filteredMatches),
    };

    return {
      matches: filteredMatches,
      summary,
    };
  }

  /**
   * Process a batch of jobs for matching
   */
  private async processJobBatch(
    userId: string,
    userProfile: UserProfile,
    jobs: JobListing[],
    includeAnalysis: boolean
  ): Promise<JobMatch[]> {
    const systemPrompt = this.buildJobMatchingSystemPrompt();
    const userPrompt = this.buildJobMatchingUserPrompt(
      userProfile,
      jobs,
      includeAnalysis
    );

    const response = await aiService.makeRequest<string>(
      userId,
      "job_matching" as AIFeature,
      userPrompt,
      {
        systemPrompt,
        complexity: "complex",
        temperature: 0.3,
        maxTokens: 4000,
      }
    );

    if (!response.success || !response.data) {
      console.error("Job matching AI request failed:", response.error);
      return jobs.map((job) => this.createFallbackMatch(job.id, userId));
    }

    try {
      const parsedResponse = JSON.parse(response.data);
      return this.validateAndProcessMatches(parsedResponse, userId);
    } catch (error) {
      console.error("Failed to parse job matching response:", error);
      return jobs.map((job) => this.createFallbackMatch(job.id, userId));
    }
  }

  /**
   * Build system prompt for job matching
   */
  private buildJobMatchingSystemPrompt(): string {
    return `You are an expert career advisor and job matching specialist. Your role is to analyze job listings against a user's profile and provide detailed, accurate match scores.

SCORING CRITERIA (0.0 - 1.0):
- Skills Match (35%): How well user's skills align with job requirements
- Experience Match (25%): Relevance of user's experience to the role
- Location/Remote Match (15%): Geographic and remote work compatibility
- Salary Match (15%): Alignment with salary expectations
- Education Match (10%): Educational background fit

RESPONSE FORMAT:
Return valid JSON only, no additional text:
{
  "matches": [
    {
      "jobId": "string",
      "matchScore": 0.85,
      "matchReasons": ["Strong technical skills match", "Relevant experience"],
      "skillsMatch": {
        "matching": ["React", "Node.js"],
        "missing": ["Docker"],
        "transferable": ["Angular (transferable to React)"]
      },
      "salaryMatch": {
        "score": 0.9,
        "explanation": "Salary range aligns well with expectations"
      },
      "locationMatch": {
        "score": 1.0,
        "explanation": "Remote position matches preference"
      },
      "overallAnalysis": "Excellent match with strong technical alignment",
      "recommendations": ["Highlight React experience", "Learn Docker basics"],
      "confidenceScore": 0.88
    }
  ]
}

Be thorough, objective, and provide actionable insights. Focus on both strengths and growth opportunities.`;
  }

  /**
   * Build user prompt for job matching
   */
  private buildJobMatchingUserPrompt(
    userProfile: UserProfile,
    jobs: JobListing[],
    includeAnalysis: boolean
  ): string {
    let prompt = `Analyze these job listings against my profile and provide match scores:\n\n`;

    // Add user profile
    prompt += `MY PROFILE:\n`;
    prompt += `Skills: ${userProfile.skills.join(", ")}\n`;
    prompt += `Experience: ${userProfile.experience.join("; ")}\n`;
    prompt += `Education: ${userProfile.education.join("; ")}\n`;

    if (userProfile.preferences.location) {
      prompt += `Preferred Location: ${userProfile.preferences.location}\n`;
    }
    if (userProfile.preferences.remote) {
      prompt += `Remote Work: ${
        userProfile.preferences.remote ? "Preferred" : "Not preferred"
      }\n`;
    }
    if (
      userProfile.preferences.salaryMin ||
      userProfile.preferences.salaryMax
    ) {
      prompt += `Salary Range: $${userProfile.preferences.salaryMin || 0} - $${
        userProfile.preferences.salaryMax || "No max"
      }\n`;
    }

    if (userProfile.resumeText) {
      prompt += `\nRESUME SUMMARY:\n${userProfile.resumeText.slice(
        0,
        1000
      )}...\n`;
    }

    // Add job listings
    prompt += `\n\nJOB LISTINGS TO ANALYZE:\n`;
    jobs.forEach((job, index) => {
      prompt += `\nJob ${index + 1}:\n`;
      prompt += `ID: ${job.id}\n`;
      prompt += `Title: ${job.title}\n`;
      prompt += `Company: ${job.company}\n`;
      prompt += `Location: ${job.location} (Remote: ${job.remote})\n`;
      if (job.salary) {
        prompt += `Salary: $${job.salary.min || "N/A"} - $${
          job.salary.max || "N/A"
        }\n`;
      }
      prompt += `Requirements: ${job.requirements.join(", ")}\n`;
      prompt += `Description: ${job.description.slice(0, 500)}...\n`;
    });

    if (includeAnalysis) {
      prompt += `\n\nProvide detailed analysis for each match including specific recommendations for improving candidacy.`;
    } else {
      prompt += `\n\nProvide concise match scores and key points only.`;
    }

    return prompt;
  }

  /**
   * Validate and process AI matches response
   */
  private validateAndProcessMatches(
    parsedResponse: any,
    userId: string
  ): JobMatch[] {
    if (!parsedResponse.matches || !Array.isArray(parsedResponse.matches)) {
      return [];
    }

    return parsedResponse.matches.map((match: any) => ({
      jobId: match.jobId || "",
      userId,
      matchScore: Math.min(Math.max(match.matchScore || 0, 0), 1),
      matchReasons: Array.isArray(match.matchReasons) ? match.matchReasons : [],
      skillsMatch: {
        matching: Array.isArray(match.skillsMatch?.matching)
          ? match.skillsMatch.matching
          : [],
        missing: Array.isArray(match.skillsMatch?.missing)
          ? match.skillsMatch.missing
          : [],
        transferable: Array.isArray(match.skillsMatch?.transferable)
          ? match.skillsMatch.transferable
          : [],
      },
      salaryMatch: {
        score: Math.min(Math.max(match.salaryMatch?.score || 0, 0), 1),
        explanation:
          match.salaryMatch?.explanation || "No salary information available",
      },
      locationMatch: {
        score: Math.min(Math.max(match.locationMatch?.score || 0, 0), 1),
        explanation:
          match.locationMatch?.explanation ||
          "No location information available",
      },
      overallAnalysis: match.overallAnalysis || "No analysis available",
      recommendations: Array.isArray(match.recommendations)
        ? match.recommendations
        : [],
      confidenceScore: Math.min(
        Math.max(match.confidenceScore || match.matchScore || 0, 0),
        1
      ),
    }));
  }

  /**
   * Create fallback match when AI fails
   */
  private createFallbackMatch(jobId: string, userId: string): JobMatch {
    return {
      jobId,
      userId,
      matchScore: 0.5,
      matchReasons: ["Basic compatibility check"],
      skillsMatch: {
        matching: [],
        missing: [],
        transferable: [],
      },
      salaryMatch: {
        score: 0.5,
        explanation: "Unable to analyze salary compatibility",
      },
      locationMatch: {
        score: 0.5,
        explanation: "Unable to analyze location compatibility",
      },
      overallAnalysis: "Analysis unavailable - manual review recommended",
      recommendations: ["Review job requirements manually"],
      confidenceScore: 0.3,
    };
  }

  /**
   * Generate top recommendations from matches
   */
  private generateTopRecommendations(matches: JobMatch[]): string[] {
    const recommendations = new Set<string>();

    // Collect all recommendations from top matches
    matches.slice(0, 5).forEach((match) => {
      match.recommendations.forEach((rec) => recommendations.add(rec));
    });

    // Convert to array and limit to top 5
    return Array.from(recommendations).slice(0, 5);
  }

  /**
   * Get match explanation for a specific job
   */
  async getJobMatchExplanation(
    userId: string,
    userProfile: UserProfile,
    job: JobListing
  ): Promise<{
    explanation: string;
    improvementTips: string[];
    dealBreakers: string[];
  }> {
    const systemPrompt = `You are a career counselor providing detailed job match explanations. 

Focus on:
1. Why this job is or isn't a good fit
2. Specific improvement tips to become a stronger candidate
3. Any potential deal-breakers or concerns

Be encouraging but honest about gaps and challenges.`;

    const userPrompt = `Explain why this job matches (or doesn't match) my profile:

MY PROFILE:
Skills: ${userProfile.skills.join(", ")}
Experience: ${userProfile.experience.join("; ")}
Education: ${userProfile.education.join("; ")}

JOB:
Title: ${job.title}
Company: ${job.company}
Requirements: ${job.requirements.join(", ")}
Description: ${job.description}

Provide detailed explanation with specific improvement tips.`;

    const response = await aiService.makeRequest<string>(
      userId,
      "job_matching" as AIFeature,
      userPrompt,
      {
        systemPrompt,
        complexity: "simple",
        temperature: 0.5,
        maxTokens: 1000,
      }
    );

    if (!response.success) {
      return {
        explanation: "Unable to generate detailed explanation at this time.",
        improvementTips: ["Review job requirements manually"],
        dealBreakers: [],
      };
    }

    // Parse the response (implement based on expected format)
    // For now, return the raw response
    return {
      explanation: response.data || "No explanation available",
      improvementTips: ["Continue developing relevant skills"],
      dealBreakers: [],
    };
  }
}

// Export singleton instance
export const jobMatchingService = new JobMatchingService();
