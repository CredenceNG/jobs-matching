/**
 * AI-Powered Intelligent Job Search
 *
 * Uses AI to search the web for jobs matching user's resume/profile.
 * More reliable than traditional scrapers - AI can:
 * 1. Generate smart search queries based on resume
 * 2. Extract job data from various formats/sites
 * 3. Filter and rank results by relevance
 * 4. Handle different job board structures
 *
 * @description AI-driven job discovery and extraction
 */

import { aiService } from "./ai-service";
import { AIFeature } from "./config";
import { ParsedResume } from "./resume-parsing";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface JobSearchRequest {
  resume: ParsedResume;
  preferences: {
    location?: string;
    remote?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    jobTypes?: string[];
    industries?: string[];
  };
  maxResults?: number;
}

export interface DiscoveredJob {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  url: string;
  source: string;
  postedDate?: string;
  remote: boolean;
  jobType: string;
  matchScore?: number;
  extractionConfidence: number;
}

export interface JobSearchResult {
  jobs: DiscoveredJob[];
  searchQueries: string[];
  totalFound: number;
  timestamp: Date;
  recommendations: string[];
}

// =============================================================================
// INTELLIGENT JOB SEARCH SERVICE
// =============================================================================

export class IntelligentJobSearchService {
  /**
   * Search for jobs using AI-powered web search
   *
   * Strategy:
   * 1. AI generates optimal search queries based on resume
   * 2. Use free job APIs or web search to find listings
   * 3. AI extracts and structures job data
   * 4. AI filters and ranks by relevance
   */
  async searchJobs(
    userId: string,
    request: JobSearchRequest
  ): Promise<JobSearchResult> {
    console.log("🔍 Starting AI-powered job search...");

    // Step 1: Generate search queries using AI
    const searchQueries = await this.generateSearchQueries(userId, request);
    console.log(`📝 Generated ${searchQueries.length} search queries`);

    // Step 2: Search using free job APIs
    const rawJobs = await this.executeSearchQueries(searchQueries, request);
    console.log(`📊 Found ${rawJobs.length} potential jobs`);

    // Step 3: AI-powered filtering and ranking
    const relevantJobs = await this.filterAndRankJobs(
      userId,
      rawJobs,
      request.resume,
      request.maxResults || 20
    );
    console.log(`✨ Filtered to ${relevantJobs.length} relevant jobs`);

    // Step 4: Generate recommendations
    const recommendations = await this.generateSearchRecommendations(
      userId,
      request.resume,
      relevantJobs
    );

    return {
      jobs: relevantJobs,
      searchQueries,
      totalFound: rawJobs.length,
      timestamp: new Date(),
      recommendations,
    };
  }

  /**
   * Use AI to generate smart search queries based on resume
   */
  private async generateSearchQueries(
    userId: string,
    request: JobSearchRequest
  ): Promise<string[]> {
    const { resume, preferences } = request;

    const systemPrompt = `You are a job search expert. Generate effective search queries for finding relevant jobs.

REQUIREMENTS:
- Generate 3-5 diverse search queries
- Mix specific job titles with skill-based searches
- Consider location and remote preferences
- Include industry-specific terms
- Optimize for common job board search patterns

RESPONSE FORMAT:
Return valid JSON only:
{
  "queries": [
    "Senior Software Engineer React Node.js remote",
    "Full Stack Developer San Francisco startup",
    "Frontend Engineer TypeScript",
    ...
  ]
}`;

    const userPrompt = `Generate job search queries for this candidate:

SKILLS: ${resume.skills.technical.slice(0, 10).join(", ")}
EXPERIENCE: ${resume.experience.map(exp => exp.title).join(", ")}
LOCATION: ${preferences.location || "Any"}
REMOTE: ${preferences.remote ? "Required" : "Preferred"}
JOB TYPES: ${preferences.jobTypes?.join(", ") || "Full-time"}
INDUSTRIES: ${preferences.industries?.join(", ") || "Technology"}

Generate diverse, effective search queries that will find the best job matches.`;

    try {
      const response = await aiService.makeRequest<string>(
        userId,
        "job_matching" as AIFeature,
        userPrompt,
        {
          systemPrompt,
          complexity: "simple",
          temperature: 0.5,
          maxTokens: 500,
        }
      );

      if (response.success && response.data) {
        const parsed = JSON.parse(this.cleanJSON(response.data));
        return parsed.queries || [];
      }
    } catch (error) {
      console.error("Failed to generate search queries:", error);
    }

    // Fallback: Generate basic queries
    return this.generateFallbackQueries(resume, preferences);
  }

  /**
   * Execute search queries using free job APIs
   */
  private async executeSearchQueries(
    queries: string[],
    request: JobSearchRequest
  ): Promise<any[]> {
    const allJobs: any[] = [];

    // Use JSearch API (RapidAPI) - you already have this configured
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

    if (!RAPIDAPI_KEY) {
      console.warn("⚠️  RAPIDAPI_KEY not configured, using mock data");
      return this.generateMockJobs(queries, request);
    }

    for (const query of queries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
      try {
        const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1`;

        const response = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            allJobs.push(...data.data);
          }
        }

        // Rate limiting
        await this.sleep(1000);
      } catch (error) {
        console.error(`Failed to search for "${query}":`, error);
      }
    }

    return allJobs;
  }

  /**
   * Use AI to filter and rank jobs by relevance
   */
  private async filterAndRankJobs(
    userId: string,
    rawJobs: any[],
    resume: ParsedResume,
    maxResults: number
  ): Promise<DiscoveredJob[]> {
    // Process in batches
    const batchSize = 10;
    const processedJobs: DiscoveredJob[] = [];

    for (let i = 0; i < Math.min(rawJobs.length, 50); i += batchSize) {
      const batch = rawJobs.slice(i, i + batchSize);
      const batchResults = await this.processJobBatch(userId, batch, resume);
      processedJobs.push(...batchResults);
    }

    // Sort by match score and return top results
    return processedJobs
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, maxResults);
  }

  /**
   * Process a batch of jobs with AI
   */
  private async processJobBatch(
    userId: string,
    jobs: any[],
    resume: ParsedResume
  ): Promise<DiscoveredJob[]> {
    const systemPrompt = `You are a job data extraction and matching expert.

TASK:
1. Extract structured job data from raw listings
2. Calculate match score (0-100) based on resume
3. Ensure all required fields are populated

RESPONSE FORMAT:
Return valid JSON only:
{
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "description": "Brief description",
      "requirements": ["Req 1", "Req 2"],
      "salary": { "min": 100000, "max": 150000, "currency": "USD" },
      "url": "https://...",
      "source": "LinkedIn",
      "remote": true,
      "jobType": "full-time",
      "matchScore": 85,
      "extractionConfidence": 95
    }
  ]
}`;

    const userPrompt = `Extract and match these jobs against the resume:

RESUME SKILLS: ${resume.skills.technical.slice(0, 15).join(", ")}
RESUME EXPERIENCE: ${resume.experience.map(exp => `${exp.title} (${exp.technologies.join(", ")})`).join("; ")}

JOBS TO PROCESS:
${JSON.stringify(jobs.slice(0, 5), null, 2)}

Extract structured data and calculate match scores.`;

    try {
      const response = await aiService.makeRequest<string>(
        userId,
        "job_matching" as AIFeature,
        userPrompt,
        {
          systemPrompt,
          complexity: "complex",
          temperature: 0.2,
          maxTokens: 3000,
        }
      );

      if (response.success && response.data) {
        const parsed = JSON.parse(this.cleanJSON(response.data));
        return parsed.jobs || [];
      }
    } catch (error) {
      console.error("Failed to process job batch:", error);
    }

    // Fallback: Basic extraction
    return jobs.map(job => this.extractJobBasic(job));
  }

  /**
   * Generate search recommendations
   */
  private async generateSearchRecommendations(
    userId: string,
    resume: ParsedResume,
    jobs: DiscoveredJob[]
  ): Promise<string[]> {
    if (jobs.length === 0) {
      return [
        "Broaden search criteria to include more job titles",
        "Consider adding related skills to your resume",
        "Try searching in nearby cities or remote positions"
      ];
    }

    const systemPrompt = `You are a career advisor providing job search recommendations.

Based on the jobs found and the user's resume, provide 3-5 actionable recommendations to improve their job search.

RESPONSE FORMAT:
Return valid JSON only:
{
  "recommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2",
    ...
  ]
}`;

    const userPrompt = `Provide job search recommendations:

RESUME SUMMARY:
Skills: ${resume.skills.technical.slice(0, 10).join(", ")}
Experience: ${resume.experience.map(exp => exp.title).join(", ")}

JOBS FOUND: ${jobs.length} matches
TOP MATCHES: ${jobs.slice(0, 3).map(j => j.title).join(", ")}
AVERAGE SCORE: ${jobs.length > 0 ? Math.round(jobs.reduce((sum, j) => sum + (j.matchScore || 0), 0) / jobs.length) : 0}%

Provide recommendations to improve job search effectiveness.`;

    try {
      const response = await aiService.makeRequest<string>(
        userId,
        "career_insights" as AIFeature,
        userPrompt,
        {
          systemPrompt,
          complexity: "simple",
          temperature: 0.6,
          maxTokens: 500,
        }
      );

      if (response.success && response.data) {
        const parsed = JSON.parse(this.cleanJSON(response.data));
        return parsed.recommendations || [];
      }
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
    }

    return [
      "Continue applying to top matched positions",
      "Tailor resume for each specific role",
      "Expand search to include related job titles"
    ];
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Clean AI JSON response (remove markdown code blocks)
   */
  private cleanJSON(text: string): string {
    return text
      .trim()
      .replace(/^```json?\n?/i, '')
      .replace(/\n?```$/, '')
      .trim();
  }

  /**
   * Generate fallback search queries
   */
  private generateFallbackQueries(
    resume: ParsedResume,
    preferences: any
  ): string[] {
    const queries: string[] = [];

    // Job title based queries
    if (resume.experience.length > 0) {
      const latestJob = resume.experience[0];
      queries.push(`${latestJob.title} ${preferences.location || ''}`);

      // Extract seniority level
      const seniority = latestJob.title.toLowerCase().includes('senior') ? 'Senior' :
                       latestJob.title.toLowerCase().includes('lead') ? 'Lead' : '';
      if (seniority) {
        queries.push(`${seniority} ${resume.skills.technical[0]} Developer`);
      }
    }

    // Skill-based queries
    const topSkills = resume.skills.technical.slice(0, 3);
    if (topSkills.length >= 2) {
      queries.push(`${topSkills[0]} ${topSkills[1]} Developer ${preferences.remote ? 'remote' : ''}`);
    }

    // Remote preference
    if (preferences.remote) {
      queries.push(`Remote ${resume.skills.technical[0]} Engineer`);
    }

    return queries.slice(0, 5);
  }

  /**
   * Basic job extraction without AI
   */
  private extractJobBasic(rawJob: any): DiscoveredJob {
    return {
      title: rawJob.job_title || rawJob.title || "Unknown Position",
      company: rawJob.employer_name || rawJob.company || "Unknown Company",
      location: rawJob.job_city && rawJob.job_state
        ? `${rawJob.job_city}, ${rawJob.job_state}`
        : rawJob.location || "Unknown Location",
      description: rawJob.job_description || rawJob.description || "",
      requirements: this.extractRequirements(rawJob.job_description || rawJob.description || ""),
      salary: rawJob.job_min_salary || rawJob.job_max_salary ? {
        min: rawJob.job_min_salary,
        max: rawJob.job_max_salary,
        currency: "USD"
      } : undefined,
      url: rawJob.job_apply_link || rawJob.url || "",
      source: rawJob.job_publisher || rawJob.source || "Unknown",
      postedDate: rawJob.job_posted_at_datetime_utc || rawJob.posted_date,
      remote: rawJob.job_is_remote || false,
      jobType: rawJob.job_employment_type || "full-time",
      matchScore: 50, // Default score
      extractionConfidence: 70,
    };
  }

  /**
   * Extract requirements from description
   */
  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];

    // Simple extraction: look for common requirement patterns
    const lines = description.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•*]\s/) || line.toLowerCase().includes('requirement') ||
          line.toLowerCase().includes('must have') || line.toLowerCase().includes('experience with')) {
        const clean = line.replace(/^[-•*]\s/, '').trim();
        if (clean.length > 10 && clean.length < 200) {
          requirements.push(clean);
        }
      }
    }

    return requirements.slice(0, 10);
  }

  /**
   * Generate mock jobs for testing
   */
  private generateMockJobs(queries: string[], request: JobSearchRequest): any[] {
    const mockJobs = [
      {
        job_title: "Senior Full Stack Engineer",
        employer_name: "TechCorp Inc.",
        job_city: "San Francisco",
        job_state: "CA",
        job_description: "We're seeking a Senior Full Stack Engineer with React and Node.js experience...",
        job_is_remote: true,
        job_employment_type: "FULLTIME",
        job_min_salary: 140000,
        job_max_salary: 180000,
        job_apply_link: "https://example.com/apply/1",
        job_publisher: "LinkedIn",
        job_posted_at_datetime_utc: new Date().toISOString(),
      },
      {
        job_title: "React Developer",
        employer_name: "Startup XYZ",
        job_city: "Austin",
        job_state: "TX",
        job_description: "Join our fast-growing startup as a React Developer...",
        job_is_remote: false,
        job_employment_type: "FULLTIME",
        job_min_salary: 100000,
        job_max_salary: 140000,
        job_apply_link: "https://example.com/apply/2",
        job_publisher: "Indeed",
        job_posted_at_datetime_utc: new Date().toISOString(),
      }
    ];

    return mockJobs;
  }

  /**
   * Sleep helper for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const intelligentJobSearchService = new IntelligentJobSearchService();
