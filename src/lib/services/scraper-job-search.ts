/**
 * Scraper-Based Job Search Service
 *
 * Uses direct web scraping to fetch jobs from multiple sources,
 * deduplicates them, and returns normalized results.
 *
 * @description Production job search using Puppeteer scrapers
 * @cost Free (no API costs, just compute)
 */

import {
  indeedScraper,
  remoteOKScraper,
  glassdoorScraper,
  linkedInScraper,
  ziprecruiterScraper,
  monsterScraper,
  careerBuilderScraper,
  simplyHiredScraper,
  stackOverflowScraper,
  diceScraper,
  reedScraper,
  seekScraper,
  jobBankScraper,
  weWorkRemotelyScraper,
  naukriScraper,
  jobDeduplicator,
  getScrapersForLocation,
  type NormalizedJob,
  type DeduplicationStats,
} from '../scrapers';
import type { Job, JobSearchFilters, JobSearchResponse } from './job-search';

// =============================================================================
// TYPES
// =============================================================================

export type JobBoardSource =
  | 'indeed'
  | 'remoteok'
  | 'glassdoor'
  | 'linkedin'
  | 'ziprecruiter'
  | 'monster'
  | 'careerbuilder'
  | 'simplyhired'
  | 'stackoverflow'
  | 'dice'
  | 'reed'
  | 'seek'
  | 'jobbank'
  | 'weworkremotely'
  | 'naukri';

export interface ScraperSearchOptions extends JobSearchFilters {
  sources?: JobBoardSource[];
  parallel?: boolean; // Run scrapers in parallel (faster but more resource-intensive)
  maxResultsPerSource?: number;
}

export interface ScraperSearchResult {
  jobs: Job[];
  total: number;
  page: number;
  hasMore: boolean;
  stats: DeduplicationStats;
  sourcesUsed: string[];
  scrapeDuration: number;
}

// =============================================================================
// SCRAPER JOB SEARCH SERVICE
// =============================================================================

export class ScraperJobSearchService {
  /**
   * Get default scrapers based on location
   * Uses database-driven dynamic location detection for optimal results
   *
   * @param location User's location (optional)
   * @returns Array of appropriate scraper sources
   */
  private async getDefaultSources(location?: string): Promise<JobBoardSource[]> {
    // Use dynamic location detection from database
    const { getScrapersForLocationDynamic } = await import('@/lib/scrapers/dynamic-location-mapper');
    const locationScrapers = await getScrapersForLocationDynamic(location);

    // Always include global scrapers for broader coverage
    const globalScrapers: JobBoardSource[] = ['remoteok', 'stackoverflow', 'weworkremotely'];

    // Combine and deduplicate
    const allScrapers = [...new Set([...locationScrapers, ...globalScrapers])];

    return allScrapers as JobBoardSource[];
  }

  /**
   * Search for jobs using web scrapers
   *
   * @param filters Search filters (keywords, location, etc.)
   * @param options Scraping options
   * @returns Job search results with deduplication
   */
  async searchJobs(
    filters: JobSearchFilters,
    options: ScraperSearchOptions = {}
  ): Promise<ScraperSearchResult> {
    const startTime = Date.now();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 SCRAPER JOB SEARCH`);
    console.log(`   Query: "${filters.keywords || 'all jobs'}"`);
    console.log(`   Location: ${filters.location || 'any'}`);
    console.log(`   Remote: ${filters.remote ? 'Yes' : 'No'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Use location-aware scraper selection if sources not explicitly provided
    const sources = options.sources || await this.getDefaultSources(filters.location);
    const maxPerSource = options.maxResultsPerSource || 20;
    const parallel = options.parallel !== false; // Default to parallel

    console.log(`📍 Using scrapers: ${sources.join(', ')}\n`);

    try {
      // Scrape jobs from all sources
      const allJobs = parallel
        ? await this.scrapeParallel(filters, sources, maxPerSource)
        : await this.scrapeSequential(filters, sources, maxPerSource);

      console.log(`\n📦 Total jobs scraped: ${allJobs.length}`);

      // Deduplicate jobs
      const { jobs: uniqueJobs, stats } = jobDeduplicator.deduplicateJobs(allJobs);

      // Convert to standard Job format
      const standardJobs = this.convertToStandardFormat(uniqueJobs);

      const duration = Date.now() - startTime;

      console.log(`\n✅ Search completed in ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Unique jobs: ${standardJobs.length}`);
      console.log(`   Duplicates removed: ${stats.duplicatesRemoved}`);
      console.log(`${'='.repeat(60)}\n`);

      return {
        jobs: standardJobs,
        total: standardJobs.length,
        page: 1,
        hasMore: false, // TODO: Implement pagination
        stats,
        sourcesUsed: sources,
        scrapeDuration: duration,
      };
    } catch (error) {
      console.error(`❌ Scraper search failed:`, error);
      throw new Error(`Job search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Scrape jobs from multiple sources in parallel (faster)
   */
  private async scrapeParallel(
    filters: JobSearchFilters,
    sources: string[],
    maxPerSource: number
  ): Promise<any[]> {
    console.log(`🚀 Running ${sources.length} scrapers in parallel...\n`);

    const promises = sources.map(source => this.scrapeSource(source, filters, maxPerSource));

    const results = await Promise.allSettled(promises);

    const allJobs: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allJobs.push(...result.value);
      } else {
        console.warn(`⚠️  ${sources[index]} scraper failed:`, result.reason);
      }
    });

    return allJobs;
  }

  /**
   * Scrape jobs from sources sequentially (more reliable, slower)
   */
  private async scrapeSequential(
    filters: JobSearchFilters,
    sources: string[],
    maxPerSource: number
  ): Promise<any[]> {
    console.log(`🔄 Running ${sources.length} scrapers sequentially...\n`);

    const allJobs: any[] = [];

    for (const source of sources) {
      try {
        const jobs = await this.scrapeSource(source, filters, maxPerSource);
        allJobs.push(...jobs);
      } catch (error) {
        console.warn(`⚠️  ${source} scraper failed:`, error);
        // Continue with other sources
      }
    }

    return allJobs;
  }

  /**
   * Scrape jobs from a specific source
   */
  private async scrapeSource(
    source: string,
    filters: JobSearchFilters,
    maxResults: number
  ): Promise<any[]> {
    const query = filters.keywords || 'jobs';

    const options = {
      location: filters.location,
      remote: filters.remote,
      limit: maxResults,
    };

    console.log(`[DEBUG scrapeSource] source=${source}, query="${query}", filters.keywords="${filters.keywords}"`);

    switch (source) {
      case 'indeed':
        const indeedResult = await indeedScraper.scrape(query, options);
        return indeedResult.success ? (indeedResult.data || []) : [];

      case 'remoteok':
        const remoteOKResult = await remoteOKScraper.scrape(query, options);
        return remoteOKResult.success ? (remoteOKResult.data || []) : [];

      case 'glassdoor':
        const glassdoorResult = await glassdoorScraper.scrape(query, options);
        return glassdoorResult.success ? (glassdoorResult.data || []) : [];

      case 'linkedin':
        const linkedInResult = await linkedInScraper.scrape(query, {
          location: options.location,
          remote: options.remote,
          maxPages: 5
        });
        return linkedInResult.success ? (linkedInResult.data || []) : [];

      case 'ziprecruiter':
        const ziprecruiterResult = await ziprecruiterScraper.scrape(query, {
          location: options.location,
          remote: options.remote,
          maxPages: 5
        });
        return ziprecruiterResult.success ? (ziprecruiterResult.data || []) : [];

      case 'monster':
        const monsterResult = await monsterScraper.scrape(query, {
          location: options.location,
          remote: options.remote,
          maxPages: 5
        });
        return monsterResult.success ? (monsterResult.data || []) : [];

      case 'careerbuilder':
        const careerBuilderResult = await careerBuilderScraper.scrape(query, {
          location: options.location,
          remote: options.remote,
          maxPages: 5
        });
        return careerBuilderResult.success ? (careerBuilderResult.data || []) : [];

      case 'simplyhired':
        const simplyHiredResult = await simplyHiredScraper.scrape(query, {
          location: options.location,
          remote: options.remote,
          maxPages: 5
        });
        return simplyHiredResult.success ? (simplyHiredResult.data || []) : [];

      case 'stackoverflow':
        const stackOverflowResult = await stackOverflowScraper.scrape(query, {
          location: options.location,
          remote: options.remote,
          maxPages: 3
        });
        return stackOverflowResult.success ? (stackOverflowResult.data || []) : [];

      case 'dice':
        const diceResult = await diceScraper.scrape(query, {
          location: options.location,
          remote: options.remote,
          maxPages: 5
        });
        return diceResult.success ? (diceResult.data || []) : [];

      case 'reed':
        const reedResult = await reedScraper.scrape(query, options);
        return reedResult.success ? (reedResult.data || []) : [];

      case 'seek':
        const seekResult = await seekScraper.scrape(query, options);
        return seekResult.success ? (seekResult.data || []) : [];

      case 'jobbank':
        const jobBankResult = await jobBankScraper.scrape(query, options);
        return jobBankResult.success ? (jobBankResult.data || []) : [];

      case 'weworkremotely':
        const weWorkRemotelyResult = await weWorkRemotelyScraper.scrape(query, options);
        return weWorkRemotelyResult.success ? (weWorkRemotelyResult.data || []) : [];

      case 'naukri':
        const naukriResult = await naukriScraper.scrape(query, options);
        return naukriResult.success ? (naukriResult.data || []) : [];

      default:
        console.warn(`⚠️  Unknown source: ${source}`);
        return [];
    }
  }

  /**
   * Convert normalized jobs to standard Job format
   */
  private convertToStandardFormat(normalizedJobs: NormalizedJob[]): Job[] {
    return normalizedJobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      salary: job.salary,
      description: job.description,
      url: job.url,
      posted_date: job.posted_date,
      source: job.source,
    }));
  }

  /**
   * Cleanup method - close all browser instances
   * Call this when shutting down the application
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up scraper resources...');

    await Promise.all([
      indeedScraper.closeBrowser(),
      remoteOKScraper.closeBrowser(),
      glassdoorScraper.closeBrowser(),
      linkedInScraper.closeBrowser(),
      ziprecruiterScraper.closeBrowser(),
      monsterScraper.closeBrowser(),
      careerBuilderScraper.closeBrowser(),
      simplyHiredScraper.closeBrowser(),
      stackOverflowScraper.closeBrowser(),
      diceScraper.closeBrowser(),
      reedScraper.closeBrowser(),
      seekScraper.closeBrowser(),
      jobBankScraper.closeBrowser(),
      weWorkRemotelyScraper.closeBrowser(),
      naukriScraper.closeBrowser(),
    ]);

    console.log('✅ Cleanup complete');
  }
}

// Export singleton instance
export const scraperJobSearchService = new ScraperJobSearchService();
