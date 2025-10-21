/**
 * AI Resume Optimizer Service
 *
 * Optimizes and recreates resumes using Claude/GPT to focus on strengths
 * for specific job opportunities. Tailors content to highlight relevant
 * experience and match job requirements.
 *
 * @description AI-powered resume optimization with job-specific tailoring
 */

import { aiService } from "./ai-service";
import { AIFeature } from "./config";
import { ParsedResume } from "./resume-parsing";
import { JobListing } from "./job-matching";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ResumeOptimizationRequest {
  userProfile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    resumeData: ParsedResume;
  };
  jobListing: JobListing;
  format: "ats-friendly" | "modern" | "executive" | "creative";
  focusAreas: string[];
  customInstructions?: string;
}

export interface OptimizedResume {
  content: string;
  structure: {
    header: {
      name: string;
      contact: string;
      summary: string;
    };
    experience: Array<{
      title: string;
      company: string;
      dates: string;
      achievements: string[];
    }>;
    skills: {
      technical: string[];
      soft: string[];
      certifications: string[];
    };
    education: Array<{
      degree: string;
      institution: string;
      date: string;
    }>;
    projects?: Array<{
      name: string;
      description: string;
      technologies: string[];
    }>;
  };
  keyOptimizations: string[];
  matchedKeywords: string[];
  atsScore: number;
  suggestedImprovements: string[];
}

export interface ResumeOptimizationAnalysis {
  overallScore: number;
  atsCompatibility: number;
  keywordMatch: number;
  impactScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  recommendations: string[];
}

// =============================================================================
// RESUME OPTIMIZER SERVICE
// =============================================================================

export class ResumeOptimizerService {
  /**
   * Generate an optimized resume for a specific job
   */
  async optimizeResume(
    userId: string,
    request: ResumeOptimizationRequest
  ): Promise<OptimizedResume> {
    const systemPrompt = this.buildOptimizationSystemPrompt(request.format);
    const userPrompt = this.buildOptimizationUserPrompt(request);

    const response = await aiService.makeRequest<string>(
      userId,
      "resume_optimization" as AIFeature,
      userPrompt,
      {
        systemPrompt,
        complexity: "complex",
        temperature: 0.4, // Lower temperature for consistent, factual resume content
        maxTokens: 3000,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(`Resume optimization failed: ${response.error}`);
    }

    try {
      // Clean AI response (remove markdown code blocks if present)
      let cleanedData = response.data.trim();
      if (cleanedData.startsWith('```')) {
        cleanedData = cleanedData
          .replace(/^```json?\n?/i, '')
          .replace(/\n?```$/, '')
          .trim();
      }

      const parsed = JSON.parse(cleanedData);
      return this.validateAndProcessOptimizedResume(parsed);
    } catch (error) {
      console.error("Failed to parse resume optimization response:", error);
      // Return fallback optimized resume
      return this.generateFallbackResume(request);
    }
  }

  /**
   * Build system prompt for resume optimization
   */
  private buildOptimizationSystemPrompt(format: string): string {
    const formatGuidelines = {
      "ats-friendly": `
- Use standard section headings (EXPERIENCE, EDUCATION, SKILLS)
- Avoid graphics, tables, or complex formatting
- Use standard fonts and simple bullet points
- Include keywords naturally throughout
- Quantify achievements with metrics
- Use reverse chronological order`,
      modern: `
- Clean, contemporary layout with clear sections
- Bold section headers and company names
- Use action verbs and quantified results
- Include relevant projects and achievements
- Balance visual appeal with ATS compatibility`,
      executive: `
- Executive summary at the top highlighting leadership impact
- Focus on strategic achievements and business results
- Include board positions, advisory roles, speaking engagements
- Emphasize revenue growth, team building, organizational transformation
- Professional, authoritative tone`,
      creative: `
- Showcase unique value proposition and personal brand
- Include portfolio links, creative projects, publications
- Highlight innovative solutions and creative problem-solving
- Use engaging language while maintaining professionalism
- Balance creativity with clarity`
    };

    return `You are an expert resume writer and career counselor specializing in creating tailored, high-impact resumes.

RESUME OPTIMIZATION GUIDELINES:
${formatGuidelines[format as keyof typeof formatGuidelines]}

KEY PRINCIPLES:
1. **Job-Specific Tailoring**: Align every section with the specific job requirements
2. **Achievement-Oriented**: Transform responsibilities into measurable achievements
3. **Keyword Optimization**: Naturally incorporate industry and job-specific keywords
4. **Impact Focus**: Lead with results, not just duties
5. **Relevance**: Prioritize and emphasize most relevant experience
6. **Honesty**: Never fabricate - only reorganize and highlight existing strengths
7. **Quantification**: Add metrics where possible (%, $, #, time saved, etc.)

CONTENT GUIDELINES:
- Professional Summary: 3-4 sentences highlighting key value propositions for THIS specific role
- Experience: Focus on achievements relevant to the target job, use STAR method
- Skills: Prioritize technical skills mentioned in job description
- Projects: Include only projects demonstrating relevant capabilities
- Education: Keep concise unless specifically relevant to the role

RESPONSE FORMAT:
Return valid JSON only with this structure:
{
  "content": "Full formatted resume text",
  "structure": {
    "header": {
      "name": "Full Name",
      "contact": "Email | Phone | LinkedIn | Location",
      "summary": "Professional summary paragraph"
    },
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "dates": "MM/YYYY - MM/YYYY",
        "achievements": [
          "Achievement 1 with quantifiable impact",
          "Achievement 2 highlighting relevant skills",
          "Achievement 3 matching job requirements"
        ]
      }
    ],
    "skills": {
      "technical": ["Skill 1 from job req", "Skill 2 from job req"],
      "soft": ["Leadership", "Communication"],
      "certifications": ["Cert 1", "Cert 2"]
    },
    "education": [
      {
        "degree": "Degree Name",
        "institution": "School Name",
        "date": "Graduation Date"
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "description": "Brief description highlighting relevant tech/impact",
        "technologies": ["Tech 1", "Tech 2"]
      }
    ]
  },
  "keyOptimizations": ["List of major improvements made"],
  "matchedKeywords": ["Keywords from job description included"],
  "atsScore": 85,
  "suggestedImprovements": ["Additional customization suggestions"]
}

Make it compelling, truthful, and laser-focused on landing THIS specific job.`;
  }

  /**
   * Build user prompt for resume optimization
   */
  private buildOptimizationUserPrompt(request: ResumeOptimizationRequest): string {
    const { userProfile, jobListing, focusAreas, customInstructions } = request;
    const { resumeData } = userProfile;

    let prompt = `Optimize this resume for the following job opportunity:\n\n`;

    // Job details
    prompt += `TARGET JOB:\n`;
    prompt += `Position: ${jobListing.title}\n`;
    prompt += `Company: ${jobListing.company}\n`;
    prompt += `Location: ${jobListing.location}\n`;
    prompt += `Job Type: ${jobListing.jobType}\n`;
    prompt += `Key Requirements: ${jobListing.requirements.join(", ")}\n`;
    prompt += `Description: ${jobListing.description}\n\n`;

    // Candidate details
    prompt += `CANDIDATE INFORMATION:\n`;
    prompt += `Name: ${userProfile.name}\n`;
    prompt += `Contact: ${userProfile.email} | ${userProfile.phone}\n`;
    prompt += `Location: ${userProfile.location}\n\n`;

    // Current experience
    prompt += `CURRENT EXPERIENCE:\n`;
    resumeData.experience.forEach((exp, index) => {
      prompt += `${index + 1}. ${exp.title} at ${exp.company}\n`;
      prompt += `   Dates: ${exp.startDate} - ${exp.endDate}\n`;
      if (exp.responsibilities && exp.responsibilities.length > 0) {
        prompt += `   Responsibilities: ${exp.responsibilities.join("; ")}\n`;
      }
      if (exp.achievements.length > 0) {
        prompt += `   Achievements: ${exp.achievements.join("; ")}\n`;
      }
      prompt += `   Technologies: ${exp.technologies.join(", ")}\n\n`;
    });

    // Skills
    prompt += `SKILLS:\n`;
    prompt += `Technical Skills: ${resumeData.skills.technical.join(", ")}\n`;
    prompt += `Soft Skills: ${resumeData.skills.soft.join(", ")}\n`;
    if (resumeData.skills.certifications.length > 0) {
      prompt += `Certifications: ${resumeData.skills.certifications.join(", ")}\n`;
    }
    prompt += `\n`;

    // Education
    if (resumeData.education.length > 0) {
      prompt += `EDUCATION:\n`;
      resumeData.education.forEach((edu) => {
        prompt += `${edu.degree} from ${edu.institution}\n`;
        prompt += `Graduation: ${edu.graduationDate}\n`;
        if (edu.gpa) prompt += `GPA: ${edu.gpa}\n`;
        if (edu.honors && edu.honors.length > 0) {
          prompt += `Honors: ${edu.honors.join(", ")}\n`;
        }
        prompt += `\n`;
      });
    }

    // Projects
    if (resumeData.projects.length > 0) {
      prompt += `PROJECTS:\n`;
      resumeData.projects.forEach((project) => {
        prompt += `${project.name}:\n`;
        prompt += `  Description: ${project.description}\n`;
        prompt += `  Technologies: ${project.technologies.join(", ")}\n`;
        const projectUrl = project.link || project.url;
        if (projectUrl) prompt += `  Link: ${projectUrl}\n`;
        prompt += `\n`;
      });
    }

    // Focus areas
    if (focusAreas.length > 0) {
      prompt += `FOCUS AREAS (prioritize these in optimization):\n`;
      focusAreas.forEach((area) => (prompt += `- ${area}\n`));
      prompt += `\n`;
    }

    // Custom instructions
    if (customInstructions) {
      prompt += `SPECIAL INSTRUCTIONS:\n${customInstructions}\n\n`;
    }

    prompt += `OPTIMIZATION OBJECTIVES:
1. Reorganize and reframe experience to emphasize fit for THIS specific role
2. Transform responsibilities into achievement-oriented bullet points with metrics
3. Naturally incorporate keywords from the job description
4. Create a compelling professional summary targeting this opportunity
5. Prioritize most relevant skills and experience
6. Optimize for ATS (Applicant Tracking Systems)
7. Highlight transferable skills and relevant accomplishments
8. Ensure all claims are based on actual experience (DO NOT fabricate)

Create an optimized, job-specific resume that maximizes the candidate's chances of securing an interview for this exact position.`;

    return prompt;
  }

  /**
   * Validate and process optimized resume
   */
  private validateAndProcessOptimizedResume(data: any): OptimizedResume {
    return {
      content: data.content || "",
      structure: {
        header: {
          name: data.structure?.header?.name || "",
          contact: data.structure?.header?.contact || "",
          summary: data.structure?.header?.summary || "",
        },
        experience: Array.isArray(data.structure?.experience)
          ? data.structure.experience
          : [],
        skills: {
          technical: Array.isArray(data.structure?.skills?.technical)
            ? data.structure.skills.technical
            : [],
          soft: Array.isArray(data.structure?.skills?.soft)
            ? data.structure.skills.soft
            : [],
          certifications: Array.isArray(data.structure?.skills?.certifications)
            ? data.structure.skills.certifications
            : [],
        },
        education: Array.isArray(data.structure?.education)
          ? data.structure.education
          : [],
        projects: Array.isArray(data.structure?.projects)
          ? data.structure.projects
          : [],
      },
      keyOptimizations: Array.isArray(data.keyOptimizations)
        ? data.keyOptimizations
        : [],
      matchedKeywords: Array.isArray(data.matchedKeywords)
        ? data.matchedKeywords
        : [],
      atsScore: Math.min(Math.max(data.atsScore || 70, 0), 100),
      suggestedImprovements: Array.isArray(data.suggestedImprovements)
        ? data.suggestedImprovements
        : [],
    };
  }

  /**
   * Generate fallback resume when AI fails
   */
  private generateFallbackResume(
    request: ResumeOptimizationRequest
  ): OptimizedResume {
    const { userProfile, jobListing } = request;
    const { resumeData } = userProfile;

    const content = `${userProfile.name}
${userProfile.email} | ${userProfile.phone} | ${userProfile.location}

PROFESSIONAL SUMMARY
Experienced professional seeking ${jobListing.title} position at ${jobListing.company}.

EXPERIENCE
${resumeData.experience
  .map(
    (exp) =>
      `${exp.title} - ${exp.company}
${exp.startDate} - ${exp.endDate}
${(exp.responsibilities || exp.description || []).join("\n")}`
  )
  .join("\n\n")}

SKILLS
${resumeData.skills.technical.join(", ")}

EDUCATION
${resumeData.education
  .map((edu) => `${edu.degree}, ${edu.institution} (${edu.graduationDate})`)
  .join("\n")}`;

    return {
      content,
      structure: {
        header: {
          name: userProfile.name,
          contact: `${userProfile.email} | ${userProfile.phone} | ${userProfile.location}`,
          summary: `Experienced professional seeking ${jobListing.title} position`,
        },
        experience: resumeData.experience.map((exp) => ({
          title: exp.title,
          company: exp.company,
          dates: `${exp.startDate} - ${exp.endDate}`,
          achievements: exp.achievements && exp.achievements.length > 0 ? exp.achievements : (exp.responsibilities || []),
        })),
        skills: resumeData.skills,
        education: resumeData.education.map((edu) => ({
          degree: edu.degree,
          institution: edu.institution,
          date: edu.graduationDate,
        })),
        projects: resumeData.projects.map((proj) => ({
          name: proj.name,
          description: proj.description,
          technologies: proj.technologies,
        })),
      },
      keyOptimizations: ["Basic resume structure maintained"],
      matchedKeywords: [],
      atsScore: 60,
      suggestedImprovements: [
        "Add quantifiable achievements",
        "Include job-specific keywords",
        "Optimize for ATS compatibility",
      ],
    };
  }

  /**
   * Analyze existing resume for a specific job
   */
  async analyzeResume(
    userId: string,
    resumeText: string,
    jobListing: JobListing
  ): Promise<ResumeOptimizationAnalysis> {
    const systemPrompt = `You are an expert resume reviewer and ATS specialist.

ANALYSIS CRITERIA:
- ATS Compatibility (formatting, keywords, structure)
- Keyword Match with job requirements
- Achievement Impact (quantification, results-oriented)
- Relevance to target position
- Professional presentation
- Completeness and clarity

SCORING (0-100):
- Overall effectiveness
- ATS compatibility
- Keyword match percentage
- Impact/achievement score

RESPONSE FORMAT:
Return valid JSON only:
{
  "overallScore": 75,
  "atsCompatibility": 80,
  "keywordMatch": 70,
  "impactScore": 75,
  "strengths": ["specific strengths"],
  "weaknesses": ["specific weaknesses"],
  "missingKeywords": ["important keywords not found"],
  "recommendations": ["specific improvement suggestions"]
}

Be thorough and actionable in feedback.`;

    const userPrompt = `Analyze this resume for the following job:

JOB REQUIREMENTS:
Position: ${jobListing.title}
Company: ${jobListing.company}
Requirements: ${jobListing.requirements.join(", ")}
Description: ${jobListing.description}

RESUME:
${resumeText}

Provide detailed analysis focusing on how well this resume matches the job requirements and what improvements would increase interview chances.`;

    const response = await aiService.makeRequest<string>(
      userId,
      "resume_optimization" as AIFeature,
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
      let cleanedData = response.data.trim();
      if (cleanedData.startsWith('```')) {
        cleanedData = cleanedData
          .replace(/^```json?\n?/i, '')
          .replace(/\n?```$/, '')
          .trim();
      }

      const analysis = JSON.parse(cleanedData);
      return this.validateAnalysis(analysis);
    } catch (error) {
      console.error("Failed to parse resume analysis:", error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Validate analysis data
   */
  private validateAnalysis(data: any): ResumeOptimizationAnalysis {
    return {
      overallScore: Math.min(Math.max(data.overallScore || 50, 0), 100),
      atsCompatibility: Math.min(Math.max(data.atsCompatibility || 50, 0), 100),
      keywordMatch: Math.min(Math.max(data.keywordMatch || 50, 0), 100),
      impactScore: Math.min(Math.max(data.impactScore || 50, 0), 100),
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
      missingKeywords: Array.isArray(data.missingKeywords)
        ? data.missingKeywords
        : [],
      recommendations: Array.isArray(data.recommendations)
        ? data.recommendations
        : [],
    };
  }

  /**
   * Get default analysis when AI fails
   */
  private getDefaultAnalysis(): ResumeOptimizationAnalysis {
    return {
      overallScore: 50,
      atsCompatibility: 50,
      keywordMatch: 50,
      impactScore: 50,
      strengths: ["Resume content available for review"],
      weaknesses: ["Analysis unavailable at this time"],
      missingKeywords: ["Add relevant job-specific keywords"],
      recommendations: [
        "Tailor resume to specific job requirements",
        "Add quantifiable achievements",
        "Optimize for ATS compatibility",
      ],
    };
  }
}

// Export singleton instance
export const resumeOptimizerService = new ResumeOptimizerService();
