import { cachedAIService } from "./cached-service";
import { logger } from "@/lib/utils/logger";
import type { ParsedResume, JobAnalysis } from "./job-functions";

export interface CareerPath {
  title: string;
  description: string;
  timeframe: string;
  requiredSkills: string[];
  suggestedActions: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  marketDemand: "high" | "medium" | "low";
}

export interface SkillGap {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  currentLevel: "none" | "beginner" | "intermediate" | "advanced";
  targetLevel: "beginner" | "intermediate" | "advanced" | "expert";
  learningResources: string[];
  timeToAcquire: string;
}

export interface CareerAdvice {
  currentAssessment: {
    strengths: string[];
    weaknesses: string[];
    marketPosition: string;
    careerStage: "entry" | "mid-level" | "senior" | "executive";
  };
  recommendedPaths: CareerPath[];
  skillGaps: SkillGap[];
  actionPlan: {
    shortTerm: string[]; // 3-6 months
    mediumTerm: string[]; // 6-18 months
    longTerm: string[]; // 1-3 years
  };
  industryInsights: {
    trends: string[];
    opportunities: string[];
    challenges: string[];
  };
}

export interface SalaryAnalysis {
  currentMarketValue: {
    min: number;
    max: number;
    median: number;
    currency: string;
  };
  factors: {
    experience: string;
    skills: string;
    location: string;
    education: string;
  };
  negotiationTips: string[];
  salaryGrowthProjection: {
    oneYear: number;
    threeYears: number;
    fiveYears: number;
  };
}

/**
 * AI-powered career guidance and planning service
 */
export class CareerAIService {
  /**
   * Generate comprehensive career advice
   */
  async generateCareerAdvice(
    resume: ParsedResume,
    preferences?: {
      desiredRole?: string;
      industry?: string;
      location?: string;
      salaryGoal?: number;
      workLifeBalance?: "high" | "medium" | "low";
    },
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<CareerAdvice> {
    const preferencesContext = preferences
      ? `
CAREER PREFERENCES:
- Desired Role: ${preferences.desiredRole || "Open to opportunities"}
- Industry: ${preferences.industry || "Current industry"}
- Location: ${preferences.location || "Current location"}
- Salary Goal: ${
          preferences.salaryGoal
            ? `$${preferences.salaryGoal.toLocaleString()}`
            : "Market rate"
        }
- Work-Life Balance Priority: ${preferences.workLifeBalance || "medium"}
`
      : "";

    const prompt = `
Provide comprehensive career guidance for this professional:

CURRENT PROFILE:
Skills: ${resume.skills.technical.join(", ")}
Experience: ${resume.experience
      .map((exp) => `${exp.title} at ${exp.company} (${exp.duration})`)
      .join("; ")}
Education: ${resume.education
      .map((edu) => `${edu.degree} from ${edu.institution}`)
      .join("; ")}

${preferencesContext}

Analyze their profile and provide guidance in JSON format:
{
  "currentAssessment": {
    "strengths": ["key professional strengths"],
    "weaknesses": ["areas needing improvement"],
    "marketPosition": "assessment of current market value",
    "careerStage": "entry|mid-level|senior|executive"
  },
  "recommendedPaths": [
    {
      "title": "career path title",
      "description": "detailed path description",
      "timeframe": "expected timeframe",
      "requiredSkills": ["skills needed"],
      "suggestedActions": ["specific actions to take"],
      "salaryRange": {
        "min": number,
        "max": number,
        "currency": "USD"
      },
      "marketDemand": "high|medium|low"
    }
  ],
  "skillGaps": [
    {
      "skill": "skill name",
      "importance": "critical|important|nice-to-have",
      "currentLevel": "none|beginner|intermediate|advanced",
      "targetLevel": "beginner|intermediate|advanced|expert",
      "learningResources": ["suggested resources"],
      "timeToAcquire": "estimated time"
    }
  ],
  "actionPlan": {
    "shortTerm": ["actions for next 3-6 months"],
    "mediumTerm": ["actions for 6-18 months"],
    "longTerm": ["actions for 1-3 years"]
  },
  "industryInsights": {
    "trends": ["current industry trends"],
    "opportunities": ["emerging opportunities"],
    "challenges": ["industry challenges to be aware of"]
  }
}

Provide 3-4 recommended paths, focusing on realistic and achievable career progression.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 4000,
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

      const advice = JSON.parse(jsonText) as CareerAdvice;

      logger.info("Career advice generated", {
        pathsRecommended: advice.recommendedPaths.length,
        skillGaps: advice.skillGaps.length,
        careerStage: advice.currentAssessment.careerStage,
      });

      return advice;
    } catch (error) {
      logger.error("Career advice generation failed", { error });
      throw new Error("Failed to generate career advice.");
    }
  }

  /**
   * Analyze salary expectations and market positioning
   */
  async analyzeSalary(
    resume: ParsedResume,
    targetRole?: string,
    location?: string,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<SalaryAnalysis> {
    const role = targetRole || resume.experience[0]?.title || "Current role";
    const loc = location || resume.personalInfo.location || "Major US city";

    const prompt = `
Analyze salary expectations for this professional:

PROFILE:
Current/Target Role: ${role}
Location: ${loc}
Technical Skills: ${resume.skills.technical.join(", ")}
Years of Experience: ${this.estimateExperience(resume)}
Education: ${
      resume.education.map((edu) => edu.degree).join(", ") || "Not specified"
    }
Recent Position: ${
      resume.experience[0]
        ? `${resume.experience[0].title} at ${resume.experience[0].company}`
        : "N/A"
    }

Provide salary analysis in JSON format:
{
  "currentMarketValue": {
    "min": number,
    "max": number,
    "median": number,
    "currency": "USD"
  },
  "factors": {
    "experience": "how experience affects salary",
    "skills": "how skills affect salary",
    "location": "how location affects salary",
    "education": "how education affects salary"
  },
  "negotiationTips": ["specific negotiation strategies"],
  "salaryGrowthProjection": {
    "oneYear": number,
    "threeYears": number,
    "fiveYears": number
  }
}

Base analysis on current market data for the role, location, and experience level. Provide realistic ranges.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 2000,
        temperature: 0.2, // Low temperature for factual analysis
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

      const analysis = JSON.parse(jsonText) as SalaryAnalysis;

      logger.info("Salary analysis completed", {
        role,
        location: loc,
        medianSalary: analysis.currentMarketValue.median,
      });

      return analysis;
    } catch (error) {
      logger.error("Salary analysis failed", { error });
      throw new Error("Failed to analyze salary expectations.");
    }
  }

  /**
   * Generate skill development roadmap
   */
  async createSkillRoadmap(
    resume: ParsedResume,
    targetRole: string,
    timeframe: "3months" | "6months" | "1year" | "2years",
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<{
    roadmap: {
      phase: string;
      duration: string;
      skills: string[];
      resources: string[];
      milestones: string[];
    }[];
    prioritizedSkills: SkillGap[];
    learningPath: string[];
  }> {
    const prompt = `
Create a detailed skill development roadmap for this transition:

CURRENT PROFILE:
Skills: ${resume.skills.technical.join(", ")}
Experience: ${resume.experience
      .slice(0, 2)
      .map((exp) => `${exp.title} at ${exp.company}`)
      .join("; ")}

TARGET: ${targetRole}
TIMEFRAME: ${timeframe}

Create a structured learning plan in JSON format:
{
  "roadmap": [
    {
      "phase": "phase name (e.g., Foundation, Intermediate, Advanced)",
      "duration": "time duration",
      "skills": ["skills to focus on in this phase"],
      "resources": ["recommended learning resources"],
      "milestones": ["measurable goals for this phase"]
    }
  ],
  "prioritizedSkills": [
    {
      "skill": "skill name",
      "importance": "critical|important|nice-to-have",
      "currentLevel": "none|beginner|intermediate|advanced",
      "targetLevel": "beginner|intermediate|advanced|expert",
      "learningResources": ["specific resources for this skill"],
      "timeToAcquire": "estimated time"
    }
  ],
  "learningPath": ["step-by-step learning sequence"]
}

Focus on practical, achievable progression within the specified timeframe. Include both technical and soft skills.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 3000,
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

      const roadmap = JSON.parse(jsonText);

      logger.info("Skill roadmap created", {
        targetRole,
        timeframe,
        phases: roadmap.roadmap.length,
        skillsCount: roadmap.prioritizedSkills.length,
      });

      return roadmap;
    } catch (error) {
      logger.error("Skill roadmap creation failed", { error });
      throw new Error("Failed to create skill development roadmap.");
    }
  }

  /**
   * Analyze career transition feasibility
   */
  async analyzeCareerTransition(
    resume: ParsedResume,
    targetRole: string,
    targetIndustry?: string,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<{
    feasibility: "high" | "medium" | "low";
    timeframe: string;
    transferableSkills: string[];
    skillsToAcquire: string[];
    challenges: string[];
    recommendations: string[];
    successStories: string[];
  }> {
    const currentRole = resume.experience[0]?.title || "Current role";
    const currentIndustry = this.inferIndustry(resume);
    const industry = targetIndustry || "Same industry";

    const prompt = `
Analyze the feasibility of this career transition:

CURRENT SITUATION:
Role: ${currentRole}
Industry: ${currentIndustry}
Skills: ${resume.skills.technical.join(", ")}
Experience: ${this.estimateExperience(resume)} years

TARGET TRANSITION:
Role: ${targetRole}
Industry: ${industry}

Provide transition analysis in JSON format:
{
  "feasibility": "high|medium|low",
  "timeframe": "realistic timeframe for transition",
  "transferableSkills": ["skills that transfer to new role"],
  "skillsToAcquire": ["new skills needed for the transition"],
  "challenges": ["potential challenges and obstacles"],
  "recommendations": ["actionable steps to make transition successful"],
  "successStories": ["examples of similar successful transitions"]
}

Be realistic about the transition difficulty while providing encouraging and actionable guidance.`;

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

      const analysis = JSON.parse(jsonText);

      logger.info("Career transition analysis completed", {
        currentRole,
        targetRole,
        feasibility: analysis.feasibility,
        timeframe: analysis.timeframe,
      });

      return analysis;
    } catch (error) {
      logger.error("Career transition analysis failed", { error });
      throw new Error("Failed to analyze career transition.");
    }
  }

  /**
   * Estimate years of experience from resume
   */
  private estimateExperience(resume: ParsedResume): number {
    if (resume.experience.length === 0) return 0;

    // Simple estimation based on experience entries
    // In a real implementation, you'd parse duration strings more carefully
    return Math.min(resume.experience.length * 2, 15); // Cap at 15 years for estimation
  }

  /**
   * Infer industry from resume experience
   */
  private inferIndustry(resume: ParsedResume): string {
    if (resume.experience.length === 0) return "Unknown";

    const skills = resume.skills.technical.join(" ").toLowerCase();
    const experience = resume.experience
      .map((exp) => exp.description)
      .join(" ")
      .toLowerCase();
    const combined = `${skills} ${experience}`;

    if (
      combined.includes("react") ||
      combined.includes("javascript") ||
      combined.includes("frontend")
    ) {
      return "Technology/Software Development";
    }
    if (
      combined.includes("data") ||
      combined.includes("python") ||
      combined.includes("analytics")
    ) {
      return "Data Science/Analytics";
    }
    if (combined.includes("marketing") || combined.includes("social media")) {
      return "Marketing/Advertising";
    }
    if (combined.includes("finance") || combined.includes("accounting")) {
      return "Finance/Accounting";
    }

    return "General Business";
  }
}

// Singleton instance
export const careerAIService = new CareerAIService();
