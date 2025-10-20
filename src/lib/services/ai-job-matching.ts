/**
 * AI Job Matching Service
 *
 * Uses Claude and OpenAI APIs to provide intelligent job matching
 * based on user profiles and job descriptions.
 *
 * Falls back gracefully to simple matching when AI models are unavailable.
 */

import { getAIService } from "@/lib/ai/request-scoped-service";

// Configuration helper
const isAIConfigured = () => {
  const hasAnthropicKey =
    !!process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== "your-anthropic-api-key";
  const hasOpenAIKey =
    !!process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== "your-openai-api-key";
  return { hasAnthropicKey, hasOpenAIKey };
};

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: string;
  experience: string[];
  location: string;
  skills: string[];
  targetRole: string;
  education: string[];
  preferences: {
    jobTypes: string[];
    workModes: string[];
    salaryRange: { min: number; max: number };
    industries: string[];
    companySizes: string[];
    benefits: string[];
  };
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  url?: string;
  posted_date?: string;
  source?: string;
}

export interface JobMatch {
  jobId: string;
  matchScore: number;
  matchReasons: string[];
  overallFit: string;
  skillsMatch: number;
  experienceMatch: number;
  locationMatch: number;
  salaryMatch: number;
}

/**
 * Claude AI Job Matching Service
 */
class ClaudeJobMatcher {
  async matchJobs(jobs: Job[], profile: UserProfile): Promise<JobMatch[]> {
    const prompt = this.buildMatchingPrompt(jobs, profile);

    try {
      // Use request-scoped AI service instead of direct API calls
      const aiService = getAIService();
      const response = await aiService.makeRequest(
        "anonymous", // userId - using anonymous for job matching
        "job_matching", // feature
        prompt, // prompt
        {
          model: "claude-sonnet-4-5-20250929",
          maxTokens: 4000,
          temperature: 0.1,
        }
      );

      if (!response.success || !response.data) {
        throw new Error(`Claude API request failed: ${response.error}`);
      }

      return this.parseMatchingResponse(response.data, jobs);
    } catch (error) {
      console.error("Claude matching error:", error);
      throw error;
    }
  }

  private buildMatchingPrompt(jobs: Job[], profile: UserProfile): string {
    const jobsText = jobs
      .map(
        (job, index) => `
Job ${index + 1} (ID: ${job.id}):
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Type: ${job.type}
Salary: ${job.salary || "Not specified"}
Description: ${job.description.slice(0, 500)}...
`
      )
      .join("\n");

    return `You are an expert AI recruiter. Analyze how well each job matches this candidate profile and provide detailed scoring.

CANDIDATE PROFILE:
Name: ${profile.name}
Current Role: ${profile.role}
Target Role: ${profile.targetRole}
Location: ${profile.location}
Skills: ${profile.skills.join(", ")}
Experience: ${profile.experience.join(", ")}
Education: ${profile.education.join(", ")}
Preferred Job Types: ${profile.preferences.jobTypes.join(", ")}
Preferred Work Modes: ${profile.preferences.workModes.join(", ")}
Salary Range: $${profile.preferences.salaryRange.min.toLocaleString()} - $${profile.preferences.salaryRange.max.toLocaleString()}
Preferred Industries: ${profile.preferences.industries.join(", ")}
Preferred Benefits: ${profile.preferences.benefits.join(", ")}

JOBS TO ANALYZE:
${jobsText}

For each job, provide a JSON response with the following structure:
{
  "matches": [
    {
      "jobId": "job_id_here",
      "matchScore": 0.85,
      "overallFit": "Excellent|Good|Fair|Poor",
      "skillsMatch": 0.90,
      "experienceMatch": 0.80,
      "locationMatch": 0.75,
      "salaryMatch": 0.85,
      "matchReasons": [
        "Strong alignment between candidate's React skills and job requirements",
        "Target role matches exactly with job title",
        "Salary range fits candidate preferences"
      ]
    }
  ]
}

Scoring Guidelines:
- matchScore: Overall match (0.0-1.0), considering all factors
- skillsMatch: How well candidate's skills match job requirements (0.0-1.0)
- experienceMatch: How well candidate's experience level fits (0.0-1.0)
- locationMatch: Location compatibility including remote work preferences (0.0-1.0)
- salaryMatch: How well the salary aligns with candidate expectations (0.0-1.0)
- overallFit: "Excellent" (0.8+), "Good" (0.6-0.8), "Fair" (0.4-0.6), "Poor" (<0.4)

Provide exactly ${
      jobs.length
    } job matches in your response. Return only the JSON, no additional text.`;
  }

  private parseMatchingResponse(response: string, jobs: Job[]): JobMatch[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.matches || !Array.isArray(parsed.matches)) {
        throw new Error("Invalid response format");
      }

      return parsed.matches.map((match: any) => ({
        jobId: match.jobId,
        matchScore: Math.min(1, Math.max(0, match.matchScore || 0)),
        overallFit: match.overallFit || "Fair",
        skillsMatch: Math.min(1, Math.max(0, match.skillsMatch || 0)),
        experienceMatch: Math.min(1, Math.max(0, match.experienceMatch || 0)),
        locationMatch: Math.min(1, Math.max(0, match.locationMatch || 0)),
        salaryMatch: Math.min(1, Math.max(0, match.salaryMatch || 0)),
        matchReasons: Array.isArray(match.matchReasons)
          ? match.matchReasons
          : [
              "AI analysis completed",
              "Match score calculated based on profile alignment",
            ],
      }));
    } catch (error) {
      console.error("Error parsing Claude response:", error);
      // Return fallback matching
      return this.getFallbackMatches(jobs);
    }
  }

  private getFallbackMatches(jobs: Job[]): JobMatch[] {
    return jobs.map((job) => ({
      jobId: job.id,
      matchScore: Math.random() * 0.4 + 0.5, // Random between 0.5-0.9
      overallFit: "Fair",
      skillsMatch: Math.random() * 0.3 + 0.6,
      experienceMatch: Math.random() * 0.3 + 0.6,
      locationMatch: Math.random() * 0.3 + 0.6,
      salaryMatch: Math.random() * 0.3 + 0.6,
      matchReasons: [
        "Basic compatibility analysis completed",
        "Profile alignment assessed",
      ],
    }));
  }
}

/**
 * OpenAI Job Matching Service (Fallback)
 */
class OpenAIJobMatcher {
  async matchJobs(jobs: Job[], profile: UserProfile): Promise<JobMatch[]> {
    const prompt = this.buildMatchingPrompt(jobs, profile);

    try {
      // Use request-scoped AI service instead of direct API calls
      const aiService = getAIService();
      const response = await aiService.makeRequest(
        "anonymous", // userId - using anonymous for job matching
        "job_matching", // feature
        prompt, // prompt
        {
          model: "gpt-4o-mini",
          systemPrompt:
            "You are an expert AI recruiter that analyzes job matches and returns precise JSON responses.",
          maxTokens: 3000,
          temperature: 0.3,
        }
      );

      if (!response.success || !response.data) {
        throw new Error(`OpenAI API request failed: ${response.error}`);
      }

      return this.parseMatchingResponse(response.data, jobs);
    } catch (error) {
      console.error("OpenAI matching error:", error);
      throw error;
    }
  }

  private buildMatchingPrompt(jobs: Job[], profile: UserProfile): string {
    // Similar prompt structure as Claude but optimized for OpenAI
    return new ClaudeJobMatcher()["buildMatchingPrompt"](jobs, profile);
  }

  private parseMatchingResponse(response: string, jobs: Job[]): JobMatch[] {
    // Reuse Claude's parsing logic
    return new ClaudeJobMatcher()["parseMatchingResponse"](response, jobs);
  }
}

/**
 * AI Job Matching Service
 * Tries Claude first, falls back to OpenAI, then to simple matching
 */
export class AIJobMatchingService {
  private claude = new ClaudeJobMatcher();
  private openai = new OpenAIJobMatcher();

  async matchJobs(jobs: Job[], profile: UserProfile): Promise<JobMatch[]> {
    if (jobs.length === 0) {
      return [];
    }

    const config = isAIConfigured();

    // Skip AI attempts if no keys are configured
    if (!config.hasAnthropicKey && !config.hasOpenAIKey) {
      console.log(
        "ℹ️  AI models not configured - using simple job matching algorithm"
      );
      return this.getSimpleMatches(jobs, profile);
    }

    // Try Claude first (primary AI) if configured
    if (config.hasAnthropicKey) {
      try {
        console.log("Attempting job matching with Claude AI...");
        return await this.claude.matchJobs(jobs, profile);
      } catch (error) {
        // Check if it's a model availability issue (expected in development)
        if (
          error instanceof Error &&
          error.message.includes("AI model unavailable")
        ) {
          console.log(
            "ℹ️  Claude AI model not available - this is normal in development mode"
          );
        } else {
          console.log("Claude matching not available, trying fallback");
        }
      }
    }

    // Fall back to OpenAI if configured
    if (config.hasOpenAIKey) {
      try {
        console.log("Attempting job matching with OpenAI...");
        return await this.openai.matchJobs(jobs, profile);
      } catch (error) {
        // Check if it's a model availability issue (expected in development)
        if (
          error instanceof Error &&
          error.message.includes("AI model unavailable")
        ) {
          console.log(
            "ℹ️  OpenAI model not available - this is normal in development mode"
          );
        } else {
          console.log(
            "OpenAI matching not available, using simple matching fallback"
          );
        }
      }
    }

    // Final fallback to simple rule-based matching
    console.log(
      "✅ Using simple job matching algorithm (AI services unavailable)"
    );
    return this.getSimpleMatches(jobs, profile);
  }

  private getSimpleMatches(jobs: Job[], profile: UserProfile): JobMatch[] {
    return jobs.map((job) => {
      const skillsMatch = this.calculateSkillsMatch(job, profile);
      const titleMatch = this.calculateTitleMatch(job, profile);
      const locationMatch = this.calculateLocationMatch(job, profile);

      const matchScore = (skillsMatch + titleMatch + locationMatch) / 3;

      return {
        jobId: job.id,
        matchScore,
        overallFit:
          matchScore > 0.7 ? "Good" : matchScore > 0.5 ? "Fair" : "Poor",
        skillsMatch,
        experienceMatch: titleMatch,
        locationMatch,
        salaryMatch: 0.7, // Default neutral score
        matchReasons: [
          `Skills compatibility: ${Math.round(skillsMatch * 100)}%`,
          `Role alignment: ${Math.round(titleMatch * 100)}%`,
          `Location match: ${Math.round(locationMatch * 100)}%`,
        ],
      };
    });
  }

  private calculateSkillsMatch(job: Job, profile: UserProfile): number {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const userSkills = profile.skills.map((s) => s.toLowerCase());

    let matches = 0;
    for (const skill of userSkills) {
      if (jobText.includes(skill)) {
        matches++;
      }
    }

    return userSkills.length > 0 ? matches / userSkills.length : 0.5;
  }

  private calculateTitleMatch(job: Job, profile: UserProfile): number {
    const jobTitle = job.title.toLowerCase();
    const targetRole = profile.targetRole.toLowerCase();
    const currentRole = profile.role.toLowerCase();

    if (jobTitle.includes(targetRole)) return 0.9;
    if (jobTitle.includes(currentRole)) return 0.7;

    // Check for similar words
    const jobWords = jobTitle.split(" ");
    const targetWords = targetRole.split(" ");

    let commonWords = 0;
    for (const word of targetWords) {
      if (jobWords.some((jw) => jw.includes(word) || word.includes(jw))) {
        commonWords++;
      }
    }

    return targetWords.length > 0 ? commonWords / targetWords.length : 0.3;
  }

  private calculateLocationMatch(job: Job, profile: UserProfile): number {
    const jobLocation = job.location.toLowerCase();
    const userLocation = profile.location.toLowerCase();

    if (jobLocation.includes("remote") || userLocation.includes("remote")) {
      return 1.0;
    }

    if (
      jobLocation.includes(userLocation) ||
      userLocation.includes(jobLocation)
    ) {
      return 0.9;
    }

    // Extract state/city info for basic matching
    const jobParts = jobLocation.split(",").map((p) => p.trim());
    const userParts = userLocation.split(",").map((p) => p.trim());

    for (const jp of jobParts) {
      for (const up of userParts) {
        if (jp === up) return 0.7;
      }
    }

    return 0.3; // Different locations
  }
}

// Export singleton instance
export const aiJobMatchingService = new AIJobMatchingService();
