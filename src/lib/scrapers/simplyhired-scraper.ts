/**
 * SimplyHired Jobs Scraper
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

export interface SimplyHiredJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type?: string;
  salary?: string;
  description: string;
  url: string;
  posted_date?: string;
  source?: string; // SimplyHired aggregates from multiple sources
}

export interface SimplyHiredSearchOptions {
  keywords: string;
  location?: string;
  radius?: number; // miles
  jobType?: 'fulltime' | 'parttime' | 'contract' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior';
  remote?: boolean;
  maxPages?: number;
}

export class SimplyHiredScraper extends BaseScraper<SimplyHiredJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'SimplyHired',
      baseUrl: 'https://www.simplyhired.com',
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

  async scrape(query: string, options?: any): Promise<ScrapeResult<SimplyHiredJob>> {
    const startTime = Date.now();
    console.log(`🔍 [SimplyHired] Starting scrape for "${options.keywords}"`);

    const maxPages = Math.min(options.maxPages || 5, 5);
    const jobs: SimplyHiredJob[] = [];

    try {
      await this.withRetry(async () => {
        for (let page = 1; page <= maxPages; page++) {
          console.log(`📄 [SimplyHired] Scraping page ${page}/${maxPages}...`);

          const pageJobs = await this.scrapeSearchPage(options, page);
          jobs.push(...pageJobs);

          console.log(`✅ [SimplyHired] Found ${pageJobs.length} jobs on page ${page}`);

          if (page < maxPages && pageJobs.length > 0) {
            await this.delay(2500 + Math.random() * 2000); // 2.5-4.5 second delay
          }
        }
      });

      const duration = Date.now() - startTime;

      console.log(`📊 [SimplyHired] Scraping completed:`);
      console.log(`   Items: ${jobs.length}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

      return {
        success: true,
        data: jobs,
        itemsScraped: jobs.length,
        duration,
        source: 'simplyhired',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [SimplyHired] Scraping error:', error);

      return {
        success: false,
        data: jobs,
        error: error instanceof Error ? error.message : 'Unknown error',
        itemsScraped: jobs.length,
        duration,
        source: 'simplyhired',
      };
    }
  }

  private async scrapeSearchPage(
    options: SimplyHiredSearchOptions,
    pageNumber: number
  ): Promise<SimplyHiredJob[]> {
    const url = this.buildSearchUrl(options, pageNumber);
    console.log(`🌐 [SimplyHired] URL: ${url}`);

    const browser = await this.getBrowser();

    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());

      console.log(`📄 [SimplyHired] Loading search page...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      await this.delay(2000);

      console.log(`✅ [SimplyHired] Page loaded, extracting jobs...`);
      const jobs = await page.evaluate(this.extractJobsFromPage);

      await browser.close();

      return jobs;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private buildSearchUrl(options: SimplyHiredSearchOptions, pageNumber: number): string {
    const params = new URLSearchParams();

    params.set('q', options.keywords);

    if (options.location) {
      params.set('l', options.location);
    }

    if (options.radius) {
      params.set('mi', options.radius.toString());
    }

    if (options.jobType) {
      params.set('jt', options.jobType);
    }

    if (options.experienceLevel) {
      params.set('exp', options.experienceLevel);
    }

    if (options.remote) {
      params.set('l', 'Remote');
    }

    if (pageNumber > 1) {
      params.set('pn', pageNumber.toString());
    }

    return `${this.config.baseUrl}/search?${params.toString()}`;
  }

  private extractJobsFromPage(): SimplyHiredJob[] {
    const jobs: SimplyHiredJob[] = [];
    const jobCards = document.querySelectorAll(
      'div[data-jobkey], li.SerpJob-listItem, article.jobposting'
    );

    jobCards.forEach((card, index) => {
      try {
        const jobId =
          card.getAttribute('data-jobkey') || `simplyhired-${Date.now()}-${index}`;

        const titleEl = card.querySelector(
          'h2 a.card-link, a.SerpJob-link, h3.jobposting-title a'
        );
        const title = titleEl?.textContent?.trim() || '';

        const companyEl = card.querySelector(
          'span.JobPosting-labelWithIcon.company, span.company-name, .jobposting-company'
        );
        const company = companyEl?.textContent?.trim() || '';

        const locationEl = card.querySelector(
          'span.JobPosting-labelWithIcon.location, span.job-location, .jobposting-location'
        );
        const location = locationEl?.textContent?.trim() || '';

        const salaryEl = card.querySelector(
          'p.SerpJob-metaInfo.SerpJob-salary, .salary-snippet, .jobposting-salary'
        );
        const salary = salaryEl?.textContent?.trim();

        const linkEl = card.querySelector('a.card-link, a.SerpJob-link');
        const url = linkEl?.getAttribute('href') || '';
        const fullUrl = url.startsWith('http')
          ? url
          : `https://www.simplyhired.com${url}`;

        const descEl = card.querySelector(
          'p.SerpJob-snippet, .jobposting-snippet, .job-description'
        );
        const description = descEl?.textContent?.trim() || '';

        const dateEl = card.querySelector(
          'time.SerpJob-postedDate, .posted-date, .jobposting-date'
        );
        const posted_date =
          dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim();

        const sourceEl = card.querySelector('.job-source, .listing-source');
        const source = sourceEl?.textContent?.trim();

        const typeEl = card.querySelector('.job-type, .employment-type');
        const employment_type = typeEl?.textContent?.trim();

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
            source,
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

export const simplyHiredScraper = new SimplyHiredScraper();
export type SimplyHiredScrapeOptions = SimplyHiredSearchOptions;
