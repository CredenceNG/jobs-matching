/**
 * Job Bank Canada Job Scraper
 *
 * Scrapes job listings from Job Bank Canada (Government of Canada)
 * Job Bank is Canada's official job board with government-verified listings
 *
 * @description Direct web scraper for Job Bank Canada job postings
 * @cost Free (no API required)
 * @source https://www.jobbank.gc.ca
 */

import { Page } from 'puppeteer';
import {
  BaseScraper,
  ScraperConfig,
  ScrapeResult,
  generateJobId,
  normalizeLocation,
  extractSalary,
  parseRelativeDate,
} from './base-scraper';

// =============================================================================
// TYPES
// =============================================================================

export interface JobBankJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  posted_date: string;
  source: 'Job Bank Canada';
  jobType?: string;
  remote?: boolean;
}

export interface JobBankSearchOptions {
  location?: string;
  radius?: number; // km
  jobType?: 'fulltime' | 'parttime' | 'contract' | 'seasonal';
  educationLevel?: 'highschool' | 'college' | 'bachelor' | 'master';
  remote?: boolean;
  limit?: number; // Max results to return (default: 20)
}

// =============================================================================
// JOB BANK SCRAPER CLASS
// =============================================================================

export class JobBankScraper extends BaseScraper<JobBankJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'Job Bank Canada',
      baseUrl: 'https://www.jobbank.gc.ca',
      requestDelayMs: 2000, // 2 second delay between requests
      maxRetries: 3,
      timeout: 30000,
      headless: true,
    };

    super(config);
  }

  /**
   * Main scraping method - searches Job Bank for jobs
   *
   * @param query Search query (job title, keywords)
   * @param options Search filters
   * @returns ScrapeResult with job listings
   */
  async scrape(
    query: string,
    options: JobBankSearchOptions = {}
  ): Promise<ScrapeResult<JobBankJob>> {
    const startTime = Date.now();

    try {
      console.log(`🔍 [Job Bank Canada] Starting scrape for "${query}"`);

      // Build search URL
      const searchUrl = this.buildSearchUrl(query, options);
      console.log(`🌐 [Job Bank Canada] URL: ${searchUrl}`);

      // Perform the scrape with retry logic
      const jobs = await this.withRetry(
        async () => await this.scrapeSearchPage(searchUrl, options.limit || 20),
        'scrapeSearchPage'
      );

      const duration = Date.now() - startTime;
      this.logStats(jobs.length, duration, query);

      return {
        success: true,
        data: jobs,
        itemsScraped: jobs.length,
        duration,
        source: 'Job Bank Canada',
      };
    } catch (error) {
      return this.handleError(error, 'scrape');
    } finally {
      // Don't close browser immediately - keep it for next request
      // await this.closeBrowser();
    }
  }

  /**
   * Build Job Bank search URL with filters
   */
  private buildSearchUrl(query: string, options: JobBankSearchOptions): string {
    // Job Bank URL format: https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=[query]&locationstring=[location]
    const params = new URLSearchParams();

    // Main search query
    params.set('searchstring', query);

    // Location
    if (options.location) {
      params.set('locationstring', options.location);
    }

    // Remote filter
    if (options.remote) {
      params.set('searchstring', `${query} remote`);
    }

    // Job type filter
    if (options.jobType) {
      const jobTypeMap: Record<string, string> = {
        fulltime: 'full-time',
        parttime: 'part-time',
        contract: 'contract',
        seasonal: 'seasonal',
      };
      // Note: Job Bank uses different filtering - this is a simplified approach
      // The actual site may require more specific parameters
    }

    // Education level
    if (options.educationLevel) {
      const eduMap: Record<string, string> = {
        highschool: 'highschool',
        college: 'college',
        bachelor: 'bachelor',
        master: 'master',
      };
      // Add to search query as Job Bank doesn't have direct filter
    }

    // Sort by date (most recent first)
    params.set('sort', 'D');

    return `${this.config.baseUrl}/jobsearch/jobsearch?${params.toString()}`;
  }

  /**
   * Scrape job listings from search results page
   */
  private async scrapeSearchPage(url: string, limit: number): Promise<JobBankJob[]> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();
    const jobs: JobBankJob[] = [];

    try {
      console.log(`📄 [Job Bank Canada] Loading search page...`);

      // Navigate to search page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job cards to load
      await page.waitForSelector('article.resultJobItem, .job-result-tile', { timeout: 10000 });

      console.log(`✅ [Job Bank Canada] Page loaded, extracting jobs...`);

      // Extract job cards from the page
      const jobElements = await page.$$('article.resultJobItem, .job-result-tile');
      console.log(`📋 [Job Bank Canada] Found ${jobElements.length} job cards`);

      for (const jobElement of jobElements) {
        if (jobs.length >= limit) break;

        try {
          const job = await this.extractJobFromElement(page, jobElement);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.warn(`⚠️  [Job Bank Canada] Failed to extract job:`, error);
          // Continue with next job
        }
      }

      console.log(`✅ [Job Bank Canada] Extracted ${jobs.length} jobs`);

      return jobs;
    } catch (error) {
      console.error(`❌ [Job Bank Canada] Error scraping search page:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Extract job details from a job card element
   */
  private async extractJobFromElement(
    page: Page,
    element: any
  ): Promise<JobBankJob | null> {
    try {
      // Extract job details using page.evaluate
      const jobData = await page.evaluate((el) => {
        // Helper function to get text content safely
        const getText = (selector: string): string => {
          const elem = el.querySelector(selector);
          return elem?.textContent?.trim() || '';
        };

        const getAttr = (selector: string, attr: string): string => {
          const elem = el.querySelector(selector);
          return elem?.getAttribute(attr) || '';
        };

        // Extract title
        const title = getText('.jobTitle, h3 a.resultJobItem-title, a.jobTitle-link');

        // Extract company
        const company = getText('.employer, .business-name, span[property="name"]');

        // Extract location
        const location = getText('.location, span.city, span[property="addressLocality"]');

        // Extract salary if available
        const salary = getText('.salary, .wage, span.salary');

        // Extract job type metadata
        const metadata = getText('.job-type, .employment-terms, .duration');

        // Extract job URL
        const jobLink = el.querySelector('a.resultJobItem-title, a.jobTitle-link');
        const relativeUrl = jobLink?.getAttribute('href') || '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `https://www.jobbank.gc.ca${relativeUrl}`;

        // Extract posted date
        const dateElement = getText('.date-posted, .posted-date, time');

        // Extract description snippet
        const description = getText('.description, .job-description-snippet');

        return {
          title,
          company,
          location,
          salary,
          metadata,
          url,
          postedDate: dateElement,
          description,
        };
      }, element);

      // Validate required fields
      if (!jobData.title || !jobData.company) {
        console.warn(`⚠️  [Job Bank Canada] Skipping job - missing required fields`);
        return null;
      }

      // Normalize and structure the data
      const normalizedLocation = normalizeLocation(jobData.location);
      const isRemote = normalizedLocation === 'Remote' ||
        /remote|work from home|télétravail/i.test(jobData.location) ||
        /remote/i.test(jobData.description);

      const job: JobBankJob = {
        id: generateJobId(jobData.title, jobData.company, normalizedLocation),
        title: this.cleanText(jobData.title),
        company: this.cleanText(jobData.company),
        location: normalizedLocation,
        salary: jobData.salary ? this.cleanText(jobData.salary) : undefined,
        description: this.cleanText(jobData.description) || `${jobData.title} at ${jobData.company}`,
        url: jobData.url || this.config.baseUrl,
        posted_date: parseRelativeDate(jobData.postedDate),
        source: 'Job Bank Canada',
        jobType: this.extractJobType(jobData.metadata),
        remote: isRemote,
      };

      return job;
    } catch (error) {
      console.warn(`⚠️  [Job Bank Canada] Error extracting job element:`, error);
      return null;
    }
  }

  /**
   * Extract job type from metadata text
   */
  private extractJobType(metadata: string): string | undefined {
    if (!metadata) return undefined;

    const lower = metadata.toLowerCase();

    if (lower.includes('full-time') || lower.includes('full time') || lower.includes('temps plein')) {
      return 'Full-time';
    }
    if (lower.includes('part-time') || lower.includes('part time') || lower.includes('temps partiel')) {
      return 'Part-time';
    }
    if (lower.includes('contract') || lower.includes('contrat')) {
      return 'Contract';
    }
    if (lower.includes('seasonal') || lower.includes('saisonnier')) {
      return 'Seasonal';
    }
    if (lower.includes('permanent')) {
      return 'Permanent';
    }

    return undefined;
  }

  /**
   * Scrape detailed job description from job detail page
   * (Optional - use if you need full job descriptions)
   *
   * @param jobUrl Full URL to job posting
   * @returns Full job description
   */
  async scrapeJobDetails(jobUrl: string): Promise<string | null> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();

    try {
      console.log(`📄 [Job Bank Canada] Loading job details: ${jobUrl}`);

      await page.goto(jobUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job description
      await page.waitForSelector('.job-description, #job-description', { timeout: 5000 });

      // Extract full description
      const description = await page.evaluate(() => {
        const descElement = document.querySelector('.job-description, #job-description');
        return descElement?.textContent?.trim() || null;
      });

      return description;
    } catch (error) {
      console.warn(`⚠️  [Job Bank Canada] Failed to scrape job details:`, error);
      return null;
    } finally {
      await page.close();
    }
  }
}

// Export singleton instance
export const jobBankScraper = new JobBankScraper();
