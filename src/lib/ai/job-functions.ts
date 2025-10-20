import { cachedAIService } from "./cached-service";
import { logger } from "@/lib/utils/logger";

export interface JobMatch {
  jobId: string;
  matchScore: number;
  matchReasons: string[];
  skillsMatch: {
    matched: string[];
    missing: string[];
    transferable: string[];
  };
  salaryCompatibility: {
    isCompatible: boolean;
    reason?: string;
  };
  locationCompatibility: {
    isCompatible: boolean;
    reason?: string;
  };
  experienceMatch: {
    meetsRequirement: boolean;
    gap?: string;
  };
}

export interface ParsedResume {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary?: string;
  skills: {
    technical: string[];
    soft: string[];
    certifications: string[];
  };
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
    gpa?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
}

export interface OptimizationSuggestion {
  type: "keyword" | "experience" | "format" | "content" | "achievement";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  suggestion: string;
  example?: string;
}

export interface JobAnalysis {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits: string[];
  workType: "remote" | "hybrid" | "onsite";
  keyResponsibilities: string[];
}

/**
 * Core AI functions for job matching and resume optimization
 */
export class JobAIService {
  /**
   * Parse resume text and extract structured information
   */
  async parseResume(
    resumeText: string,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<ParsedResume> {
    const prompt = `
Please analyze this resume text and extract structured information in JSON format.

Resume Text:
${resumeText}

Extract the following information and return ONLY valid JSON:
{
  "personalInfo": {
    "name": "string or null",
    "email": "string or null", 
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "portfolio": "string or null"
  },
  "summary": "string or null - professional summary/objective",
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills"], 
    "certifications": ["array of certifications"]
  },
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "employment duration",
      "description": "role description",
      "achievements": ["key achievements"]
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "institution": "school name", 
      "year": "graduation year or null",
      "gpa": "gpa or null"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "project description",
      "technologies": ["technologies used"],
      "url": "project url or null"
    }
  ]
}

Focus on accuracy and completeness. If information is not available, use null or empty arrays.`;

    try {
      logger.info("Starting resume parsing", {
        textLength: resumeText.length,
        userId: options.userId,
      });

      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 2000,
        temperature: 0.1, // Low temperature for consistent parsing
        userId: options.userId,
        sessionId: options.sessionId,
        useCache: true,
      });

      // Clean and parse JSON response
      let jsonText = response.content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      const parsed = JSON.parse(jsonText) as ParsedResume;

      logger.info("Resume parsing completed", {
        skillsCount: parsed.skills.technical.length + parsed.skills.soft.length,
        experienceCount: parsed.experience.length,
        educationCount: parsed.education.length,
        projectsCount: parsed.projects.length,
      });

      return parsed;
    } catch (error) {
      logger.error("Resume parsing failed", { error });
      throw new Error(
        "Failed to parse resume. Please check the format and try again."
      );
    }
  }

  /**
   * Analyze job posting and extract key requirements
   */
  async analyzeJob(
    jobDescription: string,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<JobAnalysis> {
    const prompt = `
Analyze this job posting and extract key information in JSON format:

Job Description:
${jobDescription}

Return ONLY valid JSON with this structure:
{
  "title": "job title",
  "company": "company name",
  "requiredSkills": ["must-have skills"],
  "preferredSkills": ["nice-to-have skills"],
  "experienceLevel": "entry/mid/senior/executive",
  "salaryRange": {
    "min": number,
    "max": number,
    "currency": "USD"
  } or null,
  "benefits": ["list of benefits"],
  "workType": "remote/hybrid/onsite",
  "keyResponsibilities": ["main job responsibilities"]
}

Extract information accurately. Use null for missing salary info.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 1500,
        temperature: 0.1,
        userId: options.userId,
        sessionId: options.sessionId,
        useCache: true,
      });

      let jsonText = response.content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      const analysis = JSON.parse(jsonText) as JobAnalysis;

      logger.info("Job analysis completed", {
        title: analysis.title,
        requiredSkills: analysis.requiredSkills.length,
        preferredSkills: analysis.preferredSkills.length,
      });

      return analysis;
    } catch (error) {
      logger.error("Job analysis failed", { error });
      throw new Error("Failed to analyze job posting.");
    }
  }

  /**
   * Calculate job match score and provide detailed analysis
   */
  async calculateJobMatch(
    resume: ParsedResume,
    job: JobAnalysis,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<JobMatch> {
    const prompt = `
Calculate job match score between this resume and job posting:

RESUME:
Skills: ${[...resume.skills.technical, ...resume.skills.soft].join(", ")}
Experience: ${resume.experience
      .map((exp) => `${exp.title} at ${exp.company}`)
      .join("; ")}
Education: ${resume.education
      .map((edu) => `${edu.degree} from ${edu.institution}`)
      .join("; ")}

JOB POSTING:
Title: ${job.title}
Required Skills: ${job.requiredSkills.join(", ")}
Preferred Skills: ${job.preferredSkills.join(", ")}
Experience Level: ${job.experienceLevel}

Provide detailed analysis in JSON format:
{
  "matchScore": number (0-100),
  "matchReasons": ["specific reasons for the match score"],
  "skillsMatch": {
    "matched": ["skills that match between resume and job"],
    "missing": ["required skills missing from resume"],
    "transferable": ["skills that could transfer to the role"]
  },
  "salaryCompatibility": {
    "isCompatible": boolean,
    "reason": "explanation if not compatible"
  },
  "locationCompatibility": {
    "isCompatible": boolean,
    "reason": "explanation if not compatible"
  },
  "experienceMatch": {
    "meetsRequirement": boolean,
    "gap": "description of experience gap if any"
  }
}

Be thorough and provide actionable insights.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 2000,
        temperature: 0.3,
        userId: options.userId,
        sessionId: options.sessionId,
        useCache: true,
      });

      let jsonText = response.content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      const match = JSON.parse(jsonText) as Omit<JobMatch, "jobId">;

      logger.info("Job match calculation completed", {
        matchScore: match.matchScore,
        matchedSkills: match.skillsMatch.matched.length,
        missingSkills: match.skillsMatch.missing.length,
      });

      return {
        ...match,
        jobId: `job_${Date.now()}`, // Would be actual job ID in production
      };
    } catch (error) {
      logger.error("Job match calculation failed", { error });
      throw new Error("Failed to calculate job match.");
    }
  }

  /**
   * Generate resume optimization suggestions
   */
  async optimizeResume(
    resume: ParsedResume,
    targetJob?: JobAnalysis,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<OptimizationSuggestion[]> {
    const jobContext = targetJob
      ? `
Target Job:
Title: ${targetJob.title}
Required Skills: ${targetJob.requiredSkills.join(", ")}
Key Responsibilities: ${targetJob.keyResponsibilities.join("; ")}
`
      : "";

    const prompt = `
Analyze this resume and provide optimization suggestions${
      targetJob ? " for the target job" : ""
    }:

RESUME:
Name: ${resume.personalInfo.name || "N/A"}
Summary: ${resume.summary || "N/A"}
Technical Skills: ${resume.skills.technical.join(", ")}
Experience: ${resume.experience
      .map((exp) => `${exp.title} at ${exp.company} - ${exp.description}`)
      .join("\n")}

${jobContext}

Provide optimization suggestions in JSON format:
[
  {
    "type": "keyword|experience|format|content|achievement",
    "priority": "high|medium|low",
    "title": "brief suggestion title",
    "description": "detailed explanation of the issue",
    "suggestion": "specific action to take",
    "example": "concrete example if applicable"
  }
]

Focus on actionable improvements that will increase job match success. Limit to 10 most important suggestions.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 2500,
        temperature: 0.4,
        userId: options.userId,
        sessionId: options.sessionId,
        useCache: true,
      });

      let jsonText = response.content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      const suggestions = JSON.parse(jsonText) as OptimizationSuggestion[];

      logger.info("Resume optimization completed", {
        suggestionsCount: suggestions.length,
        highPriority: suggestions.filter((s) => s.priority === "high").length,
      });

      return suggestions;
    } catch (error) {
      logger.error("Resume optimization failed", { error });
      throw new Error("Failed to generate optimization suggestions.");
    }
  }

  /**
   * Generate tailored cover letter
   */
  async generateCoverLetter(
    resume: ParsedResume,
    job: JobAnalysis,
    options: {
      userId?: string;
      sessionId?: string;
      tone?: "professional" | "friendly" | "enthusiastic";
      length?: "short" | "medium" | "long";
    } = {}
  ): Promise<string> {
    const tone = options.tone || "professional";
    const length = options.length || "medium";

    const prompt = `
Write a tailored cover letter based on this resume and job posting:

RESUME HIGHLIGHTS:
Name: ${resume.personalInfo.name}
Key Skills: ${resume.skills.technical.slice(0, 8).join(", ")}
Recent Experience: ${
      resume.experience[0]
        ? `${resume.experience[0].title} at ${resume.experience[0].company}`
        : "N/A"
    }
Education: ${
      resume.education[0]
        ? `${resume.education[0].degree} from ${resume.education[0].institution}`
        : "N/A"
    }

JOB POSTING:
Position: ${job.title}
Company: ${job.company}
Key Requirements: ${job.requiredSkills.slice(0, 6).join(", ")}
Main Responsibilities: ${job.keyResponsibilities.slice(0, 3).join("; ")}

Requirements:
- Tone: ${tone}
- Length: ${length} (short=2-3 paragraphs, medium=3-4 paragraphs, long=4-5 paragraphs)
- Highlight relevant skills and experience
- Show enthusiasm for the role and company
- Include specific examples from experience
- End with strong call to action

Write a compelling cover letter that demonstrates clear alignment between the candidate's background and job requirements.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: length === "short" ? 800 : length === "medium" ? 1200 : 1600,
        temperature: 0.6, // Higher temperature for creative writing
        userId: options.userId,
        sessionId: options.sessionId,
        useCache: true,
      });

      logger.info("Cover letter generation completed", {
        length: response.content.length,
        tone,
        targetLength: length,
      });

      return response.content;
    } catch (error) {
      logger.error("Cover letter generation failed", { error });
      throw new Error("Failed to generate cover letter.");
    }
  }
}

// Singleton instance
export const jobAIService = new JobAIService();
