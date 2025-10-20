/**
 * Netlify Scheduled Function - Job Scraper
 *
 * Runs on a schedule (hourly) to scrape jobs from multiple sources
 * based on the scraping schedules in the database
 *
 * Flow:
 * 1. Get due schedules from database
 * 2. Run scrapers in parallel (max 3 concurrent)
 * 3. Store results in database
 * 4. Update schedule next_scrape_at
 * 5. Log results
 *
 * @schedule Runs every hour via Netlify cron
 * @concurrency Max 3 scrapers running simultaneously
 * @timeout 10 minutes
 */

import { Handler, schedule } from '@netlify/functions';
import { scheduleService, jobStorageService, scrapingLogService } from '../../src/lib/services';
import {
  linkedInScraper,
  ziprecruiterScraper,
  monsterScraper,
  careerBuilderScraper,
  simplyHiredScraper,
  stackOverflowScraper,
  indeedScraper,
  remoteOKScraper,
  glassdoorScraper,
  diceScraper,
} from '../../src/lib/scrapers';

interface ScraperMap {
  [key: string]: any;
}

// Map of source names to scraper instances
const scrapers: ScraperMap = {
  linkedin: linkedInScraper,
  ziprecruiter: ziprecruiterScraper,
  monster: monsterScraper,
  careerbuilder: careerBuilderScraper,
  simplyhired: simplyHiredScraper,
  stackoverflow: stackOverflowScraper,
  indeed: indeedScraper,
  remoteok: remoteOKScraper,
  glassdoor: glassdoorScraper,
  dice: diceScraper,
};

const MAX_CONCURRENT_SCRAPES = 3;
const SCRAPE_TIMEOUT_MS = 60000; // 1 minute per scrape

/**
 * Main scheduled handler
 */
const scheduledHandler: Handler = async (event, context) => {
  console.log('🕐 [Scheduled Scraper] Starting scheduled scraping run...');
  const startTime = Date.now();

  try {
    // Get schedules that are due for scraping
    const dueSchedules = await scheduleService.getDueSchedules(20);

    if (dueSchedules.length === 0) {
      console.log('✅ [Scheduled Scraper] No schedules due for scraping');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No schedules due',
          duration: Date.now() - startTime,
        }),
      };
    }

    console.log(`📋 [Scheduled Scraper] Found ${dueSchedules.length} due schedules`);

    // Run scrapers in batches to avoid overwhelming the system
    const results = await runScrapersInBatches(dueSchedules, MAX_CONCURRENT_SCRAPES);

    // Calculate summary statistics
    const totalJobs = results.reduce((sum, r) => sum + r.itemsStored, 0);
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    const duration = Date.now() - startTime;

    console.log('📊 [Scheduled Scraper] Scraping run complete:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📦 Total jobs stored: ${totalJobs}`);
    console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Scraping completed',
        success: successCount,
        errors: errorCount,
        totalJobs,
        duration,
        results: results.map((r) => ({
          source: r.source,
          query: r.query,
          success: r.success,
          itemsStored: r.itemsStored,
        })),
      }),
    };
  } catch (error) {
    console.error('❌ [Scheduled Scraper] Fatal error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Scheduled scraping failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Run scrapers in batches to control concurrency
 */
async function runScrapersInBatches(
  schedules: any[],
  batchSize: number
): Promise<ScrapingResult[]> {
  const results: ScrapingResult[] = [];

  for (let i = 0; i < schedules.length; i += batchSize) {
    const batch = schedules.slice(i, i + batchSize);
    console.log(`🔄 [Batch ${Math.floor(i / batchSize) + 1}] Processing ${batch.length} schedules...`);

    const batchPromises = batch.map((schedule) => runScraper(schedule));
    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`❌ [Batch] Schedule ${batch[idx].id} failed:`, result.reason);
        results.push({
          source: batch[idx].source,
          query: batch[idx].search_query,
          success: false,
          itemsFound: 0,
          itemsStored: 0,
          duration: 0,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        });
      }
    });

    // Small delay between batches
    if (i + batchSize < schedules.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}

interface ScrapingResult {
  source: string;
  query: string;
  success: boolean;
  itemsFound: number;
  itemsStored: number;
  duration: number;
  error?: string;
}

/**
 * Run a single scraper for a schedule
 */
async function runScraper(schedule: any): Promise<ScrapingResult> {
  const { id, source, search_query, location } = schedule;
  const startTime = Date.now();

  console.log(`🔍 [${source}] Starting scrape: "${search_query}" in ${location || 'Any'}`);

  try {
    const scraper = scrapers[source.toLowerCase()];

    if (!scraper) {
      throw new Error(`No scraper found for source: ${source}`);
    }

    // Build search options based on scraper type
    const searchOptions: any = {
      keywords: search_query,
      location: location,
      maxPages: 2, // Limit pages for scheduled scraping
    };

    // Run scraper with timeout
    const scrapePromise = scraper.scrape(searchOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Scrape timeout')), SCRAPE_TIMEOUT_MS)
    );

    const result = await Promise.race([scrapePromise, timeoutPromise]) as any;

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Scraping failed');
    }

    // Convert scraped jobs to StoredJob format
    const jobs = result.data.map((job: any) => ({
      external_id: job.id,
      source: source,
      title: job.title,
      company: job.company,
      location: job.location,
      employment_type: job.employment_type || job.job_type,
      description: job.description,
      url: job.url,
      posted_date: job.posted_date,
      raw_data: job,
    }));

    // Store jobs in database
    const storageResult = await jobStorageService.storeJobs(jobs);

    const duration = Date.now() - startTime;

    // Log scraping operation
    await scrapingLogService.log({
      source: source,
      search_query: search_query,
      location: location,
      status: 'success',
      items_found: result.itemCount || jobs.length,
      items_stored: storageResult.stored,
      duration_ms: duration,
      metadata: {
        schedule_id: id,
        duplicates: storageResult.duplicates,
        errors: storageResult.errors,
      },
    });

    // Update schedule
    await scheduleService.markScraped(id, true);

    console.log(
      `✅ [${source}] Complete: ${storageResult.stored}/${jobs.length} jobs stored in ${duration}ms`
    );

    return {
      source,
      query: search_query,
      success: true,
      itemsFound: jobs.length,
      itemsStored: storageResult.stored,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`❌ [${source}] Failed:`, errorMessage);

    // Log error
    await scrapingLogService.log({
      source: source,
      search_query: search_query,
      location: location,
      status: 'error',
      items_found: 0,
      items_stored: 0,
      duration_ms: duration,
      error_message: errorMessage,
      metadata: {
        schedule_id: id,
      },
    });

    // Still update schedule (with backoff logic would go here)
    await scheduleService.markScraped(id, false);

    return {
      source,
      query: search_query,
      success: false,
      itemsFound: 0,
      itemsStored: 0,
      duration,
      error: errorMessage,
    };
  }
}

// Schedule to run every hour
// Cron syntax: minute hour day month weekday
// "0 * * * *" = every hour at minute 0
export const handler = schedule('0 * * * *', scheduledHandler);
