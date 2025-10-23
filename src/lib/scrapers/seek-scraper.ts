/**
 * Seek.com.au Job Scraper
 *
 * Scrapes job listings from Seek.com.au
 * Seek is Australia's largest job board with ~300K+ active listings
 *
 * @description Direct web scraper for Seek job postings
 * @cost Free (no API required)
 * @source https://www.seek.com.au
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

export interface SeekJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  posted_date: string;
  source: 'Seek.com.au';
  jobType?: string;
  remote?: boolean;
}

export interface SeekSearchOptions {
  location?: string;
  radius?: number; // km
  jobType?: 'fulltime' | 'parttime' | 'contract' | 'casual';
  workType?: 'fulltime' | 'parttime';
  remote?: boolean;
  limit?: number; // Max results to return (default: 20)
}

// =============================================================================
// SEEK SCRAPER CLASS
// =============================================================================

export class SeekScraper extends BaseScraper<SeekJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'Seek.com.au',
      baseUrl: 'https://www.seek.com.au',
      requestDelayMs: 2000, // 2 second delay between requests
      maxRetries: 3,
      timeout: 30000,
      headless: true,
    };

    super(config);
  }

  /**
   * Main scraping method - searches Seek for jobs
   *
   * @param query Search query (job title, keywords)
   * @param options Search filters
   * @returns ScrapeResult with job listings
   */
  async scrape(
    query: string,
    options: SeekSearchOptions = {}
  ): Promise<ScrapeResult<SeekJob>> {
    const startTime = Date.now();

    try {
      console.log(`🔍 [Seek.com.au] Starting scrape for "${query}"`);

      // Build search URL
      const searchUrl = this.buildSearchUrl(query, options);
      console.log(`🌐 [Seek.com.au] URL: ${searchUrl}`);

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
        source: 'Seek.com.au',
      };
    } catch (error) {
      return this.handleError(error, 'scrape');
    } finally {
      // Don't close browser immediately - keep it for next request
      // await this.closeBrowser();
    }
  }

  /**
   * Build Seek search URL with filters
   */
  private buildSearchUrl(query: string, options: SeekSearchOptions): string {
    // Seek URL format: https://www.seek.com.au/[query]-jobs/in-All-[location]
    const querySlug = encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'));
    let url = `${this.config.baseUrl}/${querySlug}-jobs`;

    // Add location if provided
    if (options.location) {
      const locationSlug = encodeURIComponent(options.location.replace(/\s+/g, '-'));
      url += `/in-All-${locationSlug}`;
    }

    // Add query parameters
    const params = new URLSearchParams();

    // Remote filter (work from home)
    if (options.remote) {
      params.set('worktype', '242'); // Work from home classification
    }

    // Job type filter
    if (options.jobType) {
      const jobTypeMap: Record<string, string> = {
        fulltime: 'full-time',
        parttime: 'part-time',
        contract: 'contract',
        casual: 'casual',
      };
      params.set('subclassification', jobTypeMap[options.jobType]);
    }

    // Work type (full-time vs part-time)
    if (options.workType) {
      const workTypeMap: Record<string, string> = {
        fulltime: '242',
        parttime: '243',
      };
      params.set('worktype', workTypeMap[options.workType]);
    }

    // Sort by date (most recent first)
    params.set('sortmode', 'ListedDate');

    const paramString = params.toString();
    if (paramString) {
      url += `?${paramString}`;
    }

    return url;
  }

  /**
   * Scrape job listings from search results page
   */
  private async scrapeSearchPage(url: string, limit: number): Promise<SeekJob[]> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();
    const jobs: SeekJob[] = [];

    try {
      console.log(`📄 [Seek.com.au] Loading search page...`);

      // Navigate to search page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job cards to load
      await page.waitForSelector('[data-search-sol-meta], article[data-card-type="JobCard"]', { timeout: 10000 });

      console.log(`✅ [Seek.com.au] Page loaded, extracting jobs...`);

      // Extract job cards from the page
      const jobElements = await page.$$('[data-search-sol-meta], article[data-card-type="JobCard"]');
      console.log(`📋 [Seek.com.au] Found ${jobElements.length} job cards`);

      for (const jobElement of jobElements) {
        if (jobs.length >= limit) break;

        try {
          const job = await this.extractJobFromElement(page, jobElement);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.warn(`⚠️  [Seek.com.au] Failed to extract job:`, error);
          // Continue with next job
        }
      }

      console.log(`✅ [Seek.com.au] Extracted ${jobs.length} jobs`);

      return jobs;
    } catch (error) {
      console.error(`❌ [Seek.com.au] Error scraping search page:`, error);
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
  ): Promise<SeekJob | null> {
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
        const title = getText('a[data-automation="jobTitle"], h3 a, .job-title');

        // Extract company
        const company = getText('a[data-automation="jobCompany"], .advertiser-name, .company-name');

        // Extract location
        const location = getText('a[data-automation="jobLocation"], .location, [data-automation="jobLocation"]');

        // Extract salary if available
        const salary = getText('[data-automation="jobSalary"], .salary, .job-salary');

        // Extract job type metadata
        const metadata = getText('[data-automation="jobClassification"], .metadata, .job-type');

        // Extract job URL
        const jobLink = el.querySelector('a[data-automation="jobTitle"], h3 a');
        const relativeUrl = jobLink?.getAttribute('href') || '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `https://www.seek.com.au${relativeUrl}`;

        // Extract posted date
        const dateElement = getText('[data-automation="jobListingDate"], .listed-date, span[data-automation="jobListingDate"]');

        // Extract description snippet
        const description = getText('[data-automation="jobShortDescription"], .job-abstract, .snippet');

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
        console.warn(`⚠️  [Seek.com.au] Skipping job - missing required fields`);
        return null;
      }

      // Normalize and structure the data
      const normalizedLocation = normalizeLocation(jobData.location);
      const isRemote = normalizedLocation === 'Remote' ||
        /remote|work from home|wfh/i.test(jobData.location) ||
        /remote/i.test(jobData.description);

      const job: SeekJob = {
        id: generateJobId(jobData.title, jobData.company, normalizedLocation),
        title: this.cleanText(jobData.title),
        company: this.cleanText(jobData.company),
        location: normalizedLocation,
        salary: jobData.salary ? this.cleanText(jobData.salary) : undefined,
        description: this.cleanText(jobData.description) || `${jobData.title} at ${jobData.company}`,
        url: jobData.url || this.config.baseUrl,
        posted_date: parseRelativeDate(jobData.postedDate),
        source: 'Seek.com.au',
        jobType: this.extractJobType(jobData.metadata),
        remote: isRemote,
      };

      return job;
    } catch (error) {
      console.warn(`⚠️  [Seek.com.au] Error extracting job element:`, error);
      return null;
    }
  }

  /**
   * Extract job type from metadata text
   */
  private extractJobType(metadata: string): string | undefined {
    if (!metadata) return undefined;

    const lower = metadata.toLowerCase();

    if (lower.includes('full-time') || lower.includes('full time')) {
      return 'Full-time';
    }
    if (lower.includes('part-time') || lower.includes('part time')) {
      return 'Part-time';
    }
    if (lower.includes('contract')) {
      return 'Contract';
    }
    if (lower.includes('casual')) {
      return 'Casual';
    }
    if (lower.includes('temporary')) {
      return 'Temporary';
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
      console.log(`📄 [Seek.com.au] Loading job details: ${jobUrl}`);

      await page.goto(jobUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job description
      await page.waitForSelector('[data-automation="jobAdDetails"], .job-description', { timeout: 5000 });

      // Extract full description
      const description = await page.evaluate(() => {
        const descElement = document.querySelector('[data-automation="jobAdDetails"], .job-description');
        return descElement?.textContent?.trim() || null;
      });

      return description;
    } catch (error) {
      console.warn(`⚠️  [Seek.com.au] Failed to scrape job details:`, error);
      return null;
    } finally {
      await page.close();
    }
  }
}

// Export singleton instance
export const seekScraper = new SeekScraper();
