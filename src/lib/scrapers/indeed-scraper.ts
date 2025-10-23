/**
 * Indeed Job Scraper
 *
 * Scrapes job listings directly from Indeed.com
 * Indeed is the largest job board with ~500K active listings
 *
 * @description Direct web scraper for Indeed job postings
 * @cost Free (no API required)
 * @source https://www.indeed.com
 */

import { Page } from 'puppeteer-core';
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

export interface IndeedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  posted_date: string;
  source: 'Indeed';
  jobType?: string;
  remote?: boolean;
}

export interface IndeedSearchOptions {
  location?: string;
  radius?: number; // miles
  jobType?: 'fulltime' | 'parttime' | 'contract' | 'temporary' | 'internship';
  experienceLevel?: 'entry_level' | 'mid_level' | 'senior_level';
  remote?: boolean;
  limit?: number; // Max results to return (default: 20)
}

// =============================================================================
// INDEED SCRAPER CLASS
// =============================================================================

export class IndeedScraper extends BaseScraper<IndeedJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'Indeed',
      baseUrl: 'https://www.indeed.com',
      requestDelayMs: 2000, // 2 second delay between requests
      maxRetries: 3,
      timeout: 30000,
      headless: true,
    };

    super(config);
  }

  /**
   * Main scraping method - searches Indeed for jobs
   *
   * @param query Search query (job title, keywords)
   * @param options Search filters
   * @returns ScrapeResult with job listings
   */
  async scrape(
    query: string,
    options: IndeedSearchOptions = {}
  ): Promise<ScrapeResult<IndeedJob>> {
    const startTime = Date.now();

    try {
      console.log(`🔍 [Indeed] Starting scrape for "${query}"`);

      // Build search URL
      const searchUrl = this.buildSearchUrl(query, options);
      console.log(`🌐 [Indeed] URL: ${searchUrl}`);

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
        source: 'Indeed',
      };
    } catch (error) {
      return this.handleError(error, 'scrape');
    } finally {
      // Don't close browser immediately - keep it for next request
      // await this.closeBrowser();
    }
  }

  /**
   * Build Indeed search URL with filters
   */
  private buildSearchUrl(query: string, options: IndeedSearchOptions): string {
    const params = new URLSearchParams();

    // Main search query
    params.set('q', query);

    // Location
    if (options.location) {
      params.set('l', options.location);
    }

    // Remote filter
    if (options.remote) {
      params.set('remotejob', '1');
      params.set('rbl', 'Remote');
      params.set('sc', '0kf%3Aattr(DSQF7)%3B');
    }

    // Job type filter
    if (options.jobType) {
      const jobTypeMap: Record<string, string> = {
        fulltime: 'fulltime',
        parttime: 'parttime',
        contract: 'contract',
        temporary: 'temporary',
        internship: 'internship',
      };
      params.set('jt', jobTypeMap[options.jobType]);
    }

    // Experience level
    if (options.experienceLevel) {
      const expMap: Record<string, string> = {
        entry_level: 'entry_level',
        mid_level: 'mid_level',
        senior_level: 'senior_level',
      };
      params.set('explvl', expMap[options.experienceLevel]);
    }

    // Sort by date (most recent first)
    params.set('sort', 'date');

    return `${this.config.baseUrl}/jobs?${params.toString()}`;
  }

  /**
   * Scrape job listings from search results page
   */
  private async scrapeSearchPage(url: string, limit: number): Promise<IndeedJob[]> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();
    const jobs: IndeedJob[] = [];

    try {
      console.log(`📄 [Indeed] Loading search page...`);

      // Navigate to search page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job cards to load
      await page.waitForSelector('.job_seen_beacon', { timeout: 10000 });

      console.log(`✅ [Indeed] Page loaded, extracting jobs...`);

      // Extract job cards from the page
      const jobElements = await page.$$('.job_seen_beacon');
      console.log(`📋 [Indeed] Found ${jobElements.length} job cards`);

      for (const jobElement of jobElements) {
        if (jobs.length >= limit) break;

        try {
          const job = await this.extractJobFromElement(page, jobElement);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.warn(`⚠️  [Indeed] Failed to extract job:`, error);
          // Continue with next job
        }
      }

      console.log(`✅ [Indeed] Extracted ${jobs.length} jobs`);

      return jobs;
    } catch (error) {
      console.error(`❌ [Indeed] Error scraping search page:`, error);
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
  ): Promise<IndeedJob | null> {
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
        const title = getText('.jobTitle span[title], .jobTitle a, .jcs-JobTitle');

        // Extract company
        const company = getText('[data-testid="company-name"], .companyName');

        // Extract location
        const location = getText('[data-testid="text-location"], .companyLocation');

        // Extract salary if available
        const salary = getText('.salary-snippet, .metadata.salary-snippet-container');

        // Extract job type metadata
        const metadata = getText('.metadata');

        // Extract job URL
        const jobLink = el.querySelector('.jcs-JobTitle');
        const jobKey = jobLink?.getAttribute('data-jk') || jobLink?.getAttribute('id') || '';
        const url = jobKey ? `https://www.indeed.com/viewjob?jk=${jobKey}` : '';

        // Extract posted date
        const dateElement = el.querySelector('[data-testid="myJobsStateDate"], .date');
        const postedDate = dateElement?.textContent?.trim() || '';

        // Extract description snippet
        const description = getText('.job-snippet, .jobCardShelfContainer');

        return {
          title,
          company,
          location,
          salary,
          metadata,
          url,
          postedDate,
          description,
        };
      }, element);

      // Validate required fields
      if (!jobData.title || !jobData.company) {
        console.warn(`⚠️  [Indeed] Skipping job - missing required fields`);
        return null;
      }

      // Normalize and structure the data
      const normalizedLocation = normalizeLocation(jobData.location);
      const isRemote = normalizedLocation === 'Remote' ||
        /remote/i.test(jobData.location) ||
        /work from home/i.test(jobData.description);

      const job: IndeedJob = {
        id: generateJobId(jobData.title, jobData.company, normalizedLocation),
        title: this.cleanText(jobData.title),
        company: this.cleanText(jobData.company),
        location: normalizedLocation,
        salary: jobData.salary ? this.cleanText(jobData.salary) : undefined,
        description: this.cleanText(jobData.description) || `${jobData.title} at ${jobData.company}`,
        url: jobData.url || this.config.baseUrl,
        posted_date: parseRelativeDate(jobData.postedDate),
        source: 'Indeed',
        jobType: this.extractJobType(jobData.metadata),
        remote: isRemote,
      };

      return job;
    } catch (error) {
      console.warn(`⚠️  [Indeed] Error extracting job element:`, error);
      return null;
    }
  }

  /**
   * Extract job type from metadata text
   */
  private extractJobType(metadata: string): string | undefined {
    if (!metadata) return undefined;

    const lower = metadata.toLowerCase();

    if (lower.includes('full-time') || lower.includes('fulltime')) {
      return 'Full-time';
    }
    if (lower.includes('part-time') || lower.includes('parttime')) {
      return 'Part-time';
    }
    if (lower.includes('contract')) {
      return 'Contract';
    }
    if (lower.includes('temporary')) {
      return 'Temporary';
    }
    if (lower.includes('internship')) {
      return 'Internship';
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
      console.log(`📄 [Indeed] Loading job details: ${jobUrl}`);

      await page.goto(jobUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job description
      await page.waitForSelector('#jobDescriptionText', { timeout: 5000 });

      // Extract full description
      const description = await page.evaluate(() => {
        const descElement = document.querySelector('#jobDescriptionText');
        return descElement?.textContent?.trim() || null;
      });

      return description;
    } catch (error) {
      console.warn(`⚠️  [Indeed] Failed to scrape job details:`, error);
      return null;
    } finally {
      await page.close();
    }
  }
}

// Export singleton instance
export const indeedScraper = new IndeedScraper();
