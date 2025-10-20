/**
 * AI-Powered Job Scoring Service
 *
 * Step 3 of the job matching process:
 * Uses Claude/GPT to score how well each job matches the candidate
 */

import { getAIService } from "@/lib/ai/request-scoped-service";
import { ResumeAnalysis } from "./ai-resume-analyzer";

export interface JobScore {
  jobId: string;
  overallScore: number; // 0-100
  breakdown: {
    skillsMatch: number; // 0-100
    experienceMatch: number; // 0-100
    roleAlignment: number; // 0-100
    industryFit: number; // 0-100
    careerGrowth: number; // 0-100
  };
  strengths: string[];
  concerns: string[];
  bridgeGaps?: string[]; // AI-generated steps to address concerns
  recommendation:
    | "Excellent Match"
    | "Strong Match"
    | "Good Match"
    | "Fair Match"
    | "Weak Match";
  shouldApply: boolean;
  reasoning: string;
}

export interface UserPreferences {
  preferredRole?: string;
  preferredLocation?: string;
  employmentType?: string;
  remoteOnly?: boolean;
}

export class AIJobScorer {
  /**
   * Score a job against candidate profile using AI
   */
  async scoreJob(
    job: any,
    candidateProfile: ResumeAnalysis,
    userPreferences?: UserPreferences
  ): Promise<JobScore> {
    const prompt = this.buildScoringPrompt(job, candidateProfile, userPreferences);

    try {
      const aiService = getAIService();
      const response = await aiService.makeRequest<string>(
        "anonymous-user",
        "job_matching" as any,
        prompt,
        {
          maxTokens: 1500,
          temperature: 0.2, // Low temperature for consistent scoring
        }
      );

      if (!response.success || !response.data) {
        // Fallback to basic scoring if AI fails
        return this.basicScoring(job, candidateProfile);
      }

      // Clean AI response (remove markdown code blocks if present)
      let cleanedData = response.data.trim();
      if (cleanedData.startsWith('```')) {
        // Remove markdown code blocks: ```json\n{...}\n``` or ```{...}```
        cleanedData = cleanedData
          .replace(/^```json?\n?/i, '')
          .replace(/\n?```$/, '')
          .trim();
      }

      // Parse cleaned AI response
      const score = JSON.parse(cleanedData);
      return this.validateScore(score, job.id);
    } catch (error) {
      console.error("AI job scoring error:", error);
      // Fallback to basic scoring
      return this.basicScoring(job, candidateProfile);
    }
  }

  /**
   * Score multiple jobs in parallel (batch processing)
   */
  async scoreJobs(
    jobs: any[],
    candidateProfile: ResumeAnalysis,
    userPreferences?: UserPreferences
  ): Promise<JobScore[]> {
    console.log(`🎯 Scoring ${jobs.length} jobs with AI...`);

    // Process in batches to avoid overwhelming the AI service
    const batchSize = 5;
    const scores: JobScore[] = [];

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchScores = await Promise.all(
        batch.map((job) => this.scoreJob(job, candidateProfile, userPreferences))
      );
      scores.push(...batchScores);

      console.log(
        `✅ Scored ${Math.min(i + batchSize, jobs.length)}/${jobs.length} jobs`
      );
    }

    return scores;
  }

  /**
   * Build AI prompt for job scoring
   */
  private buildScoringPrompt(job: any, profile: ResumeAnalysis, userPreferences?: UserPreferences): string {
    return `You are an expert career advisor analyzing job fit. Score how well this job matches the user's profile.

YOUR PROFILE:
- Job Titles: ${profile.jobTitles.join(", ")}
- Experience Level: ${profile.experienceLevel}
- Years of Experience: ${profile.yearsOfExperience || "Not specified"}
- Key Skills: ${profile.skills
      .slice(0, 10)
      .map((s) => s.name)
      .join(", ")}
- Industries: ${profile.industries.join(", ")}
- Specializations: ${profile.specializations.join(", ")}
- Career Goal: ${profile.careerGoal || "Not specified"}
- Location Preference: ${userPreferences?.preferredLocation || profile.location || "Not specified"}

${userPreferences ? `YOUR PREFERENCES (IMPORTANT - Weight heavily in scoring):
- Preferred Role: ${userPreferences.preferredRole || "Not specified"}
- Preferred Location: ${userPreferences.preferredLocation || "Not specified"}
- Employment Type: ${userPreferences.employmentType || "Any"}
- Remote Only: ${userPreferences.remoteOnly ? "YES - Must be remote" : "No preference"}
` : ''}
JOB LISTING:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location || "Not specified"}
- Type: ${job.type || "Full-time"}
- Salary: ${job.salary || "Not specified"}
- Description: ${job.description?.substring(0, 1500) || "No description"}

Analyze and score this match on a scale of 0-100:
${userPreferences ? '\nIMPORTANT: Consider user preferences heavily in scoring. If location/role/type does not match preferences, reduce relevant scores significantly.' : ''}

1. Skills Match (0-100):
   - How many required/preferred skills do you have?
   - Are you proficient in key technologies/tools mentioned?

2. Experience Match (0-100):
   - Does your experience level align with requirements?
   - Do you have relevant years of experience?

3. Role Alignment (0-100):
   - Does the job title/role match your career trajectory?
   - Are the responsibilities similar to your past roles?

4. Industry Fit (0-100):
   - Does your industry experience match?
   - Will you understand the business context?

5. Career Growth (0-100):
   - Is this a logical next step in your career?
   - Does it offer growth opportunities?

Return as valid JSON with PERSONALIZED language (use "you/your" instead of "the candidate"):
{
  "overallScore": 0-100,
  "breakdown": {
    "skillsMatch": 0-100,
    "experienceMatch": 0-100,
    "roleAlignment": 0-100,
    "industryFit": 0-100,
    "careerGrowth": 0-100
  },
  "strengths": [
    "List 3-5 specific reasons why this is a good match FOR YOU",
    "Use 'You have...' or 'Your experience in...' - be specific and personal"
  ],
  "concerns": [
    "List any potential concerns or gaps IN YOUR PROFILE",
    "Use 'You may need...' or 'Your background lacks...'",
    "Be honest about mismatches",
    "Empty array if no concerns"
  ],
  "bridgeGaps": [
    "CRITICAL: Provide SPECIFIC, ACTIONABLE steps for YOU to address YOUR ACTUAL gaps",
    "Use second-person language: 'Complete...', 'Build...', 'Learn...'",
    "DO NOT give generic advice like 'engage in networking' or 'pursue certifications'",
    "GOOD examples:",
    "  - 'Complete AWS Certified Solutions Architect course on Udemy to fill your cloud infrastructure gap'",
    "  - 'Build a full-stack e-commerce project using React + Node.js to demonstrate your web development skills'",
    "  - 'Learn Terraform through HashiCorp's official certification to match the IaC requirement'",
    "  - 'Take LinkedIn Learning course on Healthcare Compliance (HIPAA) to understand industry regulations'",
    "BAD examples (DO NOT USE):",
    "  - 'Consider exploring remote opportunities' (too vague)",
    "  - 'Engage in networking' (generic)",
    "  - 'Pursue certifications' (not specific)",
    "Focus on: specific courses, specific certifications (with names), specific technologies to learn, specific portfolio projects to build",
    "Reference the ACTUAL job requirements and YOUR ACTUAL missing skills",
    "Empty array if no significant gaps exist"
  ],
  "recommendation": "Excellent Match|Strong Match|Good Match|Fair Match|Weak Match",
  "shouldApply": true or false,
  "reasoning": "2-3 sentence explanation of overall fit and recommendation - use 'you/your' language"
}

CRITICAL TONE REQUIREMENTS:
- Write in second person ("you", "your") throughout ALL fields
- Example: "You have strong experience in..." NOT "The candidate has..."
- Example: "Your background in Agile..." NOT "The candidate's background..."
- Be personal, direct, and conversational while remaining professional

CRITICAL INSTRUCTIONS FOR bridgeGaps:
- Each step MUST mention specific courses, certifications, technologies, or projects by name
- Each step MUST directly address a gap between YOUR profile and THIS specific job's requirements
- Use imperative verbs: "Complete...", "Build...", "Learn...", "Take..."
- DO NOT use vague phrases like "explore opportunities", "engage in networking", "pursue certifications", "enhance understanding"
- If you already have all required skills, return empty array for bridgeGaps

Return ONLY valid JSON, no additional text.`;
  }

  /**
   * Validate score response from AI
   */
  private validateScore(score: any, jobId: string): JobScore {
    return {
      jobId,
      overallScore: this.clampScore(score.overallScore || 0),
      breakdown: {
        skillsMatch: this.clampScore(score.breakdown?.skillsMatch || 0),
        experienceMatch: this.clampScore(score.breakdown?.experienceMatch || 0),
        roleAlignment: this.clampScore(score.breakdown?.roleAlignment || 0),
        industryFit: this.clampScore(score.breakdown?.industryFit || 0),
        careerGrowth: this.clampScore(score.breakdown?.careerGrowth || 0),
      },
      strengths: Array.isArray(score.strengths)
        ? score.strengths.filter(Boolean)
        : [],
      concerns: Array.isArray(score.concerns)
        ? score.concerns.filter(Boolean)
        : [],
      bridgeGaps: Array.isArray(score.bridgeGaps)
        ? score.bridgeGaps.filter(Boolean)
        : [],
      recommendation: score.recommendation || "Fair Match",
      shouldApply: score.shouldApply === true,
      reasoning: score.reasoning || "",
    };
  }

  /**
   * Clamp score between 0-100
   */
  private clampScore(score: number): number {
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Basic fallback scoring if AI is unavailable
   */
  private basicScoring(job: any, profile: ResumeAnalysis): JobScore {
    const jobText = (job.title + " " + job.description).toLowerCase();
    const profileSkills = profile.skills.map((s) => s.name.toLowerCase());

    // Count skill matches
    const matchingSkills = profileSkills.filter((skill) =>
      jobText.includes(skill)
    );
    const skillsMatch = Math.min(
      (matchingSkills.length / profileSkills.length) * 100,
      100
    );

    // Basic scoring
    const overallScore = Math.round(skillsMatch * 0.6 + 40); // 40 base + up to 60 from skills

    return {
      jobId: job.id,
      overallScore,
      breakdown: {
        skillsMatch: Math.round(skillsMatch),
        experienceMatch: 70,
        roleAlignment: 60,
        industryFit: 60,
        careerGrowth: 60,
      },
      strengths: [`${matchingSkills.length} matching skills found`],
      concerns: ["AI scoring unavailable - using basic match"],
      recommendation: overallScore >= 70 ? "Good Match" : "Fair Match",
      shouldApply: overallScore >= 60,
      reasoning: "Basic scoring based on keyword matching.",
    };
  }
}

// Export singleton
export const aiJobScorer = new AIJobScorer();
