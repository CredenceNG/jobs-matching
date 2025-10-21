/**
 * Job Storage Service
 *
 * Handles all database operations for storing and retrieving scraped jobs
 * from PostgreSQL database using Prisma ORM
 *
 * Features:
 * - Store scraped jobs with deduplication (content_hash)
 * - Full-text search using PostgreSQL tsvector
 * - Filter by source, location, date range, keywords
 * - Automatic expiry handling (30 days)
 * - Batch insert for performance
 *
 * @cache Jobs are stored with isActive flag and auto-expire after 30 days
 * @deduplication Uses MD5 hash of title+company+description to prevent duplicates
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface StoredJob {
  id?: string;
  externalId: string;
  source: string;
  title: string;
  company: string;
  location?: string;
  location_type?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  url?: string;
  posted_date?: string;
  scrapedAt?: string;
  expiresAt?: string;
  keywords?: string[];
  content_hash?: string;
  isActive?: boolean;
  raw_data?: Record<string, any>;
}

export interface JobSearchParams {
  query?: string;
  location?: string;
  source?: string;
  employment_type?: string;
  min_salary?: number;
  max_age_hours?: number;
  limit?: number;
  offset?: number;
}

export interface JobStorageStats {
  total_jobs: number;
  active_jobs: number;
  jobs_by_source: Record<string, number>;
  oldest_job_date: string | null;
  newest_job_date: string | null;
}

export class JobStorageService {
  /**
   * Store a single job in the database
   *
   * @description Inserts job with automatic deduplication using content_hash
   * @param {StoredJob} job - Job data to store
   * @returns {Promise<string | null>} Job ID if successful, null if duplicate or error
   * @throws {Error} If database operation fails
   */
  async storeJob(job: StoredJob): Promise<string | null> {
    try {
      const contentHash = this.generateContentHash(job);
      const keywords = this.extractKeywords(job);

      const jobData = {
        externalId: job.externalId,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        location_type: job.location_type,
        employment_type: job.employment_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        description: job.description,
        url: job.url,
        posted_date: job.posted_date,
        content_hash: contentHash,
        keywords,
        raw_data: job.raw_data,
        isActive: true,
        expiresAt: this.calculateExpiryDate(job.posted_date),
      };

      // Use Prisma upsert with unique constraint on (externalId, source)
      const result = await prisma.job.upsert({
        where: {
          externalId_source: {
            externalId: job.externalId,
            source: job.source,
          },
        },
        update: jobData,
        create: jobData,
      });

      console.log(`[JobStorage] ✅ Stored job: ${job.title} at ${job.company}`);
      return result.id;
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Prisma unique constraint violation - job already exists
        console.log(`[JobStorage] Duplicate job: ${job.title} at ${job.company}`);
        return null;
      }
      console.error('[JobStorage] Error storing job:', error);
      throw error;
    }
  }

  /**
   * Store multiple jobs in batch
   *
   * @description Efficiently inserts multiple jobs with deduplication
   * @param {StoredJob[]} jobs - Array of jobs to store
   * @returns {Promise<{stored: number, duplicates: number, errors: number}>} Storage statistics
   */
  async storeJobs(jobs: StoredJob[]): Promise<{
    stored: number;
    duplicates: number;
    errors: number;
  }> {
    let stored = 0;
    let duplicates = 0;
    let errors = 0;

    console.log(`[JobStorage] Storing ${jobs.length} jobs in batch...`);

    const jobsData = jobs.map((job) => ({
      externalId: job.externalId,
      source: job.source,
      title: job.title,
      company: job.company,
      location: job.location,
      location_type: job.location_type,
      employment_type: job.employment_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      description: job.description,
      url: job.url,
      posted_date: job.posted_date,
      content_hash: this.generateContentHash(job),
      keywords: this.extractKeywords(job),
      raw_data: job.raw_data,
      isActive: true,
      expiresAt: this.calculateExpiryDate(job.posted_date),
    }));

    try {
      // Process jobs individually since Prisma doesn't support batch upsert with compound unique constraints
      // This ensures proper duplicate handling
      for (const jobData of jobsData) {
        try {
          await prisma.job.upsert({
            where: {
              externalId_source: {
                externalId: jobData.externalId,
                source: jobData.source,
              },
            },
            update: jobData,
            create: jobData,
          });
          stored++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            duplicates++;
          } else {
            errors++;
            console.error('[JobStorage] Individual job error:', error);
          }
        }
      }
    } catch (error) {
      console.error('[JobStorage] Batch insert failed:', error);
      errors = jobs.length;
    }

    console.log(
      `[JobStorage] ✅ Batch complete: ${stored} stored, ${duplicates} duplicates, ${errors} errors`
    );

    return { stored, duplicates, errors };
  }

  /**
   * Search jobs using full-text search
   *
   * @description Uses PostgreSQL full-text search with ranking
   * @param {JobSearchParams} params - Search parameters
   * @returns {Promise<StoredJob[]>} Matching jobs sorted by relevance
   */
  async searchJobs(params: JobSearchParams): Promise<StoredJob[]> {
    try {
      // Filter by max age (default 24 hours)
      const maxAgeHours = params.max_age_hours || 24;
      const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

      // Build the where clause
      const whereClause: any = {
        isActive: true,
        scrapedAt: {
          gte: cutoffDate,
        },
      };

      // Filter by source
      if (params.source) {
        whereClause.source = params.source;
      }

      // Filter by employment type
      if (params.employment_type) {
        whereClause.employment_type = params.employment_type;
      }

      // Filter by minimum salary
      if (params.min_salary) {
        whereClause.salary_min = {
          gte: params.min_salary,
        };
      }

      // Filter by location (case-insensitive contains)
      if (params.location) {
        whereClause.location = {
          contains: params.location,
          mode: 'insensitive',
        };
      }

      // Full-text search on query
      if (params.query) {
        // Use Prisma raw SQL for full-text search with PostgreSQL
        // This replaces the search_jobs RPC function
        const searchTerms = params.query.replace(/\s+/g, ' & ');
        const limit = params.limit || 20;

        // Build location filter conditionally
        let data: StoredJob[];
        if (params.location) {
          const locationPattern = `%${params.location}%`;
          data = await prisma.$queryRaw<StoredJob[]>`
            SELECT
              id, externalId, source, title, company, location, location_type,
              employment_type, salary_min, salary_max, description, url,
              posted_date, scrapedAt, expiresAt, keywords, content_hash,
              isActive, raw_data,
              ts_rank(search_vector, plainto_tsquery('english', ${params.query})) as rank
            FROM jobs
            WHERE
              isActive = true
              AND search_vector @@ plainto_tsquery('english', ${params.query})
              AND scrapedAt >= ${cutoffDate}
              AND location ILIKE ${locationPattern}
            ORDER BY rank DESC, scrapedAt DESC
            LIMIT ${limit}
          `;
        } else {
          data = await prisma.$queryRaw<StoredJob[]>`
            SELECT
              id, externalId, source, title, company, location, location_type,
              employment_type, salary_min, salary_max, description, url,
              posted_date, scrapedAt, expiresAt, keywords, content_hash,
              isActive, raw_data,
              ts_rank(search_vector, plainto_tsquery('english', ${params.query})) as rank
            FROM jobs
            WHERE
              isActive = true
              AND search_vector @@ plainto_tsquery('english', ${params.query})
              AND scrapedAt >= ${cutoffDate}
            ORDER BY rank DESC, scrapedAt DESC
            LIMIT ${limit}
          `;
        }

        console.log(`[JobStorage] Found ${data?.length || 0} jobs for query`);
        return data || [];
      }

      // Apply pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;

      // Execute query without full-text search
      const data = await prisma.job.findMany({
        where: whereClause,
        orderBy: {
          scrapedAt: 'desc',
        },
        skip: offset,
        take: limit,
      });

      console.log(`[JobStorage] Found ${data?.length || 0} jobs for query`);
      return data || [];
    } catch (error) {
      console.error('[JobStorage] Search error:', error);
      throw error;
    }
  }

  /**
   * Get jobs by source and date range
   *
   * @param {string} source - Job source (e.g., 'linkedin', 'indeed')
   * @param {Date} startDate - Start date for filtering
   * @param {Date} endDate - End date for filtering
   * @returns {Promise<StoredJob[]>} Jobs from source in date range
   */
  async getJobsBySource(
    source: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<StoredJob[]> {
    try {
      // Build the where clause
      const whereClause: any = {
        source,
        isActive: true,
      };

      // Add date range filters
      if (startDate || endDate) {
        whereClause.scrapedAt = {};
        if (startDate) {
          whereClause.scrapedAt.gte = startDate;
        }
        if (endDate) {
          whereClause.scrapedAt.lte = endDate;
        }
      }

      const data = await prisma.job.findMany({
        where: whereClause,
        orderBy: {
          scrapedAt: 'desc',
        },
      });

      return data || [];
    } catch (error) {
      console.error('[JobStorage] Error fetching jobs by source:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   *
   * @returns {Promise<JobStorageStats>} Database statistics
   */
  async getStats(): Promise<JobStorageStats> {
    try {
      // Get total count of all jobs
      const total_jobs = await prisma.job.count();

      // Get count of active jobs
      const active_jobs = await prisma.job.count({
        where: { isActive: true },
      });

      // Get all active jobs' sources for aggregation
      const bySourceData = await prisma.job.findMany({
        where: { isActive: true },
        select: { source: true },
      });

      // Get oldest job date
      const oldestJob = await prisma.job.findFirst({
        where: { isActive: true },
        orderBy: { scrapedAt: 'asc' },
        select: { scrapedAt: true },
      });

      // Get newest job date
      const newestJob = await prisma.job.findFirst({
        where: { isActive: true },
        orderBy: { scrapedAt: 'desc' },
        select: { scrapedAt: true },
      });

      // Aggregate jobs by source
      const jobs_by_source: Record<string, number> = {};
      bySourceData?.forEach((job) => {
        jobs_by_source[job.source] = (jobs_by_source[job.source] || 0) + 1;
      });

      return {
        total_jobs,
        active_jobs,
        jobs_by_source,
        oldest_job_date: oldestJob?.scrapedAt || null,
        newest_job_date: newestJob?.scrapedAt || null,
      };
    } catch (error) {
      console.error('[JobStorage] Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Delete expired jobs
   *
   * @returns {Promise<number>} Number of jobs deleted
   */
  async cleanupExpiredJobs(): Promise<number> {
    try {
      const result = await prisma.job.updateMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      const count = result.count;
      console.log(`[JobStorage] ✅ Cleaned up ${count} expired jobs`);
      return count;
    } catch (error) {
      console.error('[JobStorage] Cleanup error:', error);
      throw error;
    }
  }

  /**
   * Generate content hash for deduplication
   *
   * @private
   * @param {StoredJob} job - Job to hash
   * @returns {string} MD5 hash of job content
   */
  private generateContentHash(job: StoredJob): string {
    const content = `${job.title}|${job.company}|${job.description || ''}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Extract keywords from job for search optimization
   *
   * @private
   * @param {StoredJob} job - Job to extract keywords from
   * @returns {string[]} Array of keywords
   */
  private extractKeywords(job: StoredJob): string[] {
    const keywords = new Set<string>();

    // Add title words
    job.title?.split(/\s+/).forEach((word) => {
      if (word.length > 2) keywords.add(word.toLowerCase());
    });

    // Add company name
    if (job.company) {
      keywords.add(job.company.toLowerCase());
    }

    // Add location
    if (job.location) {
      keywords.add(job.location.toLowerCase());
    }

    // Add employment type
    if (job.employment_type) {
      keywords.add(job.employment_type.toLowerCase());
    }

    return Array.from(keywords);
  }

  /**
   * Calculate expiry date (30 days from posted date or now)
   *
   * @private
   * @param {string} postedDate - Job posting date
   * @returns {string} ISO date string for expiry
   */
  private calculateExpiryDate(postedDate?: string): string {
    const baseDate = postedDate ? new Date(postedDate) : new Date();
    const expiryDate = new Date(baseDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate.toISOString();
  }
}

export const jobStorageService = new JobStorageService();
