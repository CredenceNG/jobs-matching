/**
 * RemoteOK Job Scraper
 *
 * Scrapes remote job listings from RemoteOK.com
 * RemoteOK specializes in remote work opportunities
 *
 * @description Direct web scraper for RemoteOK (bypasses API issues)
 * @cost Free (no API required)
 * @source https://remoteok.com
 */

import { Page } from 'puppeteer-core';
import {
  BaseScraper,
  ScraperConfig,
  ScrapeResult,
  generateJobId,
  parseRelativeDate,
} from './base-scraper';

// =============================================================================
// TYPES
// =============================================================================

export interface RemoteOKJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  posted_date: string;
  source: 'RemoteOK';
  tags?: string[];
  remote: boolean;
}

export interface RemoteOKSearchOptions {
  tags?: string[]; // e.g., ['dev', 'design', 'marketing']
  limit?: number;
}

// =============================================================================
// REMOTEOK SCRAPER CLASS
// =============================================================================

export class RemoteOKScraper extends BaseScraper<RemoteOKJob> {
  constructor() {
    const config: ScraperConfig = {
      name: 'RemoteOK',
      baseUrl: 'https://remoteok.com',
      requestDelayMs: 1500, // 1.5 second delay
      maxRetries: 3,
      timeout: 30000,
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
    options: RemoteOKSearchOptions = {}
  ): Promise<ScrapeResult<RemoteOKJob>> {
    const startTime = Date.now();

    try {
      console.log(`🔍 [RemoteOK] Starting scrape for "${query}"`);

      // RemoteOK has a simple structure - we'll scrape the main page
      // and filter by keywords
      const jobs = await this.withRetry(
        async () => await this.scrapeMainPage(query, options.limit || 20),
        'scrapeMainPage'
      );

      const duration = Date.now() - startTime;
      this.logStats(jobs.length, duration, query);

      return {
        success: true,
        data: jobs,
        itemsScraped: jobs.length,
        duration,
        source: 'RemoteOK',
      };
    } catch (error) {
      return this.handleError(error, 'scrape');
    }
  }

  /**
   * Scrape jobs from RemoteOK main page
   */
  private async scrapeMainPage(
    query: string,
    limit: number
  ): Promise<RemoteOKJob[]> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();
    const jobs: RemoteOKJob[] = [];

    try {
      console.log(`📄 [RemoteOK] Loading main page...`);

      // Navigate to RemoteOK
      await page.goto(this.config.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for job listings to load
      await page.waitForSelector('tr.job', { timeout: 10000 });

      console.log(`✅ [RemoteOK] Page loaded, extracting jobs...`);

      // Extract all jobs
      const allJobs = await page.evaluate(() => {
        const jobRows = document.querySelectorAll('tr.job');
        const results: any[] = [];

        jobRows.forEach((row) => {
          try {
            // Extract job ID
            const jobId = row.getAttribute('data-id') || '';

            // Extract title
            const titleElem = row.querySelector('h2');
            const title = titleElem?.textContent?.trim() || '';

            // Extract company
            const companyElem = row.querySelector('h3');
            const company = companyElem?.textContent?.trim() || '';

            // Extract location/tags
            const tagsElems = row.querySelectorAll('.tags .tag');
            const tags: string[] = [];
            tagsElems.forEach((tag) => {
              const tagText = tag.textContent?.trim();
              if (tagText) tags.push(tagText);
            });

            // Extract salary if available
            const salaryElem = row.querySelector('.salary');
            const salary = salaryElem?.textContent?.trim() || '';

            // Extract date
            const dateElem = row.querySelector('time');
            const dateText = dateElem?.getAttribute('datetime') ||
                            dateElem?.textContent?.trim() || '';

            // Extract URL
            const linkElem = row.querySelector('a[href*="/remote-jobs/"]');
            const url = linkElem?.getAttribute('href') || '';

            // Extract description from data attributes or visible text
            const descElem = row.querySelector('.description');
            const description = descElem?.textContent?.trim() ||
                              `${title} at ${company}`;

            results.push({
              jobId,
              title,
              company,
              tags,
              salary,
              dateText,
              url,
              description,
            });
          } catch (err) {
            console.warn('Error extracting job row:', err);
          }
        });

        return results;
      });

      console.log(`📋 [RemoteOK] Found ${allJobs.length} total jobs`);

      // Filter jobs by query
      const queryLower = query.toLowerCase();
      const keywords = queryLower.split(' ').filter(k => k.length > 2);

      for (const jobData of allJobs) {
        if (jobs.length >= limit) break;

        // Filter by keywords
        const searchText = `${jobData.title} ${jobData.company} ${jobData.description} ${jobData.tags.join(' ')}`.toLowerCase();

        const matches = keywords.some(keyword => searchText.includes(keyword));

        if (!matches && keywords.length > 0) {
          continue; // Skip jobs that don't match query
        }

        // Validate required fields
        if (!jobData.title || !jobData.company) {
          continue;
        }

        const job: RemoteOKJob = {
          id: jobData.jobId || generateJobId(jobData.title, jobData.company, 'Remote'),
          title: this.cleanText(jobData.title),
          company: this.cleanText(jobData.company),
          location: 'Remote',
          salary: jobData.salary ? this.cleanText(jobData.salary) : undefined,
          description: this.cleanText(jobData.description),
          url: jobData.url.startsWith('http')
            ? jobData.url
            : `${this.config.baseUrl}${jobData.url}`,
          posted_date: jobData.dateText
            ? new Date(jobData.dateText).toISOString()
            : parseRelativeDate(jobData.dateText),
          source: 'RemoteOK',
          tags: jobData.tags,
          remote: true,
        };

        jobs.push(job);
      }

      console.log(`✅ [RemoteOK] Filtered to ${jobs.length} matching jobs`);

      return jobs;
    } catch (error) {
      console.error(`❌ [RemoteOK] Error scraping main page:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape full job details from job detail page
   * (Optional - for getting complete descriptions)
   *
   * @param jobUrl Full URL to job posting
   * @returns Full job description and details
   */
  async scrapeJobDetails(jobUrl: string): Promise<{
    description: string;
    requirements?: string;
    benefits?: string;
  } | null> {
    await this.checkRateLimit();
    await this.randomDelay();

    const page = await this.createStealthPage();

    try {
      console.log(`📄 [RemoteOK] Loading job details: ${jobUrl}`);

      await page.goto(jobUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Extract full job details
      const details = await page.evaluate(() => {
        const descElem = document.querySelector('.description, .markdown');
        const description = descElem?.textContent?.trim() || '';

        // Try to find requirements section
        const requirementsElem = document.querySelector('[class*="requirement"]');
        const requirements = requirementsElem?.textContent?.trim();

        // Try to find benefits section
        const benefitsElem = document.querySelector('[class*="benefit"]');
        const benefits = benefitsElem?.textContent?.trim();

        return {
          description,
          requirements,
          benefits,
        };
      });

      return details;
    } catch (error) {
      console.warn(`⚠️  [RemoteOK] Failed to scrape job details:`, error);
      return null;
    } finally {
      await page.close();
    }
  }
}

// Export singleton instance
export const remoteOKScraper = new RemoteOKScraper();
