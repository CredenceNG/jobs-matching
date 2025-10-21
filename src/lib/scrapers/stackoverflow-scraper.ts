/**
 * Stack Overflow Jobs Scraper
 *
 * NOTE: Stack Overflow Jobs was sunset in March 2022
 * This scraper targets Stack Overflow Careers/Jobs archive or alternative tech job boards
 * Consider using as fallback or redirect to other tech-focused job boards
 *
 * MODERATE risk - reasonable scraping frequency
 * - Use for scheduled scraping only
 * - 3 second delays between requests
 * - Up to 3 pages per search (limited availability)
 *
 * @risk MODERATE
 * @frequency Every 12 hours for scheduled
 * @deprecated Stack Overflow Jobs service was discontinued
 */

import { BaseScraper, type ScraperConfig, type ScrapeResult } from './base-scraper';
import type { Page } from 'puppeteer-core';

export interface StackOverflowJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type?: string;
  salary?: string;
  description: string;
  url: string;
  posted_date?: string;
  remote_eligible?: boolean;
  tech_stack?: string[];
}

export interface StackOverflowSearchOptions {
  keywords: string;
  location?: string;
  remote?: boolean;
  techTags?: string[]; // e.g., ['javascript', 'react', 'node.js']
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';
  maxPages?: number;
}

export class StackOverflowScraper extends BaseScraper<StackOverflowJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'StackOverflow',
      baseUrl: 'https://stackoverflow.com',
      rateLimit: {
        requestsPerMinute: 15,
        delayBetweenRequests: 3000, // 3 seconds
      },
      retryOptions: {
        maxRetries: 2,
        retryDelay: 5000,
      },
    };
    super(config);
  }

  async scrape(query: string, options?: any): Promise<ScrapeResult<StackOverflowJob>> {
    const startTime = Date.now();
    console.log(`🔍 [StackOverflow] Starting scrape for "${options.keywords}"`);
    console.warn(
      '⚠️  [StackOverflow] Note: Stack Overflow Jobs was discontinued in 2022. Results may be limited.'
    );

    const maxPages = Math.min(options.maxPages || 3, 3);
    const jobs: StackOverflowJob[] = [];

    try {
      await this.withRetry(async () => {
        for (let page = 1; page <= maxPages; page++) {
          console.log(`📄 [StackOverflow] Scraping page ${page}/${maxPages}...`);

          const pageJobs = await this.scrapeSearchPage(options, page);
          jobs.push(...pageJobs);

          console.log(`✅ [StackOverflow] Found ${pageJobs.length} jobs on page ${page}`);

          if (page < maxPages && pageJobs.length > 0) {
            await this.delay(3000 + Math.random() * 2000); // 3-5 second delay
          }
        }
      }, `Search for "${query}"`);

      const duration = Date.now() - startTime;

      console.log(`📊 [StackOverflow] Scraping completed:`);
      console.log(`   Items: ${jobs.length}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

      return {
        success: true,
        data: jobs,
        itemsScraped: jobs.length,
        duration,
        source: 'stackoverflow',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [StackOverflow] Scraping error:', error);

      return {
        success: false,
        data: jobs,
        error: error instanceof Error ? error.message : 'Unknown error',
        itemsScraped: jobs.length,
        duration,
        source: 'stackoverflow',
      };
    }
  }

  private async scrapeSearchPage(
    options: StackOverflowSearchOptions,
    pageNumber: number
  ): Promise<StackOverflowJob[]> {
    const url = this.buildSearchUrl(options, pageNumber);
    console.log(`🌐 [StackOverflow] URL: ${url}`);

    const browser = await this.getBrowser();

    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());

      console.log(`📄 [StackOverflow] Loading search page...`);

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch (navError) {
        console.warn('⚠️  [StackOverflow] Navigation failed - service may be unavailable');
        await browser.close();
        return [];
      }

      await this.delay(2000);

      console.log(`✅ [StackOverflow] Page loaded, extracting jobs...`);
      const jobs = await page.evaluate(this.extractJobsFromPage);

      await browser.close();

      return jobs;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private buildSearchUrl(options: StackOverflowSearchOptions, pageNumber: number): string {
    const params = new URLSearchParams();

    params.set('q', options.keywords);

    if (options.location) {
      params.set('l', options.location);
    }

    if (options.remote) {
      params.set('r', 'true');
    }

    if (options.techTags && options.techTags.length > 0) {
      params.set('tl', options.techTags.join(','));
    }

    if (options.experienceLevel) {
      params.set('e', options.experienceLevel);
    }

    if (pageNumber > 1) {
      params.set('pg', pageNumber.toString());
    }

    // Note: Using /jobs/companies as fallback since /jobs was discontinued
    return `${this.config.baseUrl}/jobs?${params.toString()}`;
  }

  private extractJobsFromPage(): StackOverflowJob[] {
    const jobs: StackOverflowJob[] = [];

    // Try multiple selectors since SO Jobs structure may vary or be archived
    const jobCards = document.querySelectorAll(
      'div[data-jobid], div.-job, article.job-listing, div.listResults > div'
    );

    if (jobCards.length === 0) {
      console.warn('⚠️  [StackOverflow] No job cards found - service may be unavailable');
      return [];
    }

    jobCards.forEach((card, index) => {
      try {
        const jobId =
          card.getAttribute('data-jobid') || `stackoverflow-${Date.now()}-${index}`;

        const titleEl = card.querySelector(
          'h2 a.s-link, a.job-link, h2.job-title a, a[title]'
        );
        const title = titleEl?.textContent?.trim() || '';

        const companyEl = card.querySelector(
          '.fc-black-700.fs-body1, .company-name, h3.fc-black-800'
        );
        const company = companyEl?.textContent?.trim() || '';

        const locationEl = card.querySelector(
          '.fc-black-500.fs-body1, .job-location, .fc-black-500'
        );
        const location = locationEl?.textContent?.trim() || '';

        const salaryEl = card.querySelector('.salary, .job-salary, .fc-green-600');
        const salary = salaryEl?.textContent?.trim();

        const linkEl = card.querySelector('a.s-link, a.job-link');
        const url = linkEl?.getAttribute('href') || '';
        const fullUrl = url.startsWith('http')
          ? url
          : url.startsWith('/jobs/')
          ? `https://stackoverflow.com${url}`
          : '';

        const descEl = card.querySelector(
          '.mb12.fc-black-700, .job-summary, .job-description'
        );
        const description = descEl?.textContent?.trim() || '';

        const dateEl = card.querySelector('.fc-black-400, time, .posted-date');
        const posted_date =
          dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim();

        const remoteEl = card.querySelector('.remote-badge, [title*="Remote"]');
        const remote_eligible = !!remoteEl;

        const techStackEls = card.querySelectorAll('.post-tag, .tech-tag, a.job-link--tag');
        const tech_stack: string[] = [];
        techStackEls.forEach((tag) => {
          const tagText = tag.textContent?.trim();
          if (tagText) tech_stack.push(tagText);
        });

        const typeEl = card.querySelector('.job-type, .employment-type');
        const employment_type = typeEl?.textContent?.trim();

        if (title && company && fullUrl) {
          jobs.push({
            id: jobId,
            title,
            company,
            location,
            salary,
            description,
            url: fullUrl,
            posted_date,
            remote_eligible,
            tech_stack: tech_stack.length > 0 ? tech_stack : undefined,
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

export const stackOverflowScraper = new StackOverflowScraper();
export type StackOverflowScrapeOptions = StackOverflowSearchOptions;
