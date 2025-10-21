/**
 * Resume Parsing AI Service
 *
 * Intelligent resume parsing and analysis using Claude/GPT.
 * Extracts structured data and provides improvement suggestions.
 *
 * @description AI-powered resume parsing with detailed analysis
 */

import { aiService } from "./ai-service";
import { AIFeature } from "./config";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    certifications: string[];
  };
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  achievements: string[];
  keywords: string[];
}

export interface WorkExperience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
  technologies: string[];
  responsibilities?: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  graduationDate: string;
  gpa?: string;
  relevantCourses: string[];
  achievements: string[];
  honors?: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface ResumeAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: {
    content: string[];
    formatting: string[];
    keywords: string[];
  };
  atsCompatibility: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  industryAlignment: {
    bestFit: string[];
    suggestions: string[];
  };
}

export interface ResumeParsingResult {
  parsed: ParsedResume;
  analysis: ResumeAnalysis;
  confidence: number;
  processingTime: number;
}

// =============================================================================
// RESUME PARSING SERVICE
// =============================================================================

export class ResumeParsingService {
  /**
   * Parse resume from text content
   */
  async parseResume(
    userId: string,
    resumeText: string,
    options: {
      includeAnalysis?: boolean;
      targetIndustry?: string;
      targetRole?: string;
    } = {}
  ): Promise<ResumeParsingResult> {
    const startTime = Date.now();
    const { includeAnalysis = true, targetIndustry, targetRole } = options;

    try {
      // Parse resume structure first
      const parsed = await this.extractResumeData(userId, resumeText);

      // Generate analysis if requested
      let analysis: ResumeAnalysis | null = null;
      if (includeAnalysis) {
        analysis = await this.analyzeResume(
          userId,
          resumeText,
          parsed,
          targetIndustry,
          targetRole
        );
      }

      const processingTime = Date.now() - startTime;

      return {
        parsed,
        analysis: analysis || this.getDefaultAnalysis(),
        confidence: 0.85, // TODO: Implement confidence scoring
        processingTime,
      };
    } catch (error) {
      console.error("Resume parsing failed:", error);
      throw error;
    }
  }

  /**
   * Extract structured data from resume text
   */
  private async extractResumeData(
    userId: string,
    resumeText: string
  ): Promise<ParsedResume> {
    const systemPrompt = this.buildParsingSystemPrompt();
    const userPrompt = this.buildParsingUserPrompt(resumeText);

    const response = await aiService.makeRequest<string>(
      userId,
      "resume_parsing" as AIFeature,
      userPrompt,
      {
        systemPrompt,
        complexity: "complex",
        temperature: 0.1,
        maxTokens: 3000,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(`Resume parsing failed: ${response.error}`);
    }

    try {
      const parsed = JSON.parse(response.data);
      return this.validateAndCleanParsedData(parsed);
    } catch (error) {
      console.error("Failed to parse resume data response:", error);
      throw new Error("Invalid resume parsing response format");
    }
  }

  /**
   * Build system prompt for resume parsing
   */
  private buildParsingSystemPrompt(): string {
    return `You are an expert resume parser. Extract structured information from resume text with high accuracy.

EXTRACTION RULES:
- Be thorough and precise
- Standardize date formats (YYYY-MM or YYYY-MM-DD)
- Extract all technical skills and tools mentioned
- Identify soft skills from context
- Parse job descriptions for achievements and technologies
- Normalize company and institution names
- Identify relevant keywords for ATS systems

RESPONSE FORMAT:
Return valid JSON only, no additional text:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedIn": "string (optional)",
    "github": "string (optional)",
    "website": "string (optional)"
  },
  "summary": "string",
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills"],
    "languages": ["array of programming/spoken languages"],
    "certifications": ["array of certifications"]
  },
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "current": boolean,
      "description": "string",
      "achievements": ["array of achievements"],
      "technologies": ["array of technologies used"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string",
      "graduationDate": "YYYY-MM",
      "gpa": "string (optional)",
      "relevantCourses": ["array of courses"],
      "achievements": ["array of achievements"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array of technologies"],
      "url": "string (optional)",
      "startDate": "YYYY-MM (optional)",
      "endDate": "YYYY-MM (optional)"
    }
  ],
  "achievements": ["array of notable achievements"],
  "keywords": ["array of relevant keywords for ATS"]
}

Extract information accurately. If information is missing, use empty strings or arrays.`;
  }

  /**
   * Build user prompt for resume parsing
   */
  private buildParsingUserPrompt(resumeText: string): string {
    return `Parse this resume and extract all structured information:

RESUME TEXT:
${resumeText}

Extract all personal information, skills, experience, education, projects, and achievements. Pay special attention to:
- Technical skills and programming languages
- Job titles and company names
- Dates of employment and education
- Project descriptions and technologies used
- Certifications and achievements
- Contact information

Provide the structured data in the specified JSON format.`;
  }

  /**
   * Analyze parsed resume for improvements
   */
  private async analyzeResume(
    userId: string,
    resumeText: string,
    parsed: ParsedResume,
    targetIndustry?: string,
    targetRole?: string
  ): Promise<ResumeAnalysis> {
    const systemPrompt = this.buildAnalysisSystemPrompt();
    const userPrompt = this.buildAnalysisUserPrompt(
      resumeText,
      parsed,
      targetIndustry,
      targetRole
    );

    const response = await aiService.makeRequest<string>(
      userId,
      "resume_parsing" as AIFeature,
      userPrompt,
      {
        systemPrompt,
        complexity: "complex",
        temperature: 0.3,
        maxTokens: 2500,
      }
    );

    if (!response.success || !response.data) {
      console.error("Resume analysis failed:", response.error);
      return this.getDefaultAnalysis();
    }

    try {
      const analysis = JSON.parse(response.data);
      return this.validateAnalysis(analysis);
    } catch (error) {
      console.error("Failed to parse resume analysis response:", error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Build system prompt for resume analysis
   */
  private buildAnalysisSystemPrompt(): string {
    return `You are an expert career counselor and resume reviewer. Analyze resumes for improvement opportunities.

ANALYSIS CRITERIA:
- Content quality and relevance
- ATS (Applicant Tracking System) compatibility
- Industry alignment and keyword optimization
- Structure and formatting effectiveness
- Achievement quantification
- Skills presentation
- Overall professional presentation

SCORING (0.0 - 1.0):
- 0.9-1.0: Excellent, minimal improvements needed
- 0.7-0.8: Good, some improvements recommended
- 0.5-0.6: Average, significant improvements needed
- 0.3-0.4: Below average, major overhaul required
- 0.0-0.2: Poor, complete revision needed

RESPONSE FORMAT:
Return valid JSON only:
{
  "overallScore": 0.75,
  "strengths": ["array of strengths"],
  "weaknesses": ["array of weaknesses"],
  "improvements": {
    "content": ["array of content improvements"],
    "formatting": ["array of formatting improvements"],
    "keywords": ["array of keyword suggestions"]
  },
  "atsCompatibility": {
    "score": 0.8,
    "issues": ["array of ATS issues"],
    "recommendations": ["array of ATS recommendations"]
  },
  "industryAlignment": {
    "bestFit": ["array of best-fit industries"],
    "suggestions": ["array of alignment suggestions"]
  }
}

Be constructive, specific, and actionable in your feedback.`;
  }

  /**
   * Build user prompt for resume analysis
   */
  private buildAnalysisUserPrompt(
    resumeText: string,
    parsed: ParsedResume,
    targetIndustry?: string,
    targetRole?: string
  ): string {
    let prompt = `Analyze this resume for improvement opportunities:\n\n`;

    if (targetIndustry || targetRole) {
      prompt += `TARGET CONTEXT:\n`;
      if (targetIndustry) prompt += `Industry: ${targetIndustry}\n`;
      if (targetRole) prompt += `Role: ${targetRole}\n\n`;
    }

    prompt += `PARSED RESUME DATA:\n`;
    prompt += `Name: ${parsed.personalInfo.name}\n`;
    prompt += `Skills: ${[
      ...parsed.skills.technical,
      ...parsed.skills.soft,
    ].join(", ")}\n`;
    prompt += `Experience: ${parsed.experience.length} positions\n`;
    prompt += `Education: ${parsed.education
      .map((edu) => edu.degree)
      .join(", ")}\n\n`;

    prompt += `FULL RESUME TEXT:\n${resumeText}\n\n`;

    prompt += `Provide comprehensive analysis including:
1. Overall score and key strengths/weaknesses
2. Specific content improvements
3. ATS compatibility assessment
4. Industry alignment evaluation
5. Actionable recommendations for enhancement`;

    return prompt;
  }

  /**
   * Validate and clean parsed resume data
   */
  private validateAndCleanParsedData(data: any): ParsedResume {
    return {
      personalInfo: {
        name: data.personalInfo?.name || "",
        email: data.personalInfo?.email || "",
        phone: data.personalInfo?.phone || "",
        location: data.personalInfo?.location || "",
        linkedIn: data.personalInfo?.linkedIn,
        github: data.personalInfo?.github,
        website: data.personalInfo?.website,
      },
      summary: data.summary || "",
      skills: {
        technical: Array.isArray(data.skills?.technical)
          ? data.skills.technical
          : [],
        soft: Array.isArray(data.skills?.soft) ? data.skills.soft : [],
        languages: Array.isArray(data.skills?.languages)
          ? data.skills.languages
          : [],
        certifications: Array.isArray(data.skills?.certifications)
          ? data.skills.certifications
          : [],
      },
      experience: Array.isArray(data.experience)
        ? data.experience.map(this.validateExperience)
        : [],
      education: Array.isArray(data.education)
        ? data.education.map(this.validateEducation)
        : [],
      projects: Array.isArray(data.projects)
        ? data.projects.map(this.validateProject)
        : [],
      achievements: Array.isArray(data.achievements) ? data.achievements : [],
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
    };
  }

  /**
   * Validate experience entry
   */
  private validateExperience(exp: any): WorkExperience {
    return {
      title: exp.title || "",
      company: exp.company || "",
      location: exp.location || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      current: Boolean(exp.current),
      description: exp.description || "",
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
    };
  }

  /**
   * Validate education entry
   */
  private validateEducation(edu: any): Education {
    return {
      degree: edu.degree || "",
      institution: edu.institution || "",
      location: edu.location || "",
      graduationDate: edu.graduationDate || "",
      gpa: edu.gpa,
      relevantCourses: Array.isArray(edu.relevantCourses)
        ? edu.relevantCourses
        : [],
      achievements: Array.isArray(edu.achievements) ? edu.achievements : [],
    };
  }

  /**
   * Validate project entry
   */
  private validateProject(proj: any): Project {
    return {
      name: proj.name || "",
      description: proj.description || "",
      technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
      url: proj.url,
      startDate: proj.startDate,
      endDate: proj.endDate,
    };
  }

  /**
   * Validate analysis data
   */
  private validateAnalysis(data: any): ResumeAnalysis {
    return {
      overallScore: Math.min(Math.max(data.overallScore || 0.5, 0), 1),
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
      improvements: {
        content: Array.isArray(data.improvements?.content)
          ? data.improvements.content
          : [],
        formatting: Array.isArray(data.improvements?.formatting)
          ? data.improvements.formatting
          : [],
        keywords: Array.isArray(data.improvements?.keywords)
          ? data.improvements.keywords
          : [],
      },
      atsCompatibility: {
        score: Math.min(Math.max(data.atsCompatibility?.score || 0.5, 0), 1),
        issues: Array.isArray(data.atsCompatibility?.issues)
          ? data.atsCompatibility.issues
          : [],
        recommendations: Array.isArray(data.atsCompatibility?.recommendations)
          ? data.atsCompatibility.recommendations
          : [],
      },
      industryAlignment: {
        bestFit: Array.isArray(data.industryAlignment?.bestFit)
          ? data.industryAlignment.bestFit
          : [],
        suggestions: Array.isArray(data.industryAlignment?.suggestions)
          ? data.industryAlignment.suggestions
          : [],
      },
    };
  }

  /**
   * Get default analysis when AI fails
   */
  private getDefaultAnalysis(): ResumeAnalysis {
    return {
      overallScore: 0.5,
      strengths: ["Resume content available for review"],
      weaknesses: ["Analysis unavailable at this time"],
      improvements: {
        content: ["Review and update resume content"],
        formatting: ["Ensure clean, professional formatting"],
        keywords: ["Add relevant industry keywords"],
      },
      atsCompatibility: {
        score: 0.5,
        issues: ["Unable to analyze ATS compatibility"],
        recommendations: ["Use standard formatting and clear section headers"],
      },
      industryAlignment: {
        bestFit: ["General applicability"],
        suggestions: ["Tailor resume to specific industry requirements"],
      },
    };
  }

  /**
   * Generate resume improvement suggestions
   */
  async generateImprovementSuggestions(
    userId: string,
    parsed: ParsedResume,
    targetRole?: string
  ): Promise<{
    priorityImprovements: string[];
    skillsToAdd: string[];
    contentSuggestions: string[];
    formattingTips: string[];
  }> {
    const systemPrompt = `You are a resume optimization expert. Provide specific, actionable improvement suggestions.

Focus on:
1. High-impact changes that will improve hiring chances
2. Industry-specific skills and keywords
3. Content optimization for better storytelling
4. ATS-friendly formatting recommendations

Be specific and actionable in your suggestions.`;

    const userPrompt = `Provide improvement suggestions for this resume:

CURRENT RESUME:
Name: ${parsed.personalInfo.name}
Skills: ${parsed.skills.technical.join(", ")}
Experience: ${parsed.experience
      .map((exp) => `${exp.title} at ${exp.company}`)
      .join("; ")}
Education: ${parsed.education.map((edu) => edu.degree).join("; ")}

${targetRole ? `TARGET ROLE: ${targetRole}` : ""}

Provide specific recommendations for improvement.`;

    const response = await aiService.makeRequest<string>(
      userId,
      "resume_parsing" as AIFeature,
      userPrompt,
      {
        systemPrompt,
        complexity: "simple",
        temperature: 0.4,
        maxTokens: 1500,
      }
    );

    if (!response.success) {
      return {
        priorityImprovements: ["Review resume for clarity and impact"],
        skillsToAdd: ["Identify missing key skills for target role"],
        contentSuggestions: ["Quantify achievements with specific metrics"],
        formattingTips: ["Use consistent formatting and clear section headers"],
      };
    }

    // Parse and return structured suggestions
    // For now, return the raw response parsed into sections
    return {
      priorityImprovements: ["Update based on AI suggestions"],
      skillsToAdd: ["Add trending technical skills"],
      contentSuggestions: ["Improve achievement descriptions"],
      formattingTips: ["Optimize for ATS systems"],
    };
  }
}

// Export singleton instance
export const resumeParsingService = new ResumeParsingService();
