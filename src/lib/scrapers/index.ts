/**
 * Scrapers Index
 *
 * Central export point for all job scrapers
 */

export { BaseScraper, type ScraperConfig, type ScrapeResult } from './base-scraper';
export { IndeedScraper, indeedScraper, type IndeedJob, type IndeedSearchOptions } from './indeed-scraper';
export { RemoteOKScraper, remoteOKScraper, type RemoteOKJob, type RemoteOKSearchOptions } from './remoteok-scraper';
export { GlassdoorScraper, glassdoorScraper, type GlassdoorJob, type GlassdoorSearchOptions } from './glassdoor-scraper';
export { LinkedInScraper, linkedinScraper as linkedInScraper, type LinkedInJob, type LinkedInSearchOptions } from './linkedin-scraper';
export { ZipRecruiterScraper, ziprecruiterScraper, type ZipRecruiterJob, type ZipRecruiterScrapeOptions } from './ziprecruiter-scraper';
export { MonsterScraper, monsterScraper, type MonsterJob, type MonsterScrapeOptions } from './monster-scraper';
export { CareerBuilderScraper, careerBuilderScraper, type CareerBuilderJob, type CareerBuilderScrapeOptions } from './careerbuilder-scraper';
export { SimplyHiredScraper, simplyHiredScraper, type SimplyHiredJob, type SimplyHiredScrapeOptions } from './simplyhired-scraper';
export { StackOverflowScraper, stackOverflowScraper, type StackOverflowJob, type StackOverflowScrapeOptions } from './stackoverflow-scraper';
export { DiceScraper, diceScraper, type DiceJob, type DiceScrapeOptions } from './dice-scraper';

// International Job Boards
export { ReedScraper, reedScraper, type ReedJob, type ReedSearchOptions } from './reed-scraper';
export { SeekScraper, seekScraper, type SeekJob, type SeekSearchOptions } from './seek-scraper';
export { JobBankScraper, jobBankScraper, type JobBankJob, type JobBankSearchOptions } from './jobbank-scraper';
export { WeWorkRemotelyScraper, weWorkRemotelyScraper, type WeWorkRemotelyJob, type WeWorkRemotelySearchOptions } from './weworkremotely-scraper';
export { NaukriScraper, naukriScraper, type NaukriJob, type NaukriSearchOptions } from './naukri-scraper';

export { JobDeduplicator, jobDeduplicator, type NormalizedJob, type DeduplicationStats } from './job-deduplicator';
export { detectLocationConfig, getScrapersForLocation, getIndeedDomain, type JobBoardRegion, type LocationConfig } from './location-mapper';
