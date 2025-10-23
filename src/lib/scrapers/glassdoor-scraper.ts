/**
 * Glassdoor Job Scraper
 *
 * Scrapes job listings from Glassdoor.com
 * Glassdoor provides salary data and company reviews
 *
 * @description Direct web scraper for Glassdoor
 * @cost Free (no API required)
 * @source https://www.glassdoor.com
 * @note Glassdoor has anti-scraping measures - use carefully with rate limiting
 */

import { Page } from 'puppeteer-core';
import {
  BaseScraper,
  ScraperConfig,
  ScrapeResult,
  generateJobId,
  normalizeLocation,
  parseRelativeDate,
} from './base-scraper';

// =============================================================================
// TYPES
// =============================================================================

export interface GlassdoorJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  posted_date: string;
  source: 'Glassdoor';
  companyRating?: number;
  remote?: boolean;
}

export interface GlassdoorSearchOptions {
  location?: string;
  remote?: boolean;
  limit?: number;
}

// =============================================================================
// GLASSDOOR SCRAPER CLASS
// =============================================================================

export class GlassdoorScraper extends BaseScraper<GlassdoorJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'Glassdoor',
      baseUrl: 'https://www.glassdoor.com',
      requestDelayMs: 3000, // 3 second delay (Glassdoor is strict)
      maxRetries: 2, // Fewer retries to avoid blocking
      timeout: 40000, // Longer timeout for Glassdoor
      headless: true,
    };

    super(config);
  }

  /**
   * Main scraping method
   *
   * @param query Search query (job title, keywords)
   * @param options Search filters
   * @returns ScrapeResult with job listings
   */
  async scrape(
    query: string,
    options: GlassdoorSearchOptions = {}
  ): Promise<ScrapeResult<GlassdoorJob>> {
    const startTime = Date.now();

    try {
      console.log(`🔍 [Glassdoor] Starting scrape for "${query}"`);

      const searchUrl = this.buildSearchUrl(query, options);
      console.log(`🌐 [Glassdoor] URL: ${searchUrl}`);

      const jobs = await this.withRetry(
        async () => await this.scrapeSearchPage(searchUrl, options.limit || 15),
        'scrapeSearchPage'
      );

      const duration = Date.now() - startTime;
      this.logStats(jobs.length, duration, query);

      return {
        success: true,
        data: jobs,
        itemsScraped: jobs.length,
        duration,
        source: 'Glassdoor',
      };
    } catch (error) {
      return this.handleError(error, 'scrape');
    }
  }

  /**
   * Build Glassdoor search URL
   */
  private buildSearchUrl(query: string, options: GlassdoorSearchOptions): string {
    const params = new URLSearchParams();

    // Job search query
    params.set('sc.keyword', query);

    // Location
    if (options.location) {
      params.set('locT', 'C');
      params.set('locId', ''); // Will be auto-resolved by Glassdoor
      params.set('locKeyword', options.location);
    }

    // Remote filter
    if (options.remote) {
      params.set('remoteWorkType', '1');
    }

    // Sort by relevance/date
    params.set('sortBy', 'date_desc');

    return `${this.config.baseUrl}/Job/jobs.htm?${params.toString()}`;
  }

  /**
   * Scrape job listings from search results page
   */
  private async scrapeSearchPage(
    url: string,
    limit: number
  ): Promise<GlassdoorJob[]> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();
    const jobs: GlassdoorJob[] = [];

    try {
      console.log(`📄 [Glassdoor] Loading search page...`);

      // Navigate with longer timeout for Glassdoor
      await page.goto(url, {
        waitUntil: 'domcontentloaded', // Changed from networkidle2 for speed
        timeout: this.config.timeout,
      });

      // Wait a bit for dynamic content
      await this.delay(2000);

      // Try different selectors that Glassdoor uses
      const selectors = [
        'li[data-test="jobListing"]',
        '.react-job-listing',
        '.JobsList_jobListItem__wjTHv',
        'article[data-test="job-listing"]',
      ];

      let jobElements: any[] = [];

      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          jobElements = await page.$$(selector);
          if (jobElements.length > 0) {
            console.log(`✅ [Glassdoor] Found ${jobElements.length} jobs using selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
          continue;
        }
      }

      if (jobElements.length === 0) {
        console.warn(`⚠️  [Glassdoor] No job elements found. Page might have loaded differently.`);

        // Debug: Log page content
        const html = await page.content();
        console.log('Page title:', await page.title());

        // Check for CAPTCHA or blocking
        if (html.includes('captcha') || html.includes('verify you are human')) {
          throw new Error('CAPTCHA detected - Glassdoor is blocking automated access');
        }

        return [];
      }

      // Extract jobs from found elements
      for (let i = 0; i < Math.min(jobElements.length, limit); i++) {
        try {
          const job = await this.extractJobFromElement(page, jobElements[i]);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.warn(`⚠️  [Glassdoor] Failed to extract job ${i + 1}:`, error);
        }
      }

      console.log(`✅ [Glassdoor] Extracted ${jobs.length} jobs`);

      return jobs;
    } catch (error) {
      console.error(`❌ [Glassdoor] Error scraping search page:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Extract job details from a job listing element
   */
  private async extractJobFromElement(
    page: Page,
    element: any
  ): Promise<GlassdoorJob | null> {
    try {
      const jobData = await page.evaluate((el) => {
        const getText = (selector: string): string => {
          const elem = el.querySelector(selector);
          return elem?.textContent?.trim() || '';
        };

        const getAttr = (selector: string, attr: string): string => {
          const elem = el.querySelector(selector);
          return elem?.getAttribute(attr) || '';
        };

        // Try multiple selectors for each field
        const title = getText('[data-test="job-title"], .JobCard_jobTitle__GLrsT, .jobLink');

        const company = getText('[data-test="employer-name"], .EmployerProfile_employerName__Xemli, .jobHeader');

        const location = getText('[data-test="emp-location"], .JobCard_location__N_iYE, .loc');

        const salary = getText('[data-test="detailSalary"], .JobCard_salaryEstimate__arV5J, .salaryText');

        const rating = getText('[data-test="rating"], .EmployerProfile_ratingNum__MnGSb');

        // Get job URL
        const linkElem = el.querySelector('a[data-test="job-link"], a.jobLink');
        const jobLink = linkElem?.getAttribute('href') || '';

        // Extract posted date
        const dateText = getText('[data-test="job-age"], .JobCard_listingAge__KuaxP, .minor');

        // Extract description snippet
        const description = getText('[data-test="job-description"], .JobCard_jobDescriptionSnippet__yWW8q');

        return {
          title,
          company,
          location,
          salary,
          rating,
          jobLink,
          dateText,
          description,
        };
      }, element);

      // Validate required fields
      if (!jobData.title || !jobData.company) {
        console.warn(`⚠️  [Glassdoor] Skipping job - missing title or company`);
        return null;
      }

      const normalizedLocation = normalizeLocation(jobData.location);
      const isRemote = normalizedLocation === 'Remote';

      // Build full job URL
      let fullUrl = jobData.jobLink;
      if (fullUrl && !fullUrl.startsWith('http')) {
        fullUrl = `${this.config.baseUrl}${fullUrl}`;
      }

      const job: GlassdoorJob = {
        id: generateJobId(jobData.title, jobData.company, normalizedLocation),
        title: this.cleanText(jobData.title),
        company: this.cleanText(jobData.company),
        location: normalizedLocation,
        salary: jobData.salary ? this.cleanText(jobData.salary) : undefined,
        description: this.cleanText(jobData.description) ||
                    `${jobData.title} position at ${jobData.company}`,
        url: fullUrl || this.config.baseUrl,
        posted_date: parseRelativeDate(jobData.dateText),
        source: 'Glassdoor',
        companyRating: jobData.rating ? parseFloat(jobData.rating) : undefined,
        remote: isRemote,
      };

      return job;
    } catch (error) {
      console.warn(`⚠️  [Glassdoor] Error extracting job:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const glassdoorScraper = new GlassdoorScraper();
