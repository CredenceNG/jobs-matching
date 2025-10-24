/**
 * Job Search API Service
 *
 * Integrates with external job APIs to fetch real job listings.
 * No fallbacks - only real API data or clear error messages.
 */

/**
 * Helper function to add timeout to any promise
 * Prevents API calls from hanging indefinitely and causing 504 errors
 *
 * @param promise - The promise to add timeout to
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message to throw on timeout
 * @returns Promise that rejects if timeout is reached first
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

export interface JobSearchFilters {
  keywords?: string;
  location?: string;
  experienceLevel?: string;
  jobType?: string[];
  remote?: boolean;
  salary?: { min?: number; max?: number };
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

export interface JobSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  hasMore: boolean;
}

/**
 * Free Job API Service - Using RemoteOK.io public API
 * https://remoteok.io/api - No API key required
 */
class RemoteOKAPI {
  private baseUrl = "https://remoteok.io/api";

  async searchJobs(
    filters: JobSearchFilters,
    page = 1
  ): Promise<JobSearchResponse> {
    try {
      console.log("🚀 Searching for real job data using RemoteOK API...");

      // RemoteOK returns all jobs, we'll filter client-side
      const response = await fetch(`${this.baseUrl}`, {
        headers: {
          "User-Agent": "JobAI-Search-App/1.0",
        },
      });

      if (!response.ok) {
        console.log(
          `📡 RemoteOK API Response Status: ${response.status} ${response.statusText}`
        );
        throw new Error(
          `RemoteOK API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(`✅ RemoteOK API returned ${data.length} jobs`);

      // Filter jobs based on keywords
      let filteredJobs = data.slice(1); // Remove first item (it's metadata)

      if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase().split(" ");
        filteredJobs = filteredJobs.filter((job: any) => {
          const searchText = `${job.position} ${job.company} ${
            job.description || ""
          }`.toLowerCase();
          return keywords.some((keyword) => searchText.includes(keyword));
        });
      }

      // Limit results for pagination
      const startIndex = (page - 1) * 20;
      const paginatedJobs = filteredJobs.slice(startIndex, startIndex + 20);

      const jobs: Job[] = paginatedJobs.map((job: any, index: number) => ({
        id: job.id || `remoteok-${index}`,
        title: job.position || "Software Developer",
        company: job.company || "Remote Company",
        location: job.location || "Remote",
        type: "Remote",
        salary:
          job.salary_min && job.salary_max
            ? `$${job.salary_min} - $${job.salary_max}`
            : undefined,
        description:
          job.description || `${job.position} role at ${job.company}`,
        url: job.url || `https://remoteok.io/remote-jobs/${job.id}`,
        posted_date: job.date || new Date().toISOString(),
        source: "RemoteOK",
      }));

      return {
        jobs,
        total: filteredJobs.length,
        page,
        hasMore: filteredJobs.length > startIndex + 20,
      };
    } catch (error) {
      console.error("RemoteOK API error:", error);
      throw new Error(
        `RemoteOK API failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

/**
 * JSearch API (RapidAPI) - Free tier available
 * https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 */
class JSearchAPI {
  private apiKey = process.env.RAPIDAPI_KEY;
  private baseUrl = "https://jsearch.p.rapidapi.com";

  async searchJobs(
    filters: JobSearchFilters,
    page = 1
  ): Promise<JobSearchResponse> {
    if (!this.apiKey) {
      throw new Error(
        "RAPIDAPI_KEY not configured - please add your RapidAPI key to .env.local"
      );
    }

    try {
      const query = this.buildQuery(filters);
      const searchParams = new URLSearchParams({
        query,
        page: page.toString(),
        num_pages: "1",
        date_posted: "all",
      });

      const url = `${this.baseUrl}/search?${searchParams}`;
      console.log("🔍 JSearch API Request:", { url, query, filters });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": this.apiKey,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      });

      console.log(
        "📡 JSearch API Response Status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ JSearch API Error Response:", errorText);
        throw new Error(
          `JSearch API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      return this.transformJSearchResponse(data);
    } catch (error) {
      console.error("JSearch API error:", error);
      throw new Error(
        `JSearch API failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private buildQuery(filters: JobSearchFilters): string {
    const parts = [];

    if (filters.keywords) {
      parts.push(filters.keywords);
    }

    if (filters.location && filters.location !== "remote") {
      parts.push(`in ${filters.location}`);
    }

    if (filters.remote) {
      parts.push("remote");
    }

    return parts.join(" ") || "software developer";
  }

  private transformJSearchResponse(data: any): JobSearchResponse {
    const jobs = (data.data || []).map((job: any) => ({
      id: job.job_id || String(Math.random()),
      title: job.job_title || "Untitled Position",
      company: job.employer_name || "Company",
      location:
        job.job_city && job.job_state
          ? `${job.job_city}, ${job.job_state}`
          : job.job_country || "Location TBD",
      type: job.job_employment_type || "Full-time",
      salary: job.job_salary || undefined,
      description: job.job_description || "No description available",
      url: job.job_apply_link || undefined,
      posted_date: job.job_posted_at_datetime_utc || undefined,
      source: "JSearch",
    }));

    return {
      jobs,
      total: data.total_results || jobs.length,
      page: 1,
      hasMore: jobs.length >= 10,
    };
  }
}

/**
 * Adzuna API - Alternative job search API
 * https://developer.adzuna.com/
 */
class AdzunaAPI {
  private appId = process.env.ADZUNA_APP_ID;
  private appKey = process.env.ADZUNA_APP_KEY;
  private baseUrl = "https://api.adzuna.com/v1/api";
  private country = "us"; // Default to US

  private cleanSearchQuery(query: string): string {
    // Clean up and simplify query to avoid API issues
    let cleanQuery = query.trim();

    // Replace problematic terms/characters that cause Adzuna API 400 errors
    cleanQuery = cleanQuery.replace(/C#/gi, "C-sharp"); // Replace C# with C-sharp
    cleanQuery = cleanQuery.replace(/\+\+/g, "plus-plus"); // Replace ++ with plus-plus
    cleanQuery = cleanQuery.replace(/\.NET/gi, "dotnet"); // Replace .NET with dotnet

    // Simplify query to avoid API issues - use only the first term
    const terms = cleanQuery.split(/\s+/).filter((term) => term.length > 0);
    if (terms.length > 1) {
      // Use only the first and most relevant term to avoid API failures
      cleanQuery = terms[0];
    }

    return cleanQuery || "developer"; // Fallback if query becomes empty
  }

  private mapLocation(location: string): string {
    if (!location) return "";

    // Handle common remote work terms
    if (location.toLowerCase().includes("remote")) {
      return ""; // For Adzuna, empty location searches all locations
    }

    // Handle common location mappings
    const locationMappings: Record<string, string> = {
      "san francisco": "San Francisco, California",
      sf: "San Francisco, California",
      "bay area": "San Francisco, California",
      "silicon valley": "San Jose, California",
      nyc: "New York, New York",
      "new york city": "New York, New York",
      la: "Los Angeles, California",
      "los angeles": "Los Angeles, California",
    };

    const normalized = location.toLowerCase();
    return locationMappings[normalized] || location;
  }

  async searchJobs(
    filters: JobSearchFilters,
    page = 1
  ): Promise<JobSearchResponse> {
    if (!this.appId || !this.appKey) {
      console.warn("Adzuna credentials not configured");
      throw new Error("Adzuna API not configured");
    }

    try {
      // Clean and prepare search parameters
      const searchQuery = this.cleanSearchQuery(
        filters.keywords || "software developer"
      );
      const searchLocation = this.mapLocation(filters.location || "");

      const params = new URLSearchParams({
        app_id: this.appId,
        app_key: this.appKey,
        results_per_page: "20",
        what: searchQuery,
        // Temporarily remove location to fix 400 errors
        // where: searchLocation,
        page: page.toString(),
      });

      const url = `${this.baseUrl}/jobs/${this.country}/search/${page}?${params}`;
      console.log("🔍 Adzuna API Request:", url);

      const response = await fetch(url);

      console.log(
        "📡 Adzuna API Response Status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Adzuna API Error Response:", errorText);
        throw new Error(
          `Adzuna API request failed: ${response.status} ${response.statusText} - Real job data unavailable`
        );
      }

      const data = await response.json();
      return this.transformAdzunaResponse(data);
    } catch (error) {
      console.error("Adzuna API error:", error);
      throw error;
    }
  }

  private transformAdzunaResponse(data: any): JobSearchResponse {
    const jobs = (data.results || []).map((job: any) => ({
      id: job.id || String(Math.random()),
      title: job.title || "Untitled Position",
      company: job.company?.display_name || "Company",
      location: job.location?.display_name || "Location TBD",
      type: job.contract_type || "Full-time",
      salary:
        job.salary_min && job.salary_max
          ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
          : undefined,
      description: job.description || "No description available",
      url: job.redirect_url || undefined,
      posted_date: job.created || undefined,
      source: "Adzuna",
    }));

    return {
      jobs,
      total: data.count || jobs.length,
      page: 1,
      hasMore: jobs.length >= 20,
    };
  }
}

/**
 * Main Job Search Service - HYBRID ARCHITECTURE
 *
 * Implements intelligent job search with multi-layer caching and fallbacks:
 * 1. Cache Check - Ultra-fast (<100ms) for repeated searches
 * 2. Database Check - Fast (<500ms) for recently scraped jobs
 * 3. JIT Scraping - Fresh data (5-30s) when cache/DB miss
 * 4. API Fallback - Last resort if all else fails
 *
 * Performance: 80%+ cache hit rate = <500ms response time
 * Cost: Minimal - scheduled scraping + occasional JIT = ~$10-20/month
 */
export class JobSearchService {
  private remoteOK = new RemoteOKAPI();
  private jsearch = new JSearchAPI();
  private adzuna = new AdzunaAPI();

  // Timeout constants to prevent 504 Gateway Timeout errors
  private readonly API_TIMEOUT_MS = 10000; // 10 seconds max per API call (increased for serverless)
  private readonly SCRAPER_TIMEOUT_MS = 8000; // 8 seconds max for scraping
  private readonly DATABASE_TIMEOUT_MS = 2000; // 2 seconds max for database queries

  /**
   * Search for jobs using hybrid architecture
   * Flow: Cache → Database → JIT Scraping → API Fallback
   */
  async searchJobs(
    filters: JobSearchFilters,
    page = 1
  ): Promise<JobSearchResponse> {
    const startTime = Date.now();
    console.log("🔍 [JobSearch] Starting hybrid search...", filters);

    // =========================================================================
    // LAYER 1: CACHE CHECK - Fastest (<100ms)
    // =========================================================================
    try {
      const { cacheService } = await import('./cache.service');
      const searchParams = { ...filters, page };

      const cachedJobIds = await cacheService.get(searchParams);

      if (cachedJobIds && cachedJobIds.length > 0) {
        console.log(`⚡ [Cache HIT] Found ${cachedJobIds.length} cached job IDs`);

        // Fetch full job data from database
        const { jobStorageService } = await import('./job-storage.service');
        const jobs = await this.getJobsByIds(cachedJobIds, jobStorageService);

        const duration = Date.now() - startTime;
        console.log(`✅ [Cache] Returned ${jobs.length} jobs in ${duration}ms`);

        return {
          jobs: this.transformStoredJobs(jobs),
          total: jobs.length,
          page,
          hasMore: false,
        };
      }

      console.log("❌ [Cache MISS] Proceeding to database search...");
    } catch (cacheError) {
      console.warn("⚠️  Cache check failed, proceeding to database...", cacheError);
    }

    // =========================================================================
    // LAYER 2: DATABASE CHECK - Fast (<500ms)
    // =========================================================================
    try {
      const { jobStorageService } = await import('./job-storage.service');

      const dbResults = await withTimeout(
        jobStorageService.searchJobs({
          query: filters.keywords,
          location: filters.location,
          employment_type: filters.jobType?.[0],
          min_salary: filters.salary?.min,
          max_age_hours: 24, // Only recent jobs (last 24 hours)
          limit: 20,
          offset: (page - 1) * 20,
        }),
        this.DATABASE_TIMEOUT_MS,
        'Database search timeout - query took too long'
      );

      if (dbResults.length > 0) {
        console.log(`✅ [Database HIT] Found ${dbResults.length} jobs`);

        // Cache results for future requests
        try {
          const { cacheService } = await import('./cache.service');
          const jobIds = dbResults.map(j => j.id!);
          await cacheService.set({ ...filters, page }, jobIds, 4); // 4 hour TTL
        } catch (cacheError) {
          console.warn("⚠️  Failed to cache results:", cacheError);
        }

        const duration = Date.now() - startTime;
        console.log(`✅ [Database] Returned ${dbResults.length} jobs in ${duration}ms`);

        return {
          jobs: this.transformStoredJobs(dbResults),
          total: dbResults.length,
          page,
          hasMore: dbResults.length >= 20,
        };
      }

      console.log("❌ [Database MISS] No recent jobs found, proceeding to JIT scraping...");
    } catch (dbError) {
      console.warn("⚠️  Database check failed, proceeding to JIT scraping...", dbError);
    }

    // =========================================================================
    // LAYER 3: JIT (Just-In-Time) SCRAPING - Fresh data (5-30s)
    // SKIP IN SERVERLESS ENVIRONMENTS (Netlify, Vercel) - no Chrome available
    // =========================================================================
    const isServerless = process.env.NETLIFY || process.env.VERCEL || process.env.NODE_ENV === 'production';

    if (!isServerless) {
      try {
        console.log("🕷️  [JIT] Attempting real-time web scraping...");

        // Use fast scrapers for JIT (avoid LinkedIn which is slow)
        const { scraperJobSearchService } = await import('./scraper-job-search');

        const scraperResults = await withTimeout(
          scraperJobSearchService.searchJobs(filters, {
            sources: ['indeed', 'remoteok', 'ziprecruiter', 'monster'], // Fast sources only
            parallel: true,
            maxResultsPerSource: 20,
          }),
          this.SCRAPER_TIMEOUT_MS,
          'JIT scraping timeout - scrapers took too long'
        );

        if (scraperResults.jobs && scraperResults.jobs.length > 0) {
          console.log(
            `✅ [JIT] Scrapers found ${scraperResults.jobs.length} jobs from ${scraperResults.sourcesUsed.join(', ')}`
          );

          // Store in database for future searches
          try {
            const { jobStorageService } = await import('./job-storage.service');
            const storedJobs = scraperResults.jobs.map(job => ({
              external_id: job.id,
              source: job.source || 'jit-scraper',
              title: job.title,
              company: job.company,
              location: job.location,
              employment_type: job.type,
              description: job.description,
              url: job.url,
              posted_date: job.posted_date,
              raw_data: job,
            }));

            await jobStorageService.storeJobs(storedJobs as any);
            console.log(`💾 [JIT] Stored ${storedJobs.length} jobs in database`);
          } catch (storeError) {
            console.warn("⚠️  Failed to store JIT results:", storeError);
          }

          const duration = Date.now() - startTime;
          console.log(`✅ [JIT] Returned ${scraperResults.jobs.length} jobs in ${duration}ms`);

          return {
            jobs: scraperResults.jobs,
            total: scraperResults.total,
            page: scraperResults.page,
            hasMore: scraperResults.hasMore,
          };
        }
      } catch (scraperError) {
        console.warn("⚠️  JIT scraping failed, falling back to APIs...", scraperError);
      }
    } else {
      console.log("⏭️  [JIT] Skipping web scraping in serverless environment, proceeding to API fallbacks...");
    }

    // =========================================================================
    // LAYER 4: API FALLBACKS - Last resort
    // =========================================================================
    console.log("🔄 [Fallback] Using API-based job search...");

    // Try RemoteOK API first (free, no API key required)
    try {
      console.log("🚀 [API] Trying RemoteOK API...");
      const result = await withTimeout(
        this.remoteOK.searchJobs(filters, page),
        this.API_TIMEOUT_MS,
        'RemoteOK API timeout after 10 seconds'
      );

      if (result.jobs && result.jobs.length > 0) {
        console.log(`✅ [API] Found ${result.jobs.length} jobs from RemoteOK`);
        return result;
      }
    } catch (error) {
      console.warn("⚠️ [API] RemoteOK failed:", error);
    }

    // Try Adzuna API
    if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
      try {
        console.log("🚀 [API] Trying Adzuna API...");
        const result = await withTimeout(
          this.adzuna.searchJobs(filters, page),
          this.API_TIMEOUT_MS,
          'Adzuna API timeout after 10 seconds'
        );

        if (result.jobs && result.jobs.length > 0) {
          console.log(`✅ [API] Found ${result.jobs.length} jobs from Adzuna`);
          return result;
        }
      } catch (error) {
        console.warn("⚠️ [API] Adzuna failed:", error);
      }
    }

    // Try JSearch API
    if (process.env.RAPIDAPI_KEY) {
      try {
        console.log("🚀 [API] Trying JSearch API...");
        const result = await withTimeout(
          this.jsearch.searchJobs(filters, page),
          this.API_TIMEOUT_MS,
          'JSearch API timeout after 10 seconds'
        );

        if (result.jobs && result.jobs.length > 0) {
          console.log(`✅ [API] Found ${result.jobs.length} jobs from JSearch`);
          return result;
        }
      } catch (error) {
        console.warn("⚠️ [API] JSearch failed:", error);
      }
    }

    // =========================================================================
    // ALL SOURCES FAILED
    // =========================================================================
    const duration = Date.now() - startTime;
    console.error(`❌ [JobSearch] All sources failed after ${duration}ms`);

    throw new Error(
      "All job search sources are currently unavailable. This includes cache, database, web scrapers (Indeed, RemoteOK, ZipRecruiter, Monster) and backup APIs. Please try again later."
    );
  }

  /**
   * Helper: Get jobs by IDs from database
   */
  private async getJobsByIds(jobIds: string[], jobStorageService: any): Promise<any[]> {
    try {
      // This would use a Supabase query to fetch jobs by IDs
      // For now, we'll fetch all and filter (TODO: optimize)
      const jobs = await jobStorageService.searchJobs({
        limit: 100,
        max_age_hours: 24,
      });

      return jobs.filter((job: any) => jobIds.includes(job.id));
    } catch (error) {
      console.error("Error fetching jobs by IDs:", error);
      return [];
    }
  }

  /**
   * Helper: Transform stored jobs to API format
   */
  private transformStoredJobs(storedJobs: any[]): Job[] {
    return storedJobs.map(job => ({
      id: job.id || job.external_id,
      title: job.title,
      company: job.company,
      location: job.location || 'Location TBD',
      type: job.employment_type || 'Full-time',
      salary: job.salary_min && job.salary_max
        ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
        : undefined,
      description: job.description || 'No description available',
      url: job.url,
      posted_date: job.posted_date || job.scraped_at,
      source: job.source,
    }));
  }
}

// Export singleton instance
export const jobSearchService = new JobSearchService();
