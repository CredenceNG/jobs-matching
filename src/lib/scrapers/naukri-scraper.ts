/**
 * Naukri.com Job Scraper
 *
 * Scrapes job listings from Naukri.com
 * Naukri is India's largest job board with 100M+ users and 1M+ active listings
 *
 * @description Direct web scraper for Naukri job postings
 * @cost Free (no API required)
 * @source https://www.naukri.com
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

export interface NaukriJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  posted_date: string;
  source: 'Naukri.com';
  jobType?: string;
  remote?: boolean;
  experience?: string;
}

export interface NaukriSearchOptions {
  location?: string;
  experience?: string; // e.g., "0-2", "3-5", "5-10"
  salary?: string; // e.g., "3-6", "6-10" (in lakhs)
  remote?: boolean;
  limit?: number; // Max results to return (default: 20)
}

// =============================================================================
// NAUKRI SCRAPER CLASS
// =============================================================================

export class NaukriScraper extends BaseScraper<NaukriJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'Naukri.com',
      baseUrl: 'https://www.naukri.com',
      requestDelayMs: 2500, // 2.5 second delay (Naukri has more aggressive anti-bot)
      maxRetries: 3,
      timeout: 30000,
      headless: true,
    };

    super(config);
  }

  /**
   * Main scraping method - searches Naukri for jobs
   *
   * @param query Search query (job title, keywords)
   * @param options Search filters
   * @returns ScrapeResult with job listings
   */
  async scrape(
    query: string,
    options: NaukriSearchOptions = {}
  ): Promise<ScrapeResult<NaukriJob>> {
    const startTime = Date.now();

    try {
      console.log(`🔍 [Naukri.com] Starting scrape for "${query}"`);

      // Build search URL
      const searchUrl = this.buildSearchUrl(query, options);
      console.log(`🌐 [Naukri.com] URL: ${searchUrl}`);

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
        source: 'Naukri.com',
      };
    } catch (error) {
      return this.handleError(error, 'scrape');
    } finally {
      // Don't close browser immediately - keep it for next request
      // await this.closeBrowser();
    }
  }

  /**
   * Build Naukri search URL with filters
   */
  private buildSearchUrl(query: string, options: NaukriSearchOptions): string {
    // Naukri URL format: https://www.naukri.com/[query]-jobs-in-[location]
    const querySlug = encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'));
    let url = `${this.config.baseUrl}/${querySlug}-jobs`;

    // Add location if provided
    if (options.location) {
      const locationSlug = encodeURIComponent(options.location.toLowerCase().replace(/\s+/g, '-'));
      url += `-in-${locationSlug}`;
    }

    // Add query parameters
    const params = new URLSearchParams();

    // Experience filter
    if (options.experience) {
      params.set('experience', options.experience);
    }

    // Salary filter (in lakhs)
    if (options.salary) {
      params.set('salary', options.salary);
    }

    // Remote/Work from home filter
    if (options.remote) {
      params.set('qp', 'remote');
      params.set('remote', '1');
    }

    // Sort by relevance (default) or date
    params.set('sort', 'date');

    const paramString = params.toString();
    if (paramString) {
      url += `?${paramString}`;
    }

    return url;
  }

  /**
   * Scrape job listings from search results page
   */
  private async scrapeSearchPage(url: string, limit: number): Promise<NaukriJob[]> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();
    const jobs: NaukriJob[] = [];

    try {
      console.log(`📄 [Naukri.com] Loading search page...`);

      // Navigate to search page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job cards to load (Naukri uses dynamic class names)
      await page.waitForSelector('article.jobTuple, .tuple, .jobTuple', { timeout: 10000 });

      console.log(`✅ [Naukri.com] Page loaded, extracting jobs...`);

      // Extract job cards from the page
      const jobElements = await page.$$('article.jobTuple, .tuple, article');
      console.log(`📋 [Naukri.com] Found ${jobElements.length} job cards`);

      for (const jobElement of jobElements) {
        if (jobs.length >= limit) break;

        try {
          const job = await this.extractJobFromElement(page, jobElement);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.warn(`⚠️  [Naukri.com] Failed to extract job:`, error);
          // Continue with next job
        }
      }

      console.log(`✅ [Naukri.com] Extracted ${jobs.length} jobs`);

      return jobs;
    } catch (error) {
      console.error(`❌ [Naukri.com] Error scraping search page:`, error);
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
  ): Promise<NaukriJob | null> {
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
        const title = getText('a.title, .title, .jobTitle a, .row1 a');

        // Extract company
        const company = getText('.companyInfo, .comp-name, a.comp-name, .subTitle');

        // Extract location
        const location = getText('.location, .locWdth, li.location, span.location');

        // Extract salary if available
        const salary = getText('.salary, .ni-job-tuple-icon-srp-rupee, span.salary');

        // Extract experience
        const experience = getText('.experience, .expwdth, li.experience');

        // Extract job URL
        const jobLink = el.querySelector('a.title, .title a, .row1 a');
        const relativeUrl = jobLink?.getAttribute('href') || '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `https://www.naukri.com${relativeUrl}`;

        // Extract posted date
        const dateElement = getText('.job-post-day, .type, span.date');

        // Extract description snippet
        const description = getText('.job-description, .job-desc, .row3');

        // Extract job type
        const jobType = getText('.job-type, .type');

        return {
          title,
          company,
          location,
          salary,
          experience,
          url,
          postedDate: dateElement,
          description,
          jobType,
        };
      }, element);

      // Validate required fields
      if (!jobData.title || !jobData.company) {
        console.warn(`⚠️  [Naukri.com] Skipping job - missing required fields`);
        return null;
      }

      // Normalize and structure the data
      const normalizedLocation = normalizeLocation(jobData.location);
      const isRemote = normalizedLocation === 'Remote' ||
        /remote|work from home|wfh/i.test(jobData.location) ||
        /remote/i.test(jobData.description);

      const job: NaukriJob = {
        id: generateJobId(jobData.title, jobData.company, normalizedLocation),
        title: this.cleanText(jobData.title),
        company: this.cleanText(jobData.company),
        location: normalizedLocation,
        salary: jobData.salary ? this.cleanText(jobData.salary) : undefined,
        description: this.cleanText(jobData.description) || `${jobData.title} at ${jobData.company}`,
        url: jobData.url || this.config.baseUrl,
        posted_date: parseRelativeDate(jobData.postedDate),
        source: 'Naukri.com',
        jobType: this.extractJobType(jobData.jobType),
        remote: isRemote,
        experience: jobData.experience ? this.cleanText(jobData.experience) : undefined,
      };

      return job;
    } catch (error) {
      console.warn(`⚠️  [Naukri.com] Error extracting job element:`, error);
      return null;
    }
  }

  /**
   * Extract job type from metadata text
   */
  private extractJobType(metadata: string): string | undefined {
    if (!metadata) return undefined;

    const lower = metadata.toLowerCase();

    if (lower.includes('full time') || lower.includes('full-time')) {
      return 'Full-time';
    }
    if (lower.includes('part time') || lower.includes('part-time')) {
      return 'Part-time';
    }
    if (lower.includes('contract') || lower.includes('contractual')) {
      return 'Contract';
    }
    if (lower.includes('temporary')) {
      return 'Temporary';
    }
    if (lower.includes('internship')) {
      return 'Internship';
    }
    if (lower.includes('freelance')) {
      return 'Freelance';
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
      console.log(`📄 [Naukri.com] Loading job details: ${jobUrl}`);

      await page.goto(jobUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job description
      await page.waitForSelector('.dang-inner-html, .job-description, section.job-desc', { timeout: 5000 });

      // Extract full description
      const description = await page.evaluate(() => {
        const descElement = document.querySelector('.dang-inner-html, .job-description, section.job-desc');
        return descElement?.textContent?.trim() || null;
      });

      return description;
    } catch (error) {
      console.warn(`⚠️  [Naukri.com] Failed to scrape job details:`, error);
      return null;
    } finally {
      await page.close();
    }
  }
}

// Export singleton instance
export const naukriScraper = new NaukriScraper();
