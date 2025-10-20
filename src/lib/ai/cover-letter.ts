/**
 * Cover Letter Generation AI Service
 *
 * Generates personalized cover letters using Claude/GPT.
 * Creates tailored content based on job requirements and user profile.
 *
 * @description AI-powered cover letter generation with personalization
 */

import { aiService } from "./ai-service";
import { AIFeature } from "./config";
import { ParsedResume } from "./resume-parsing";
import { JobListing } from "./job-matching";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface CoverLetterRequest {
  userProfile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    resumeData: ParsedResume;
  };
  jobListing: JobListing;
  tone: "professional" | "enthusiastic" | "confident" | "creative";
  length: "short" | "medium" | "long";
  focusAreas: string[];
  customInstructions?: string;
}

export interface GeneratedCoverLetter {
  content: string;
  structure: {
    introduction: string;
    body: string[];
    conclusion: string;
  };
  keyPoints: string[];
  personalizationElements: string[];
  suggestedEdits: string[];
}

export interface CoverLetterAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  keywords: {
    included: string[];
    missing: string[];
  };
  readabilityScore: number;
  personalizeationLevel: number;
}

// =============================================================================
// COVER LETTER GENERATION SERVICE
// =============================================================================

export class CoverLetterService {
  /**
   * Generate a personalized cover letter
   */
  async generateCoverLetter(
    userId: string,
    request: CoverLetterRequest
  ): Promise<GeneratedCoverLetter> {
    const systemPrompt = this.buildGenerationSystemPrompt(
      request.tone,
      request.length
    );
    const userPrompt = this.buildGenerationUserPrompt(request);

    const response = await aiService.makeRequest<string>(
      userId,
      "cover_letter_generation" as AIFeature,
      userPrompt,
      {
        systemPrompt,
        complexity: "complex",
        temperature: 0.6,
        maxTokens: 2000,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(`Cover letter generation failed: ${response.error}`);
    }

    try {
      const parsed = JSON.parse(response.data);
      return this.validateAndProcessCoverLetter(parsed);
    } catch (error) {
      console.error("Failed to parse cover letter response:", error);
      // Return fallback cover letter
      return this.generateFallbackCoverLetter(request);
    }
  }

  /**
   * Build system prompt for cover letter generation
   */
  private buildGenerationSystemPrompt(tone: string, length: string): string {
    const lengthGuidelines = {
      short: "200-300 words, 3 concise paragraphs",
      medium: "300-450 words, 4 well-developed paragraphs",
      long: "450-600 words, 5 comprehensive paragraphs",
    };

    const toneGuidelines = {
      professional: "formal, respectful, and business-appropriate language",
      enthusiastic:
        "energetic, passionate, and positive language while maintaining professionalism",
      confident: "assertive, self-assured, and achievement-focused language",
      creative:
        "engaging, unique, and memorable language appropriate for creative industries",
    };

    return `You are an expert career counselor and professional writer specializing in cover letters.

WRITING GUIDELINES:
- Tone: ${toneGuidelines[tone as keyof typeof toneGuidelines]}
- Length: ${lengthGuidelines[length as keyof typeof lengthGuidelines]}
- Personalize to the specific job and company
- Highlight relevant achievements with quantifiable results
- Address potential concerns or gaps proactively
- Include industry-specific keywords naturally
- Create a compelling narrative that connects experience to the role
- Avoid generic templates and clichés

STRUCTURE:
1. Opening: Hook + position + brief value proposition
2. Body: 1-3 paragraphs showcasing relevant experience and achievements
3. Closing: Call to action + enthusiasm + professional sign-off

RESPONSE FORMAT:
Return valid JSON only:
{
  "content": "Full cover letter text",
  "structure": {
    "introduction": "Opening paragraph text",
    "body": ["Body paragraph 1", "Body paragraph 2", ...],
    "conclusion": "Closing paragraph text"
  },
  "keyPoints": ["Key selling points highlighted"],
  "personalizationElements": ["Specific personalizations made"],
  "suggestedEdits": ["Optional improvements for customization"]
}

Make it compelling, authentic, and tailored to the specific opportunity.`;
  }

  /**
   * Build user prompt for cover letter generation
   */
  private buildGenerationUserPrompt(request: CoverLetterRequest): string {
    const { userProfile, jobListing, focusAreas, customInstructions } = request;
    const { resumeData } = userProfile;

    let prompt = `Generate a personalized cover letter for this job application:\n\n`;

    // Job details
    prompt += `JOB DETAILS:\n`;
    prompt += `Position: ${jobListing.title}\n`;
    prompt += `Company: ${jobListing.company}\n`;
    prompt += `Location: ${jobListing.location}\n`;
    prompt += `Job Type: ${jobListing.jobType}\n`;
    prompt += `Requirements: ${jobListing.requirements.join(", ")}\n`;
    prompt += `Description: ${jobListing.description}\n\n`;

    // Candidate details
    prompt += `CANDIDATE PROFILE:\n`;
    prompt += `Name: ${userProfile.name}\n`;
    prompt += `Location: ${userProfile.location}\n`;
    prompt += `Email: ${userProfile.email}\n`;
    prompt += `Phone: ${userProfile.phone}\n\n`;

    // Experience summary
    prompt += `EXPERIENCE:\n`;
    resumeData.experience.forEach((exp, index) => {
      prompt += `${index + 1}. ${exp.title} at ${exp.company} (${
        exp.startDate
      } - ${exp.endDate})\n`;
      prompt += `   Technologies: ${exp.technologies.join(", ")}\n`;
      if (exp.achievements.length > 0) {
        prompt += `   Key Achievements: ${exp.achievements.join("; ")}\n`;
      }
      prompt += `\n`;
    });

    // Skills
    prompt += `SKILLS:\n`;
    prompt += `Technical: ${resumeData.skills.technical.join(", ")}\n`;
    prompt += `Soft Skills: ${resumeData.skills.soft.join(", ")}\n`;
    if (resumeData.skills.certifications.length > 0) {
      prompt += `Certifications: ${resumeData.skills.certifications.join(
        ", "
      )}\n`;
    }
    prompt += `\n`;

    // Education
    if (resumeData.education.length > 0) {
      prompt += `EDUCATION:\n`;
      resumeData.education.forEach((edu) => {
        prompt += `${edu.degree} from ${edu.institution} (${edu.graduationDate})\n`;
      });
      prompt += `\n`;
    }

    // Projects (if any)
    if (resumeData.projects.length > 0) {
      prompt += `NOTABLE PROJECTS:\n`;
      resumeData.projects.slice(0, 3).forEach((project) => {
        prompt += `${project.name}: ${project.description}\n`;
        prompt += `Technologies: ${project.technologies.join(", ")}\n\n`;
      });
    }

    // Focus areas
    if (focusAreas.length > 0) {
      prompt += `FOCUS AREAS TO HIGHLIGHT:\n`;
      focusAreas.forEach((area) => (prompt += `- ${area}\n`));
      prompt += `\n`;
    }

    // Custom instructions
    if (customInstructions) {
      prompt += `SPECIAL INSTRUCTIONS:\n${customInstructions}\n\n`;
    }

    prompt += `Create a compelling, personalized cover letter that:
1. Shows genuine interest in the company and role
2. Highlights the most relevant experience and achievements
3. Addresses key job requirements
4. Demonstrates value I can bring to the organization
5. Includes industry-specific keywords naturally
6. Tells a cohesive story about my career progression

Make it authentic and avoid generic language.`;

    return prompt;
  }

  /**
   * Validate and process generated cover letter
   */
  private validateAndProcessCoverLetter(data: any): GeneratedCoverLetter {
    return {
      content: data.content || "",
      structure: {
        introduction: data.structure?.introduction || "",
        body: Array.isArray(data.structure?.body) ? data.structure.body : [],
        conclusion: data.structure?.conclusion || "",
      },
      keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
      personalizationElements: Array.isArray(data.personalizationElements)
        ? data.personalizationElements
        : [],
      suggestedEdits: Array.isArray(data.suggestedEdits)
        ? data.suggestedEdits
        : [],
    };
  }

  /**
   * Generate fallback cover letter when AI fails
   */
  private generateFallbackCoverLetter(
    request: CoverLetterRequest
  ): GeneratedCoverLetter {
    const { userProfile, jobListing } = request;

    const content = `Dear Hiring Manager,

I am writing to express my interest in the ${jobListing.title} position at ${jobListing.company}. With my background in technology and proven experience, I believe I would be a valuable addition to your team.

In my previous roles, I have developed strong technical skills and a track record of delivering results. I am particularly drawn to this opportunity because it aligns with my career goals and allows me to contribute to meaningful projects.

I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${jobListing.company}'s success. Thank you for considering my application.

Sincerely,
${userProfile.name}`;

    return {
      content,
      structure: {
        introduction: content.split("\n\n")[0],
        body: content.split("\n\n").slice(1, -1),
        conclusion: content.split("\n\n").slice(-1)[0],
      },
      keyPoints: ["Experience in technology", "Proven track record"],
      personalizationElements: [
        `Company name: ${jobListing.company}`,
        `Position: ${jobListing.title}`,
      ],
      suggestedEdits: [
        "Add specific achievements",
        "Customize for industry",
        "Include relevant keywords",
      ],
    };
  }

  /**
   * Analyze and improve existing cover letter
   */
  async analyzeCoverLetter(
    userId: string,
    coverLetterText: string,
    jobListing: JobListing
  ): Promise<CoverLetterAnalysis> {
    const systemPrompt = `You are a career counselor analyzing cover letters for effectiveness.

ANALYSIS CRITERIA:
- Personalization and specificity to the job/company
- Relevance to job requirements
- Professional tone and readability
- Keywords and industry terminology
- Compelling value proposition
- Structure and flow
- Call to action effectiveness

SCORING (0.0 - 1.0):
- Overall effectiveness
- Readability and flow
- Personalization level

RESPONSE FORMAT:
Return valid JSON only:
{
  "score": 0.75,
  "strengths": ["array of strengths"],
  "improvements": ["array of specific improvements"],
  "keywords": {
    "included": ["keywords found in letter"],
    "missing": ["important keywords missing"]
  },
  "readabilityScore": 0.8,
  "personalizeationLevel": 0.7
}

Be constructive and specific in feedback.`;

    const userPrompt = `Analyze this cover letter for the following job:

JOB:
Position: ${jobListing.title}
Company: ${jobListing.company}
Requirements: ${jobListing.requirements.join(", ")}

COVER LETTER:
${coverLetterText}

Provide detailed analysis and improvement suggestions.`;

    const response = await aiService.makeRequest<string>(
      userId,
      "cover_letter_generation" as AIFeature,
      userPrompt,
      {
        systemPrompt,
        complexity: "simple",
        temperature: 0.3,
        maxTokens: 1500,
      }
    );

    if (!response.success || !response.data) {
      return this.getDefaultAnalysis();
    }

    try {
      const analysis = JSON.parse(response.data);
      return this.validateAnalysis(analysis);
    } catch (error) {
      console.error("Failed to parse cover letter analysis:", error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Validate analysis data
   */
  private validateAnalysis(data: any): CoverLetterAnalysis {
    return {
      score: Math.min(Math.max(data.score || 0.5, 0), 1),
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      improvements: Array.isArray(data.improvements) ? data.improvements : [],
      keywords: {
        included: Array.isArray(data.keywords?.included)
          ? data.keywords.included
          : [],
        missing: Array.isArray(data.keywords?.missing)
          ? data.keywords.missing
          : [],
      },
      readabilityScore: Math.min(Math.max(data.readabilityScore || 0.5, 0), 1),
      personalizeationLevel: Math.min(
        Math.max(data.personalizeationLevel || 0.5, 0),
        1
      ),
    };
  }

  /**
   * Get default analysis when AI fails
   */
  private getDefaultAnalysis(): CoverLetterAnalysis {
    return {
      score: 0.5,
      strengths: ["Cover letter content available for review"],
      improvements: ["Analysis unavailable at this time"],
      keywords: {
        included: [],
        missing: ["Add relevant industry keywords"],
      },
      readabilityScore: 0.5,
      personalizeationLevel: 0.5,
    };
  }

  /**
   * Generate multiple cover letter variations
   */
  async generateVariations(
    userId: string,
    request: CoverLetterRequest,
    variationCount: number = 3
  ): Promise<GeneratedCoverLetter[]> {
    const variations: GeneratedCoverLetter[] = [];

    // Different approaches for variations
    const approaches = [
      { tone: "professional", focus: "experience" },
      { tone: "enthusiastic", focus: "achievements" },
      { tone: "confident", focus: "skills" },
    ];

    for (let i = 0; i < Math.min(variationCount, approaches.length); i++) {
      try {
        const approach = approaches[i];
        const modifiedRequest = {
          ...request,
          tone: approach.tone as any,
          focusAreas: [...request.focusAreas, approach.focus],
          customInstructions: `${
            request.customInstructions || ""
          } Focus particularly on ${approach.focus}.`,
        };

        const variation = await this.generateCoverLetter(
          userId,
          modifiedRequest
        );
        variations.push(variation);
      } catch (error) {
        console.error(`Failed to generate variation ${i + 1}:`, error);
      }
    }

    return variations;
  }

  /**
   * Customize cover letter for specific company
   */
  async customizeForCompany(
    userId: string,
    baseCoverLetter: string,
    companyInfo: {
      name: string;
      industry: string;
      values?: string[];
      recentNews?: string[];
    }
  ): Promise<{
    customized: string;
    changesHighlight: string[];
  }> {
    const systemPrompt = `You are a career counselor specializing in company-specific customization.

Customize the cover letter to:
1. Show knowledge of the company
2. Align with company values and culture
3. Reference recent company news or achievements (if provided)
4. Use industry-specific language
5. Demonstrate genuine interest in the organization

Maintain the original structure and key points while adding personalization.`;

    const userPrompt = `Customize this cover letter for the specific company:

COMPANY INFO:
Name: ${companyInfo.name}
Industry: ${companyInfo.industry}
${companyInfo.values ? `Values: ${companyInfo.values.join(", ")}` : ""}
${
  companyInfo.recentNews
    ? `Recent News: ${companyInfo.recentNews.join("; ")}`
    : ""
}

ORIGINAL COVER LETTER:
${baseCoverLetter}

Add company-specific elements while maintaining the core message and structure.`;

    const response = await aiService.makeRequest<string>(
      userId,
      "cover_letter_generation" as AIFeature,
      userPrompt,
      {
        systemPrompt,
        complexity: "simple",
        temperature: 0.5,
        maxTokens: 1500,
      }
    );

    if (!response.success) {
      return {
        customized: baseCoverLetter,
        changesHighlight: ["Unable to customize at this time"],
      };
    }

    return {
      customized: response.data || baseCoverLetter,
      changesHighlight: [
        "Added company-specific references",
        "Aligned with company values",
      ],
    };
  }
}

// Export singleton instance
export const coverLetterService = new CoverLetterService();
