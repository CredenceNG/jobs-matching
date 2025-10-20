/**
 * AI-Powered Resume Analysis Service
 *
 * Step 2 of the job matching process:
 * Uses Claude/GPT to deeply analyze resume and extract structured data
 */

import { getAIService } from "@/lib/ai/request-scoped-service";

export interface ResumeAnalysis {
  skills: Array<{
    name: string;
    confidence: number;
    category: string;
  }>;
  jobTitles: string[];
  industries: string[];
  experienceLevel: "entry-level" | "mid-level" | "senior" | "executive";
  yearsOfExperience?: number;
  specializations: string[];
  preferredJobTypes?: string[];
  location?: string;
  careerGoal?: string;
  summary: string;
  education?: string;
  certifications?: string[];
}

export class AIResumeAnalyzer {
  /**
   * Analyze resume using AI to extract deep insights
   */
  async analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
    const prompt = this.buildAnalysisPrompt(resumeText);

    try {
      const aiService = getAIService();
      const response = await aiService.makeRequest<string>(
        "anonymous-user",
        "resume_parsing" as any,
        prompt,
        {
          maxTokens: 2000,
          temperature: 0.1, // Low temperature for accurate extraction
        }
      );

      if (!response.success || !response.data) {
        throw new Error("AI analysis failed: " + response.error);
      }

      // Parse AI response
      const analysis = JSON.parse(response.data);
      return this.validateAnalysis(analysis);
    } catch (error) {
      console.error("AI resume analysis error:", error);
      throw error;
    }
  }

  /**
   * Build comprehensive AI prompt for resume analysis
   */
  private buildAnalysisPrompt(resumeText: string): string {
    return `You are an expert career counselor and resume analyst. Analyze this resume in detail and extract structured information.

Resume:
${resumeText}

Extract the following information and return as valid JSON:

{
  "skills": [
    {
      "name": "skill name",
      "confidence": 0.0-1.0 (how confident you are this skill is present),
      "category": "technical|marketing|sales|design|finance|hr|management|soft-skill"
    }
  ],
  "jobTitles": ["current or most recent job titles"],
  "industries": ["industries they have experience in"],
  "experienceLevel": "entry-level|mid-level|senior|executive",
  "yearsOfExperience": estimated total years,
  "specializations": ["key areas of expertise or specialization"],
  "preferredJobTypes": ["Full-time", "Remote", "Contract", etc if mentioned],
  "location": "current location or preferred location if mentioned",
  "careerGoal": "inferred career goal or next step",
  "summary": "2-3 sentence professional summary",
  "education": "highest degree",
  "certifications": ["list of certifications if any"]
}

Instructions:
1. Extract ALL skills mentioned, including:
   - Technical skills (software, tools, platforms)
   - Marketing skills (SEO, social media, content, etc.)
   - Sales skills (CRM, prospecting, negotiation, etc.)
   - Design skills (Adobe, Figma, UI/UX, etc.)
   - Finance skills (Excel, accounting, modeling, etc.)
   - HR skills (recruiting, HRIS, talent management, etc.)
   - Soft skills (leadership, communication, problem-solving, etc.)

2. Be comprehensive - include skills that are IMPLIED from achievements:
   - "Led team of 10" → Leadership, Team Management
   - "Increased sales by 50%" → Sales, Performance Optimization
   - "Launched product campaign" → Product Marketing, Campaign Management

3. Categorize skills accurately based on their domain

4. Assign confidence scores:
   - 0.9-1.0: Explicitly mentioned with details
   - 0.7-0.9: Clearly implied or demonstrated
   - 0.5-0.7: Possibly relevant but not confirmed

5. Identify experience level based on:
   - Years of experience
   - Job titles held
   - Level of responsibility
   - Leadership experience

6. Extract career trajectory and goals

Return ONLY valid JSON, no additional text or formatting.`;
  }

  /**
   * Validate and clean AI analysis response
   */
  private validateAnalysis(analysis: any): ResumeAnalysis {
    return {
      skills: Array.isArray(analysis.skills)
        ? analysis.skills.map((skill: any) => ({
            name: skill.name || "",
            confidence:
              typeof skill.confidence === "number" ? skill.confidence : 0.5,
            category: skill.category || "other",
          }))
        : [],
      jobTitles: Array.isArray(analysis.jobTitles)
        ? analysis.jobTitles.filter(Boolean)
        : [],
      industries: Array.isArray(analysis.industries)
        ? analysis.industries.filter(Boolean)
        : [],
      experienceLevel: analysis.experienceLevel || "mid-level",
      yearsOfExperience: analysis.yearsOfExperience,
      specializations: Array.isArray(analysis.specializations)
        ? analysis.specializations.filter(Boolean)
        : [],
      preferredJobTypes: Array.isArray(analysis.preferredJobTypes)
        ? analysis.preferredJobTypes.filter(Boolean)
        : undefined,
      location: analysis.location,
      careerGoal: analysis.careerGoal,
      summary: analysis.summary || "",
      education: analysis.education,
      certifications: Array.isArray(analysis.certifications)
        ? analysis.certifications.filter(Boolean)
        : [],
    };
  }

  /**
   * Generate search keywords from analysis
   */
  generateSearchKeywords(analysis: ResumeAnalysis): string[] {
    const keywords: string[] = [];

    // Add top skills (high confidence only)
    const topSkills = analysis.skills
      .filter((s) => s.confidence >= 0.7)
      .slice(0, 5)
      .map((s) => s.name);
    keywords.push(...topSkills);

    // Add job titles
    if (analysis.jobTitles.length > 0) {
      keywords.push(...analysis.jobTitles.slice(0, 2));
    }

    // Add primary industry
    if (analysis.industries.length > 0) {
      keywords.push(analysis.industries[0]);
    }

    // Add specializations
    if (analysis.specializations.length > 0) {
      keywords.push(...analysis.specializations.slice(0, 2));
    }

    return keywords;
  }
}

// Export singleton
export const aiResumeAnalyzer = new AIResumeAnalyzer();
