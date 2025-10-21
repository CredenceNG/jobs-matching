/**
 * ZipRecruiter Jobs Scraper
 *
 * MODERATE risk - reasonable scraping frequency
 * - Use for scheduled + JIT scraping
 * - 3 second delays between requests
 * - Up to 5 pages per search
 *
 * @risk MODERATE
 * @frequency Every 6 hours for scheduled
 */

import { BaseScraper, type ScraperConfig, type ScrapeResult } from './base-scraper';
import type { Page } from 'puppeteer-core';

export interface ZipRecruiterJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type?: string;
  salary?: string;
  description: string;
  url: string;
  posted_date?: string;
  easy_apply?: boolean;
}

export interface ZipRecruiterSearchOptions {
  keywords: string;
  location?: string;
  radius?: number; // miles
  jobType?: 'full-time' | 'part-time' | 'contract';
  remote?: boolean;
  maxPages?: number;
}

export class ZipRecruiterScraper extends BaseScraper<ZipRecruiterJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'ZipRecruiter',
      baseUrl: 'https://www.ziprecruiter.com',
      rateLimit: {
        requestsPerMinute: 20,
        delayBetweenRequests: 3000, // 3 seconds
      },
      retryOptions: {
        maxRetries: 3,
        retryDelay: 5000,
      },
    };
    super(config);
  }

  async scrape(query: string, options?: any): Promise<ScrapeResult<ZipRecruiterJob>> {
    const startTime = Date.now();
    console.log(`🔍 [ZipRecruiter] Starting scrape for "${options.keywords}"`);

    const maxPages = Math.min(options.maxPages || 5, 5);
    const jobs: ZipRecruiterJob[] = [];

    try {
      await this.withRetry(async () => {
        for (let page = 1; page <= maxPages; page++) {
          console.log(`📄 [ZipRecruiter] Scraping page ${page}/${maxPages}...`);

          const pageJobs = await this.scrapeSearchPage(options, page);
          jobs.push(...pageJobs);

          console.log(`✅ [ZipRecruiter] Found ${pageJobs.length} jobs on page ${page}`);

          if (page < maxPages && pageJobs.length > 0) {
            await this.delay(3000 + Math.random() * 2000); // 3-5 second delay
          }
        }
      }, `Search for "${query}"`);

      const duration = Date.now() - startTime;

      console.log(`📊 [ZipRecruiter] Scraping completed:`);
      console.log(`   Items: ${jobs.length}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

      return {
        success: true,
        data: jobs,
        itemsScraped: jobs.length,
        duration,
        source: 'ziprecruiter',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [ZipRecruiter] Scraping error:', error);

      return {
        success: false,
        data: jobs,
        error: error instanceof Error ? error.message : 'Unknown error',
        itemsScraped: jobs.length,
        duration,
        source: 'ziprecruiter',
      };
    }
  }

  private async scrapeSearchPage(
    options: ZipRecruiterSearchOptions,
    pageNumber: number
  ): Promise<ZipRecruiterJob[]> {
    const url = this.buildSearchUrl(options, pageNumber);
    console.log(`🌐 [ZipRecruiter] URL: ${url}`);

    const browser = await this.getBrowser();

    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());

      console.log(`📄 [ZipRecruiter] Loading search page...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      await this.delay(2000);

      console.log(`✅ [ZipRecruiter] Page loaded, extracting jobs...`);
      const jobs = await page.evaluate(this.extractJobsFromPage);

      await browser.close();

      return jobs;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private buildSearchUrl(options: ZipRecruiterSearchOptions, pageNumber: number): string {
    const params = new URLSearchParams();

    params.set('search', options.keywords);

    if (options.location) {
      params.set('location', options.location);
    }

    if (options.radius) {
      params.set('radius', options.radius.toString());
    }

    if (options.remote) {
      params.set('refine_by_location_type', 'remote');
    }

    if (pageNumber > 1) {
      params.set('page', pageNumber.toString());
    }

    return `${this.config.baseUrl}/jobs-search?${params.toString()}`;
  }

  private extractJobsFromPage(): ZipRecruiterJob[] {
    const jobs: ZipRecruiterJob[] = [];
    const jobCards = document.querySelectorAll('article.job-card, div.job_content, [data-job-id]');

    jobCards.forEach((card, index) => {
      try {
        const jobId = card.getAttribute('data-job-id') || `ziprecruiter-${Date.now()}-${index}`;

        const titleEl = card.querySelector('.job-title, h2 a, .job_link');
        const title = titleEl?.textContent?.trim() || '';

        const companyEl = card.querySelector('.job-company, .hiring_company_text, a.company_name');
        const company = companyEl?.textContent?.trim() || '';

        const locationEl = card.querySelector('.job-location, .location, .job_location');
        const location = locationEl?.textContent?.trim() || '';

        const salaryEl = card.querySelector('.job-salary, .compensation, .salary');
        const salary = salaryEl?.textContent?.trim();

        const linkEl = card.querySelector('a[href*="/jobs/"]');
        const url = linkEl?.getAttribute('href') || '';
        const fullUrl = url.startsWith('http') ? url : `https://www.ziprecruiter.com${url}`;

        const descEl = card.querySelector('.job-snippet, .job_desc, .job-description');
        const description = descEl?.textContent?.trim() || '';

        const dateEl = card.querySelector('.job-age, time, .posted-date');
        const posted_date = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim();

        const easyApplyEl = card.querySelector('[data-easy-apply="true"], .easy-apply-badge');
        const easy_apply = !!easyApplyEl;

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
            easy_apply,
          });
        }
      } catch (err) {
        console.warn('Failed to parse job card:', err);
      }
    });

    return jobs;
  }
}

export const ziprecruiterScraper = new ZipRecruiterScraper();
export type ZipRecruiterScrapeOptions = ZipRecruiterSearchOptions;
