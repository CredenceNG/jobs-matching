/**
 * CareerBuilder Jobs Scraper
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

export interface CareerBuilderJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type?: string;
  salary?: string;
  description: string;
  url: string;
  posted_date?: string;
  apply_url?: string;
}

export interface CareerBuilderSearchOptions {
  keywords: string;
  location?: string;
  radius?: number; // miles
  jobType?: 'JTFT' | 'JTPT' | 'JTCT' | 'JTIN'; // Full-Time, Part-Time, Contract, Internship
  postedDate?: number; // days
  remote?: boolean;
  maxPages?: number;
}

export class CareerBuilderScraper extends BaseScraper<CareerBuilderJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'CareerBuilder',
      baseUrl: 'https://www.careerbuilder.com',
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

  async scrape(options: CareerBuilderSearchOptions): Promise<ScrapeResult<CareerBuilderJob>> {
    const startTime = Date.now();
    console.log(`🔍 [CareerBuilder] Starting scrape for "${options.keywords}"`);

    const maxPages = Math.min(options.maxPages || 5, 5);
    const jobs: CareerBuilderJob[] = [];

    try {
      await this.withRetry(async () => {
        for (let page = 1; page <= maxPages; page++) {
          console.log(`📄 [CareerBuilder] Scraping page ${page}/${maxPages}...`);

          const pageJobs = await this.scrapeSearchPage(options, page);
          jobs.push(...pageJobs);

          console.log(`✅ [CareerBuilder] Found ${pageJobs.length} jobs on page ${page}`);

          if (page < maxPages && pageJobs.length > 0) {
            await this.delay(2500 + Math.random() * 2000); // 2.5-4.5 second delay
          }
        }
      });

      const duration = Date.now() - startTime;

      console.log(`📊 [CareerBuilder] Scraping completed:`);
      console.log(`   Items: ${jobs.length}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

      return {
        success: true,
        data: jobs,
        itemsScraped: jobs.length,
        duration,
        source: 'careerbuilder',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [CareerBuilder] Scraping error:', error);

      return {
        success: false,
        data: jobs,
        error: error instanceof Error ? error.message : 'Unknown error',
        itemsScraped: jobs.length,
        duration,
        source: 'careerbuilder',
      };
    }
  }

  private async scrapeSearchPage(
    options: CareerBuilderSearchOptions,
    pageNumber: number
  ): Promise<CareerBuilderJob[]> {
    const url = this.buildSearchUrl(options, pageNumber);
    console.log(`🌐 [CareerBuilder] URL: ${url}`);

    const browser = await this.launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());

      console.log(`📄 [CareerBuilder] Loading search page...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      await this.delay(2000);

      console.log(`✅ [CareerBuilder] Page loaded, extracting jobs...`);
      const jobs = await page.evaluate(this.extractJobsFromPage);

      await browser.close();

      return jobs;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private buildSearchUrl(options: CareerBuilderSearchOptions, pageNumber: number): string {
    const params = new URLSearchParams();

    params.set('keywords', options.keywords);

    if (options.location) {
      params.set('location', options.location);
    }

    if (options.radius) {
      params.set('radius', options.radius.toString());
    }

    if (options.jobType) {
      params.set('emp', options.jobType);
    }

    if (options.postedDate) {
      params.set('posted', options.postedDate.toString());
    }

    if (options.remote) {
      params.set('location', 'Remote');
    }

    if (pageNumber > 1) {
      params.set('page_number', pageNumber.toString());
    }

    return `${this.config.baseUrl}/jobs?${params.toString()}`;
  }

  private extractJobsFromPage(): CareerBuilderJob[] {
    const jobs: CareerBuilderJob[] = [];
    const jobCards = document.querySelectorAll(
      'div[data-job-id], li.data-results-content, article.job-listing'
    );

    jobCards.forEach((card, index) => {
      try {
        const jobId =
          card.getAttribute('data-job-id') || `careerbuilder-${Date.now()}-${index}`;

        const titleEl = card.querySelector(
          'h2.job-title a, a.data-results-title, h4 a'
        );
        const title = titleEl?.textContent?.trim() || '';

        const companyEl = card.querySelector(
          '.data-details span[data-testid="company-name"], .company-name, h4.data-results-company'
        );
        const company = companyEl?.textContent?.trim() || '';

        const locationEl = card.querySelector(
          '.data-details span[data-testid="job-location"], .job-location, .data-results-location'
        );
        const location = locationEl?.textContent?.trim() || '';

        const salaryEl = card.querySelector(
          '.estimated-salary, .pay-range, [data-testid="salary"]'
        );
        const salary = salaryEl?.textContent?.trim();

        const linkEl = card.querySelector('a[href*="/job/"]');
        const url = linkEl?.getAttribute('href') || '';
        const fullUrl = url.startsWith('http')
          ? url
          : `https://www.careerbuilder.com${url}`;

        const descEl = card.querySelector(
          '.job-description, .data-snapshot, [data-testid="job-snippet"]'
        );
        const description = descEl?.textContent?.trim() || '';

        const dateEl = card.querySelector(
          '.job-age, time[data-testid="posted-date"], .posted-date'
        );
        const posted_date =
          dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim();

        const applyEl = card.querySelector('a[data-testid="apply-button"]');
        const apply_url = applyEl?.getAttribute('href') || '';

        const employmentEl = card.querySelector('.job-type, [data-testid="job-type"]');
        const employment_type = employmentEl?.textContent?.trim();

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
            apply_url: apply_url || fullUrl,
            employment_type,
          });
        }
      } catch (err) {
        console.warn('Failed to parse job card:', err);
      }
    });

    return jobs;
  }
}

export const careerBuilderScraper = new CareerBuilderScraper();
export type CareerBuilderScrapeOptions = CareerBuilderSearchOptions;
