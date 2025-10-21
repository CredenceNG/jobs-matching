/**
 * Dice Jobs Scraper
 *
 * Dice is a leading tech job board focusing on IT, engineering, and tech roles
 * MODERATE risk - reasonable scraping frequency
 * - Use for scheduled + JIT scraping
 * - 2-3 second delays between requests
 * - Up to 5 pages per search
 *
 * @risk MODERATE
 * @frequency Every 6 hours for scheduled
 */

import { BaseScraper, type ScraperConfig, type ScrapeResult } from './base-scraper';
import type { Page } from 'puppeteer-core';

export interface DiceJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type?: string;
  salary?: string;
  description: string;
  url: string;
  posted_date?: string;
  skills?: string[];
  remote?: boolean;
}

export interface DiceSearchOptions {
  keywords: string;
  location?: string;
  radius?: number; // miles
  remote?: boolean;
  employmentType?: 'FULLTIME' | 'CONTRACTS' | 'THIRD_PARTY';
  postedDate?: 1 | 3 | 7 | 30; // days
  maxPages?: number;
}

export class DiceScraper extends BaseScraper<DiceJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'Dice',
      baseUrl: 'https://www.dice.com',
      rateLimit: {
        requestsPerMinute: 20,
        delayBetweenRequests: 2500, // 2.5 seconds
      },
      retryOptions: {
        maxRetries: 3,
        retryDelay: 5000,
      },
    };
    super(config);
  }

  async scrape(query: string, options?: any): Promise<ScrapeResult<DiceJob>> {
    const startTime = Date.now();
    console.log(`🔍 [Dice] Starting scrape for "${options.keywords}"`);

    const maxPages = Math.min(options.maxPages || 5, 5);
    const jobs: DiceJob[] = [];

    try {
      await this.withRetry(async () => {
        for (let page = 1; page <= maxPages; page++) {
          console.log(`📄 [Dice] Scraping page ${page}/${maxPages}...`);

          const pageJobs = await this.scrapeSearchPage(options, page);
          jobs.push(...pageJobs);

          console.log(`✅ [Dice] Found ${pageJobs.length} jobs on page ${page}`);

          // Stop if we get no results (no more pages)
          if (pageJobs.length === 0) {
            console.log(`🛑 [Dice] No more results, stopping at page ${page}`);
            break;
          }

          if (page < maxPages && pageJobs.length > 0) {
            await this.delay(2500 + Math.random() * 2000); // 2.5-4.5 second delay
          }
        }
      });

      const duration = Date.now() - startTime;

      console.log(`📊 [Dice] Scraping completed:`);
      console.log(`   Items: ${jobs.length}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

      return {
        success: true,
        data: jobs,
        itemsScraped: jobs.length,
        duration,
        source: 'dice',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [Dice] Scraping error:', error);

      return {
        success: false,
        data: jobs,
        error: error instanceof Error ? error.message : 'Unknown error',
        itemsScraped: jobs.length,
        duration,
        source: 'dice',
      };
    }
  }

  private async scrapeSearchPage(
    options: DiceSearchOptions,
    pageNumber: number
  ): Promise<DiceJob[]> {
    const url = this.buildSearchUrl(options, pageNumber);
    console.log(`🌐 [Dice] URL: ${url}`);

    const browser = await this.launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());

      console.log(`📄 [Dice] Loading search page...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for job cards to load
      await this.delay(2000);

      console.log(`✅ [Dice] Page loaded, extracting jobs...`);
      const jobs = await page.evaluate(this.extractJobsFromPage);

      await browser.close();

      return jobs;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private buildSearchUrl(options: DiceSearchOptions, pageNumber: number): string {
    const params = new URLSearchParams();

    // Query parameter
    params.set('q', options.keywords);

    // Location
    if (options.location && !options.remote) {
      params.set('location', options.location);
    }

    // Radius
    if (options.radius) {
      params.set('radius', options.radius.toString());
    }

    // Remote filter
    if (options.remote) {
      params.set('filters.isRemote', 'true');
    }

    // Employment type
    if (options.employmentType) {
      params.set('filters.employmentType', options.employmentType);
    }

    // Posted date filter
    if (options.postedDate) {
      params.set('filters.postedDate', options.postedDate.toString());
    }

    // Pagination
    if (pageNumber > 1) {
      params.set('page', pageNumber.toString());
    }

    return `${this.config.baseUrl}/jobs?${params.toString()}`;
  }

  private extractJobsFromPage(): DiceJob[] {
    const jobs: DiceJob[] = [];

    // Dice uses various selectors, try multiple patterns
    const jobCards = document.querySelectorAll(
      'div[data-cy="card"], div.card, div.search-card, dhi-search-card, article.job-card'
    );

    if (jobCards.length === 0) {
      console.warn('⚠️  [Dice] No job cards found on page');
      return [];
    }

    jobCards.forEach((card, index) => {
      try {
        // Job ID
        const jobId =
          card.getAttribute('data-job-id') ||
          card.getAttribute('id') ||
          `dice-${Date.now()}-${index}`;

        // Title
        const titleEl = card.querySelector(
          'a[data-cy="card-title-link"], h5 a, a.card-title-link, h4 a, a[id*="title"]'
        );
        const title = titleEl?.textContent?.trim() || '';
        const url = titleEl?.getAttribute('href') || '';
        const fullUrl = url.startsWith('http')
          ? url
          : url.startsWith('/job/')
          ? `https://www.dice.com${url}`
          : `https://www.dice.com/jobs${url}`;

        // Company
        const companyEl = card.querySelector(
          'span[data-cy="search-result-company-name"], .card-company, a.employer, span.company-name'
        );
        const company = companyEl?.textContent?.trim() || '';

        // Location
        const locationEl = card.querySelector(
          'span[data-cy="search-result-location"], .location, span.job-location, div.search-card-location'
        );
        const location = locationEl?.textContent?.trim() || '';

        // Check if remote
        const remoteEl = card.querySelector(
          'span[data-cy="search-result-remote"], .remote-badge, span.remote'
        );
        const remote = !!remoteEl || location.toLowerCase().includes('remote');

        // Salary
        const salaryEl = card.querySelector(
          'span[data-cy="search-result-salary"], .salary, span.compensation, div.pay'
        );
        const salary = salaryEl?.textContent?.trim();

        // Description/Summary
        const descEl = card.querySelector(
          'div[data-cy="card-summary"], .card-description, .summary, p.description'
        );
        const description = descEl?.textContent?.trim() || '';

        // Posted date
        const dateEl = card.querySelector(
          'span[data-cy="posted-date"], time, .posted-date, span.date-posted'
        );
        const posted_date =
          dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim();

        // Skills/Tags
        const skillEls = card.querySelectorAll(
          'span.skill-tag, span.chip, a.skill-badge, span[data-cy="skill-tag"]'
        );
        const skills: string[] = [];
        skillEls.forEach((skill) => {
          const skillText = skill.textContent?.trim();
          if (skillText) skills.push(skillText);
        });

        // Employment type
        const typeEl = card.querySelector(
          'span[data-cy="employment-type"], .employment-type, span.job-type'
        );
        const employment_type = typeEl?.textContent?.trim();

        // Only add if we have minimum required fields
        if (title && company) {
          jobs.push({
            id: jobId,
            title,
            company,
            location,
            salary,
            description,
            url: fullUrl,
            posted_date,
            skills: skills.length > 0 ? skills : undefined,
            employment_type,
            remote,
          });
        }
      } catch (err) {
        console.warn('Failed to parse job card:', err);
      }
    });

    return jobs;
  }
}

export const diceScraper = new DiceScraper();
export type DiceScrapeOptions = DiceSearchOptions;
