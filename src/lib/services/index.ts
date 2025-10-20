/**
 * Services Index
 *
 * Central export point for all database and caching services
 */

export {
  JobStorageService,
  jobStorageService,
  type StoredJob,
  type JobSearchParams,
  type JobStorageStats,
} from './job-storage.service';

export {
  ScheduleService,
  scheduleService,
  type ScrapingSchedule,
  type ScheduleStats,
} from './schedule.service';

export {
  CacheService,
  cacheService,
  type SearchCacheEntry,
  type CacheStats,
} from './cache.service';

export {
  ScrapingLogService,
  scrapingLogService,
  type ScrapingLog,
  type ScrapingStats,
} from './scraping-log.service';
