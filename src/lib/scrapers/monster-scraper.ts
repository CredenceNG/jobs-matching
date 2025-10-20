/**
 * Monster Jobs Scraper
 *
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

export interface MonsterJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type?: string;
  salary?: string;
  description: string;
  url: string;
  posted_date?: string;
  job_type?: string;
}

export interface MonsterSearchOptions {
  keywords: string;
  location?: string;
  radius?: number; // miles
  jobType?: 'full-time' | 'part-time' | 'contract' | 'temporary';
  remote?: boolean;
  maxPages?: number;
}

export class MonsterScraper extends BaseScraper {
  constructor() {
    const config: ScraperConfig = {
      name: 'Monster',
      baseUrl: 'https://www.monster.com',
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

  async scrape(options: MonsterSearchOptions): Promise<ScrapeResult<MonsterJob>> {
    const startTime = Date.now();
    console.log(`🔍 [Monster] Starting scrape for "${options.keywords}"`);

    const maxPages = Math.min(options.maxPages || 5, 5);
    const jobs: MonsterJob[] = [];

    try {
      await this.withRetry(async () => {
        for (let page = 1; page <= maxPages; page++) {
          console.log(`📄 [Monster] Scraping page ${page}/${maxPages}...`);

          const pageJobs = await this.scrapeSearchPage(options, page);
          jobs.push(...pageJobs);

          console.log(`✅ [Monster] Found ${pageJobs.length} jobs on page ${page}`);

          if (page < maxPages && pageJobs.length > 0) {
            await this.delay(2500 + Math.random() * 2000); // 2.5-4.5 second delay
          }
        }
      });

      const duration = Date.now() - startTime;

      console.log(`📊 [Monster] Scraping completed:`);
      console.log(`   Items: ${jobs.length}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

      return {
        success: true,
        data: jobs,
        itemCount: jobs.length,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [Monster] Scraping error:', error);

      return {
        success: false,
        data: jobs,
        error: error instanceof Error ? error.message : 'Unknown error',
        itemCount: jobs.length,
        duration,
      };
    }
  }

  private async scrapeSearchPage(
    options: MonsterSearchOptions,
    pageNumber: number
  ): Promise<MonsterJob[]> {
    const url = this.buildSearchUrl(options, pageNumber);
    console.log(`🌐 [Monster] URL: ${url}`);

    const browser = await this.launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());

      console.log(`📄 [Monster] Loading search page...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      await this.delay(2000);

      console.log(`✅ [Monster] Page loaded, extracting jobs...`);
      const jobs = await page.evaluate(this.extractJobsFromPage);

      await browser.close();

      return jobs;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private buildSearchUrl(options: MonsterSearchOptions, pageNumber: number): string {
    const params = new URLSearchParams();

    params.set('q', options.keywords);

    if (options.location) {
      params.set('where', options.location);
    }

    if (options.radius) {
      params.set('rad', options.radius.toString());
    }

    if (options.jobType) {
      const typeMap = {
        'full-time': 'Full-Time',
        'part-time': 'Part-Time',
        'contract': 'Contract',
        'temporary': 'Temporary',
      };
      params.set('jobtype', typeMap[options.jobType]);
    }

    if (options.remote) {
      params.set('where', 'Remote');
    }

    if (pageNumber > 1) {
      params.set('page', pageNumber.toString());
    }

    return `${this.config.baseUrl}/jobs/search?${params.toString()}`;
  }

  private extractJobsFromPage(): MonsterJob[] {
    const jobs: MonsterJob[] = [];
    const jobCards = document.querySelectorAll(
      'section.card-content, div.job-cardstyle__JobCardComponent, article[data-job-id]'
    );

    jobCards.forEach((card, index) => {
      try {
        const jobId =
          card.getAttribute('data-job-id') || `monster-${Date.now()}-${index}`;

        const titleEl = card.querySelector(
          'h2.title a, a.job-title, h3 a[data-test-id="svx-job-title"]'
        );
        const title = titleEl?.textContent?.trim() || '';

        const companyEl = card.querySelector(
          '.company span, .company-name, [data-test-id="svx-job-company"]'
        );
        const company = companyEl?.textContent?.trim() || '';

        const locationEl = card.querySelector(
          '.location span, .job-location, [data-test-id="svx-job-location"]'
        );
        const location = locationEl?.textContent?.trim() || '';

        const salaryEl = card.querySelector(
          '.salary, .estimated-salary, [data-test-id="svx-job-salary"]'
        );
        const salary = salaryEl?.textContent?.trim();

        const linkEl = card.querySelector('a[href*="/job-opening/"]');
        const url = linkEl?.getAttribute('href') || '';
        const fullUrl = url.startsWith('http')
          ? url
          : `https://www.monster.com${url}`;

        const descEl = card.querySelector(
          '.job-description, .summary, [data-test-id="svx-job-description"]'
        );
        const description = descEl?.textContent?.trim() || '';

        const dateEl = card.querySelector(
          '.posted-date, time, [data-test-id="svx-job-date"]'
        );
        const posted_date =
          dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim();

        const typeEl = card.querySelector(
          '.job-type, .employment-type, [data-test-id="svx-job-type"]'
        );
        const job_type = typeEl?.textContent?.trim();

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
            job_type,
          });
        }
      } catch (err) {
        console.warn('Failed to parse job card:', err);
      }
    });

    return jobs;
  }
}

export const monsterScraper = new MonsterScraper();
export type MonsterScrapeOptions = MonsterSearchOptions;
