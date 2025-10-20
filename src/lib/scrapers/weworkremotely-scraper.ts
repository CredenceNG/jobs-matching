/**
 * We Work Remotely Job Scraper
 *
 * Scrapes job listings from We Work Remotely
 * We Work Remotely is a leading remote job board with global opportunities
 *
 * @description Direct web scraper for We Work Remotely job postings
 * @cost Free (no API required)
 * @source https://weworkremotely.com
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

export interface WeWorkRemotelyJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  posted_date: string;
  source: 'We Work Remotely';
  jobType?: string;
  remote: boolean; // Always true for this board
  category?: string;
}

export interface WeWorkRemotelySearchOptions {
  category?: 'programming' | 'design' | 'marketing' | 'sales' | 'support' | 'management';
  limit?: number; // Max results to return (default: 20)
}

// =============================================================================
// WE WORK REMOTELY SCRAPER CLASS
// =============================================================================

export class WeWorkRemotelyScraper extends BaseScraper<WeWorkRemotelyJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'We Work Remotely',
      baseUrl: 'https://weworkremotely.com',
      requestDelayMs: 2000, // 2 second delay between requests
      maxRetries: 3,
      timeout: 30000,
      headless: true,
    };

    super(config);
  }

  /**
   * Main scraping method - searches We Work Remotely for jobs
   *
   * @param query Search query (job title, keywords)
   * @param options Search filters
   * @returns ScrapeResult with job listings
   */
  async scrape(
    query: string,
    options: WeWorkRemotelySearchOptions = {}
  ): Promise<ScrapeResult<WeWorkRemotelyJob>> {
    const startTime = Date.now();

    try {
      console.log(`🔍 [We Work Remotely] Starting scrape for "${query}"`);

      // Build search URL
      const searchUrl = this.buildSearchUrl(query, options);
      console.log(`🌐 [We Work Remotely] URL: ${searchUrl}`);

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
        source: 'We Work Remotely',
      };
    } catch (error) {
      return this.handleError(error, 'scrape');
    } finally {
      // Don't close browser immediately - keep it for next request
      // await this.closeBrowser();
    }
  }

  /**
   * Build We Work Remotely search URL with filters
   */
  private buildSearchUrl(query: string, options: WeWorkRemotelySearchOptions): string {
    // We Work Remotely URL format: https://weworkremotely.com/remote-jobs/search?term=[query]
    const params = new URLSearchParams();

    // Main search query
    params.set('term', query);

    // Category filter (if provided)
    if (options.category) {
      const categoryMap: Record<string, string> = {
        programming: 'programming',
        design: 'design',
        marketing: 'marketing',
        sales: 'sales',
        support: 'customer-support',
        management: 'product',
      };
      // Note: Category filtering might need to be done via URL path instead
      // e.g., /categories/2-programming/jobs
    }

    return `${this.config.baseUrl}/remote-jobs/search?${params.toString()}`;
  }

  /**
   * Scrape job listings from search results page
   */
  private async scrapeSearchPage(url: string, limit: number): Promise<WeWorkRemotelyJob[]> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();
    const jobs: WeWorkRemotelyJob[] = [];

    try {
      console.log(`📄 [We Work Remotely] Loading search page...`);

      // Navigate to search page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job listings to load
      await page.waitForSelector('li.feature, section.jobs li', { timeout: 10000 });

      console.log(`✅ [We Work Remotely] Page loaded, extracting jobs...`);

      // Extract job cards from the page
      const jobElements = await page.$$('li.feature, section.jobs li');
      console.log(`📋 [We Work Remotely] Found ${jobElements.length} job cards`);

      for (const jobElement of jobElements) {
        if (jobs.length >= limit) break;

        try {
          const job = await this.extractJobFromElement(page, jobElement);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.warn(`⚠️  [We Work Remotely] Failed to extract job:`, error);
          // Continue with next job
        }
      }

      console.log(`✅ [We Work Remotely] Extracted ${jobs.length} jobs`);

      return jobs;
    } catch (error) {
      console.error(`❌ [We Work Remotely] Error scraping search page:`, error);
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
  ): Promise<WeWorkRemotelyJob | null> {
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
        const title = getText('.title, span.title, a.title');

        // Extract company
        const company = getText('.company, span.company, a.company');

        // Extract location (usually "Anywhere" for WWR)
        const location = getText('.region, .location, span.region');

        // Extract salary if available (not common on WWR)
        const salary = getText('.salary');

        // Extract job type/category
        const category = getText('.region-company, .category');

        // Extract job URL
        const jobLink = el.querySelector('a');
        const relativeUrl = jobLink?.getAttribute('href') || '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `https://weworkremotely.com${relativeUrl}`;

        // Extract posted date
        const dateElement = getText('time, .date, span.date');

        // Extract description snippet (if available)
        const description = getText('.tooltip, .description');

        return {
          title,
          company,
          location,
          salary,
          category,
          url,
          postedDate: dateElement,
          description,
        };
      }, element);

      // Validate required fields
      if (!jobData.title || !jobData.company) {
        console.warn(`⚠️  [We Work Remotely] Skipping job - missing required fields`);
        return null;
      }

      // Normalize location (always remote for this board)
      const location = jobData.location || 'Anywhere';

      const job: WeWorkRemotelyJob = {
        id: generateJobId(jobData.title, jobData.company, location),
        title: this.cleanText(jobData.title),
        company: this.cleanText(jobData.company),
        location: location,
        salary: jobData.salary ? this.cleanText(jobData.salary) : undefined,
        description: this.cleanText(jobData.description) || `${jobData.title} at ${jobData.company}`,
        url: jobData.url || this.config.baseUrl,
        posted_date: parseRelativeDate(jobData.postedDate),
        source: 'We Work Remotely',
        jobType: 'Full-time', // Most WWR jobs are full-time
        remote: true, // All jobs on WWR are remote
        category: this.cleanText(jobData.category) || undefined,
      };

      return job;
    } catch (error) {
      console.warn(`⚠️  [We Work Remotely] Error extracting job element:`, error);
      return null;
    }
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
      console.log(`📄 [We Work Remotely] Loading job details: ${jobUrl}`);

      await page.goto(jobUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job description
      await page.waitForSelector('.listing-container, .job-description', { timeout: 5000 });

      // Extract full description
      const description = await page.evaluate(() => {
        const descElement = document.querySelector('.listing-container, .job-description');
        return descElement?.textContent?.trim() || null;
      });

      return description;
    } catch (error) {
      console.warn(`⚠️  [We Work Remotely] Failed to scrape job details:`, error);
      return null;
    } finally {
      await page.close();
    }
  }
}

// Export singleton instance
export const weWorkRemotelyScraper = new WeWorkRemotelyScraper();
