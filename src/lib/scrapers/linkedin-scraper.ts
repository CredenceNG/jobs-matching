/**
 * LinkedIn Jobs Scraper
 *
 * IMPORTANT: LinkedIn has STRICT anti-scraping measures
 * - Use ONLY for scheduled scraping (NOT JIT)
 * - Long delays between requests (5+ seconds)
 * - Limited pages (max 2-3)
 * - Rotate user agents
 * - Avoid during peak hours
 *
 * @risk HIGH - Frequent IP blocking, CAPTCHA challenges
 * @frequency Scrape every 12 hours maximum
 */

import { BaseScraper, type ScraperConfig, type ScrapeResult } from './base-scraper';
import type { Page } from 'puppeteer-core';

export interface LinkedInJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type?: string;
  experience_level?: string;
  description: string;
  url: string;
  posted_date?: string;
  salary?: string;
  applicants?: number;
}

export interface LinkedInSearchOptions {
  keywords: string;
  location?: string;
  experienceLevel?: 'entry' | 'associate' | 'mid-senior' | 'director' | 'executive';
  jobType?: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
  remote?: boolean;
  maxPages?: number;
}

export class LinkedInScraper extends BaseScraper<LinkedInJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'LinkedIn',
      baseUrl: 'https://www.linkedin.com',
      rateLimit: {
        requestsPerMinute: 6, // Very conservative: 1 request every 10 seconds
        delayBetweenRequests: 5000, // 5 second delay minimum
      },
      retryOptions: {
        maxRetries: 2, // Limited retries to avoid detection
        retryDelay: 10000, // 10 second delay between retries
      },
      userAgents: [
        // Recent desktop user agents
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      ],
    };
    super(config);
  }

  /**
   * Scrape LinkedIn jobs
   *
   * @param options Search options
   * @returns Scraped jobs
   */
  async scrape(query: string, options?: any): Promise<ScrapeResult<LinkedInJob>> {
    const startTime = Date.now();

    console.log(`🔍 [LinkedIn] Starting scrape for "${options.keywords}"`);
    console.log(`⚠️  [LinkedIn] Using STRICT anti-blocking measures`);

    const maxPages = Math.min(options.maxPages || 2, 2); // Max 2 pages to reduce blocking risk
    const jobs: LinkedInJob[] = [];

    try {
      // Scrape with retry logic
      await this.withRetry(async () => {
        for (let page = 0; page < maxPages; page++) {
          console.log(`📄 [LinkedIn] Scraping page ${page + 1}/${maxPages}...`);

          const pageJobs = await this.scrapeSearchPage(options, page);
          jobs.push(...pageJobs);

          console.log(`✅ [LinkedIn] Found ${pageJobs.length} jobs on page ${page + 1}`);

          // Long delay between pages to avoid detection
          if (page < maxPages - 1) {
            const delay = 8000 + Math.random() * 4000; // 8-12 second delay
            console.log(`⏳ [LinkedIn] Waiting ${Math.round(delay / 1000)}s before next page...`);
            await this.delay(delay);
          }
        }
      }, `Search for "${query}"`);

      const duration = Date.now() - startTime;

      console.log(`📊 [LinkedIn] Scraping completed:`);
      console.log(`   Query: "${options.keywords}"`);
      console.log(`   Items: ${jobs.length}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Rate: ${(jobs.length / (duration / 1000)).toFixed(2)} items/sec`);

      return {
        success: true,
        data: jobs,
        itemsScraped: jobs.length,
        duration,
        source: 'linkedin',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [LinkedIn] Scraping error:', error);

      return {
        success: false,
        data: jobs,
        error: error instanceof Error ? error.message : 'Unknown error',
        itemsScraped: jobs.length,
        duration,
        source: 'linkedin',
      };
    }
  }

  /**
   * Scrape a single search results page
   *
   * @param options Search options
   * @param pageNumber Page number (0-indexed)
   * @returns Jobs from the page
   */
  private async scrapeSearchPage(
    options: LinkedInSearchOptions,
    pageNumber: number
  ): Promise<LinkedInJob[]> {
    const url = this.buildSearchUrl(options, pageNumber);
    console.log(`🌐 [LinkedIn] URL: ${url}`);

    const browser = await this.getBrowser();

    try {
      const page = await browser.newPage();

      // Set random user agent
      await page.setUserAgent(this.getRandomUserAgent());

      // Set viewport to mimic real browser
      await page.setViewport({
        width: 1920 + Math.floor(Math.random() * 100),
        height: 1080 + Math.floor(Math.random() * 100),
      });

      // Add extra headers to look more human
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });

      // Navigate with realistic behavior
      console.log(`📄 [LinkedIn] Loading search page...`);
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Random human-like delay
      await this.delay(2000 + Math.random() * 2000);

      // Scroll slowly to load lazy content (like a human)
      await this.humanLikeScroll(page as any);

      // Check for CAPTCHA or block page
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('security check') || bodyText.includes('unusual activity')) {
        throw new Error('LinkedIn CAPTCHA/block detected. Please wait before retrying.');
      }

      // Extract jobs
      console.log(`✅ [LinkedIn] Page loaded, extracting jobs...`);
      const jobs = await page.evaluate(this.extractJobsFromPage);

      await browser.close();

      return jobs;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Build LinkedIn search URL
   */
  private buildSearchUrl(options: LinkedInSearchOptions, pageNumber: number): string {
    const params = new URLSearchParams();

    // Keywords
    params.set('keywords', options.keywords);

    // Location
    if (options.location) {
      params.set('location', options.location);
    }

    // Experience level
    if (options.experienceLevel) {
      const experienceLevels: Record<string, string> = {
        'entry': '1',
        'associate': '2',
        'mid-senior': '3',
        'director': '4',
        'executive': '5',
      };
      params.set('f_E', experienceLevels[options.experienceLevel]);
    }

    // Job type
    if (options.jobType) {
      const jobTypes: Record<string, string> = {
        'full-time': 'F',
        'part-time': 'P',
        'contract': 'C',
        'temporary': 'T',
        'internship': 'I',
      };
      params.set('f_JT', jobTypes[options.jobType]);
    }

    // Remote
    if (options.remote) {
      params.set('f_WT', '2'); // Remote filter
    }

    // Pagination (LinkedIn uses start parameter, 25 jobs per page)
    if (pageNumber > 0) {
      params.set('start', (pageNumber * 25).toString());
    }

    // Sort by date (most recent first)
    params.set('sortBy', 'DD');

    return `${this.config.baseUrl}/jobs/search?${params.toString()}`;
  }

  /**
   * Extract jobs from page (runs in browser context)
   */
  private extractJobsFromPage(): LinkedInJob[] {
    const jobs: LinkedInJob[] = [];
    const jobCards = document.querySelectorAll('.job-search-card, .base-card');

    jobCards.forEach((card, index) => {
      try {
        // Job ID
        const jobId = card.getAttribute('data-entity-urn')?.split(':').pop() ||
                      card.getAttribute('data-job-id') ||
                      `linkedin-${Date.now()}-${index}`;

        // Title
        const titleEl = card.querySelector('.base-search-card__title, .job-search-card__title');
        const title = titleEl?.textContent?.trim() || '';

        // Company
        const companyEl = card.querySelector('.base-search-card__subtitle, .job-search-card__company-name');
        const company = companyEl?.textContent?.trim() || '';

        // Location
        const locationEl = card.querySelector('.job-search-card__location, .base-search-card__location');
        const location = locationEl?.textContent?.trim() || '';

        // URL
        const linkEl = card.querySelector('a[href*="/jobs/view/"]');
        const url = linkEl?.getAttribute('href') || '';
        const fullUrl = url.startsWith('http') ? url : `https://www.linkedin.com${url}`;

        // Posted date
        const dateEl = card.querySelector('time');
        const posted_date = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim();

        // Applicants count
        const applicantsEl = card.querySelector('.job-search-card__applicant-count');
        const applicantsText = applicantsEl?.textContent?.trim();
        const applicants = applicantsText ? parseInt(applicantsText.match(/\d+/)?.[0] || '0') : undefined;

        // Description (preview)
        const descEl = card.querySelector('.job-search-card__snippet');
        const description = descEl?.textContent?.trim() || '';

        if (title && company) {
          jobs.push({
            id: jobId,
            title,
            company,
            location,
            description,
            url: fullUrl,
            posted_date,
            applicants,
          });
        }
      } catch (err) {
        console.warn('Failed to parse job card:', err);
      }
    });

    return jobs;
  }

  /**
   * Human-like scrolling behavior
   */
  private async humanLikeScroll(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 150); // Slow, human-like scrolling
      });
    });
  }
}

// Export singleton instance
export const linkedinScraper = new LinkedInScraper();

// Export type for search options
export type LinkedInScrapeOptions = LinkedInSearchOptions;
