/**
 * Reed.co.uk Job Scraper
 *
 * Scrapes job listings from Reed.co.uk
 * Reed is the UK's largest job board with ~500K+ active listings
 *
 * @description Direct web scraper for Reed job postings
 * @cost Free (no API required)
 * @source https://www.reed.co.uk
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

export interface ReedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  posted_date: string;
  source: 'Reed.co.uk';
  jobType?: string;
  remote?: boolean;
}

export interface ReedSearchOptions {
  location?: string;
  radius?: number; // miles
  jobType?: 'permanent' | 'contract' | 'temporary' | 'parttime';
  experienceLevel?: 'graduate' | 'senior';
  remote?: boolean;
  limit?: number; // Max results to return (default: 20)
}

// =============================================================================
// REED SCRAPER CLASS
// =============================================================================

export class ReedScraper extends BaseScraper<ReedJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'Reed.co.uk',
      baseUrl: 'https://www.reed.co.uk',
      requestDelayMs: 2000, // 2 second delay between requests
      maxRetries: 3,
      timeout: 30000,
      headless: true,
    };

    super(config);
  }

  /**
   * Main scraping method - searches Reed for jobs
   *
   * @param query Search query (job title, keywords)
   * @param options Search filters
   * @returns ScrapeResult with job listings
   */
  async scrape(
    query: string,
    options: ReedSearchOptions = {}
  ): Promise<ScrapeResult<ReedJob>> {
    const startTime = Date.now();

    try {
      console.log(`🔍 [Reed.co.uk] Starting scrape for "${query}"`);

      // Build search URL
      const searchUrl = this.buildSearchUrl(query, options);
      console.log(`🌐 [Reed.co.uk] URL: ${searchUrl}`);

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
        source: 'Reed.co.uk',
      };
    } catch (error) {
      return this.handleError(error, 'scrape');
    } finally {
      // Don't close browser immediately - keep it for next request
      // await this.closeBrowser();
    }
  }

  /**
   * Build Reed search URL with filters
   */
  private buildSearchUrl(query: string, options: ReedSearchOptions): string {
    // Reed URL format: https://www.reed.co.uk/jobs/[query]-jobs-in-[location]
    let url = `${this.config.baseUrl}/jobs/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}-jobs`;

    // Add location if provided
    if (options.location) {
      url += `-in-${encodeURIComponent(options.location.toLowerCase().replace(/\s+/g, '-'))}`;
    }

    // Add query parameters
    const params = new URLSearchParams();

    // Remote filter
    if (options.remote) {
      params.set('proximity', '0');
      params.set('locationtype', 'HomeWorking');
    }

    // Job type filter
    if (options.jobType) {
      const jobTypeMap: Record<string, string> = {
        permanent: 'Permanent',
        contract: 'Contract',
        temporary: 'Temporary',
        parttime: 'PartTime',
      };
      params.set('contractType', jobTypeMap[options.jobType]);
    }

    // Experience level
    if (options.experienceLevel) {
      const expMap: Record<string, string> = {
        graduate: 'Graduate',
        senior: 'Senior',
      };
      params.set('seniorityLevel', expMap[options.experienceLevel]);
    }

    // Radius (distance in miles)
    if (options.radius) {
      params.set('proximity', options.radius.toString());
    }

    const paramString = params.toString();
    if (paramString) {
      url += `?${paramString}`;
    }

    return url;
  }

  /**
   * Scrape job listings from search results page
   */
  private async scrapeSearchPage(url: string, limit: number): Promise<ReedJob[]> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();
    const jobs: ReedJob[] = [];

    try {
      console.log(`📄 [Reed.co.uk] Loading search page...`);

      // Navigate to search page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job cards to load
      await page.waitForSelector('article.job-result', { timeout: 10000 });

      console.log(`✅ [Reed.co.uk] Page loaded, extracting jobs...`);

      // Extract job cards from the page
      const jobElements = await page.$$('article.job-result');
      console.log(`📋 [Reed.co.uk] Found ${jobElements.length} job cards`);

      for (const jobElement of jobElements) {
        if (jobs.length >= limit) break;

        try {
          const job = await this.extractJobFromElement(page, jobElement);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.warn(`⚠️  [Reed.co.uk] Failed to extract job:`, error);
          // Continue with next job
        }
      }

      console.log(`✅ [Reed.co.uk] Extracted ${jobs.length} jobs`);

      return jobs;
    } catch (error) {
      console.error(`❌ [Reed.co.uk] Error scraping search page:`, error);
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
  ): Promise<ReedJob | null> {
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
        const title = getText('h2.job-result-heading__title, a.job-title');

        // Extract company
        const company = getText('.gtmJobListingPostedBy, a.posted-by');

        // Extract location
        const location = getText('.location, .job-metadata-item--location');

        // Extract salary if available
        const salary = getText('.salary, .job-metadata-item--salary');

        // Extract job type metadata
        const metadata = getText('.job-metadata, .job-type');

        // Extract job URL
        const jobLink = el.querySelector('h2.job-result-heading__title a, a.job-title');
        const relativeUrl = jobLink?.getAttribute('href') || '';
        const url = relativeUrl ? `https://www.reed.co.uk${relativeUrl}` : '';

        // Extract posted date
        const dateElement = getText('.posted-date, .job-posted-date');

        // Extract description snippet
        const description = getText('.job-result-description, .description');

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
        console.warn(`⚠️  [Reed.co.uk] Skipping job - missing required fields`);
        return null;
      }

      // Normalize and structure the data
      const normalizedLocation = normalizeLocation(jobData.location);
      const isRemote = normalizedLocation === 'Remote' ||
        /remote|work from home|home working/i.test(jobData.location) ||
        /remote/i.test(jobData.description);

      const job: ReedJob = {
        id: generateJobId(jobData.title, jobData.company, normalizedLocation),
        title: this.cleanText(jobData.title),
        company: this.cleanText(jobData.company),
        location: normalizedLocation,
        salary: jobData.salary ? this.cleanText(jobData.salary) : undefined,
        description: this.cleanText(jobData.description) || `${jobData.title} at ${jobData.company}`,
        url: jobData.url || this.config.baseUrl,
        posted_date: parseRelativeDate(jobData.postedDate),
        source: 'Reed.co.uk',
        jobType: this.extractJobType(jobData.metadata),
        remote: isRemote,
      };

      return job;
    } catch (error) {
      console.warn(`⚠️  [Reed.co.uk] Error extracting job element:`, error);
      return null;
    }
  }

  /**
   * Extract job type from metadata text
   */
  private extractJobType(metadata: string): string | undefined {
    if (!metadata) return undefined;

    const lower = metadata.toLowerCase();

    if (lower.includes('permanent')) {
      return 'Permanent';
    }
    if (lower.includes('contract')) {
      return 'Contract';
    }
    if (lower.includes('temporary')) {
      return 'Temporary';
    }
    if (lower.includes('part-time') || lower.includes('part time')) {
      return 'Part-time';
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
      console.log(`📄 [Reed.co.uk] Loading job details: ${jobUrl}`);

      await page.goto(jobUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job description
      await page.waitForSelector('[itemprop="description"], .description', { timeout: 5000 });

      // Extract full description
      const description = await page.evaluate(() => {
        const descElement = document.querySelector('[itemprop="description"], .description');
        return descElement?.textContent?.trim() || null;
      });

      return description;
    } catch (error) {
      console.warn(`⚠️  [Reed.co.uk] Failed to scrape job details:`, error);
      return null;
    } finally {
      await page.close();
    }
  }
}

// Export singleton instance
export const reedScraper = new ReedScraper();
