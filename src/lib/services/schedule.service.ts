/**
 * Schedule Service
 *
 * Manages scraping schedules for popular job searches
 * Determines which searches should be scraped and when
 *
 * Features:
 * - Priority-based scheduling (1-10 scale)
 * - Frequency control (hours between scrapes)
 * - Track last scrape time and next scheduled time
 * - Activate/deactivate schedules
 * - Get due schedules for cron job
 *
 * @usage Used by Netlify scheduled function to determine what to scrape
 */

import { prisma } from '@/lib/prisma';

export interface ScrapingSchedule {
  id?: string;
  source: string;
  search_query: string;
  location?: string;
  frequency_hours: number;
  last_scraped_at?: string;
  next_scrape_at?: string;
  priority: number; // 1-10, higher = more important
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleStats {
  total_schedules: number;
  active_schedules: number;
  schedules_by_source: Record<string, number>;
  due_now: number;
  upcoming_1h: number;
  upcoming_24h: number;
}

export class ScheduleService {
  /**
   * Create a new scraping schedule
   *
   * @description Adds a new search to the scheduled scraping rotation
   * @param {ScrapingSchedule} schedule - Schedule configuration
   * @returns {Promise<string>} Schedule ID
   * @throws {Error} If database operation fails
   */
  async createSchedule(schedule: ScrapingSchedule): Promise<string> {
    try {
      const nextScrapeAt = new Date();
      nextScrapeAt.setMinutes(nextScrapeAt.getMinutes() + 5); // Start in 5 minutes

      const scheduleData = {
        source: schedule.source,
        searchQuery: schedule.search_query,
        location: schedule.location,
        frequencyHours: schedule.frequency_hours,
        priority: schedule.priority,
        isActive: schedule.is_active !== false,
        nextScrapeAt: nextScrapeAt,
        metadata: schedule.metadata || {},
      };

      const result = await prisma.scrapingSchedule.create({
        data: scheduleData,
      });

      console.log(
        `[Schedule] ✅ Created schedule: ${schedule.search_query} in ${schedule.location} from ${schedule.source}`
      );

      return result.id;
    } catch (error) {
      console.error('[Schedule] Error creating schedule:', error);
      throw error;
    }
  }

  /**
   * Get schedules that are due for scraping
   *
   * @description Returns active schedules where next_scrape_at <= now
   * @param {number} limit - Maximum number of schedules to return
   * @returns {Promise<ScrapingSchedule[]>} Due schedules sorted by priority
   */
  async getDueSchedules(limit: number = 10): Promise<ScrapingSchedule[]> {
    try {
      const schedules = await prisma.scrapingSchedule.findMany({
        where: {
          isActive: true,
          nextScrapeAt: {
            lte: new Date(),
          },
        },
        orderBy: [
          { priority: 'desc' },
          { nextScrapeAt: 'asc' },
        ],
        take: limit,
      });

      console.log(`[Schedule] Found ${schedules.length} due schedules`);

      return schedules.map(s => ({
        id: s.id,
        source: s.source,
        search_query: s.searchQuery,
        location: s.location || undefined,
        frequency_hours: s.frequencyHours,
        last_scraped_at: s.lastScrapedAt?.toISOString(),
        next_scrape_at: s.nextScrapeAt?.toISOString(),
        priority: s.priority,
        is_active: s.isActive,
        metadata: s.metadata as Record<string, any> || undefined,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('[Schedule] Error fetching due schedules:', error);
      throw error;
    }
  }

  /**
   * Get all active schedules
   *
   * @returns {Promise<ScrapingSchedule[]>} All active schedules
   */
  async getActiveSchedules(): Promise<ScrapingSchedule[]> {
    try {
      const schedules = await prisma.scrapingSchedule.findMany({
        where: {
          isActive: true,
        },
        orderBy: { priority: 'desc' },
      });

      return schedules.map(s => ({
        id: s.id,
        source: s.source,
        search_query: s.searchQuery,
        location: s.location || undefined,
        frequency_hours: s.frequencyHours,
        last_scraped_at: s.lastScrapedAt?.toISOString(),
        next_scrape_at: s.nextScrapeAt?.toISOString(),
        priority: s.priority,
        is_active: s.isActive,
        metadata: s.metadata as Record<string, any> || undefined,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('[Schedule] Error fetching active schedules:', error);
      throw error;
    }
  }

  /**
   * Get schedules by source
   *
   * @param {string} source - Job source (e.g., 'linkedin', 'indeed')
   * @returns {Promise<ScrapingSchedule[]>} Schedules for source
   */
  async getSchedulesBySource(source: string): Promise<ScrapingSchedule[]> {
    try {
      const schedules = await prisma.scrapingSchedule.findMany({
        where: {
          source,
          isActive: true,
        },
        orderBy: { priority: 'desc' },
      });

      return schedules.map(s => ({
        id: s.id,
        source: s.source,
        search_query: s.searchQuery,
        location: s.location || undefined,
        frequency_hours: s.frequencyHours,
        last_scraped_at: s.lastScrapedAt?.toISOString(),
        next_scrape_at: s.nextScrapeAt?.toISOString(),
        priority: s.priority,
        is_active: s.isActive,
        metadata: s.metadata as Record<string, any> || undefined,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('[Schedule] Error fetching schedules by source:', error);
      throw error;
    }
  }

  /**
   * Update schedule after successful scrape
   *
   * @description Updates last_scraped_at and calculates next_scrape_at
   * @param {string} scheduleId - Schedule ID
   * @param {boolean} success - Whether scrape was successful
   * @returns {Promise<void>}
   */
  async markScraped(scheduleId: string, success: boolean = true): Promise<void> {
    try {
      // Get current schedule to calculate next scrape time
      const schedule = await prisma.scrapingSchedule.findUnique({
        where: { id: scheduleId },
        select: { frequencyHours: true },
      });

      if (!schedule) {
        throw new Error(`Schedule ${scheduleId} not found`);
      }

      const now = new Date();
      const nextScrapeAt = new Date(now);
      nextScrapeAt.setHours(nextScrapeAt.getHours() + schedule.frequencyHours);

      await prisma.scrapingSchedule.update({
        where: { id: scheduleId },
        data: {
          lastScrapedAt: now,
          nextScrapeAt: nextScrapeAt,
          updatedAt: now,
        },
      });

      console.log(`[Schedule] ✅ Updated schedule ${scheduleId} - next scrape at ${nextScrapeAt.toISOString()}`);
    } catch (error) {
      console.error('[Schedule] Error marking schedule as scraped:', error);
      throw error;
    }
  }

  /**
   * Update schedule priority
   *
   * @param {string} scheduleId - Schedule ID
   * @param {number} priority - New priority (1-10)
   * @returns {Promise<void>}
   */
  async updatePriority(scheduleId: string, priority: number): Promise<void> {
    try {
      if (priority < 1 || priority > 10) {
        throw new Error('Priority must be between 1 and 10');
      }

      await prisma.scrapingSchedule.update({
        where: { id: scheduleId },
        data: {
          priority,
          updatedAt: new Date(),
        },
      });

      console.log(`[Schedule] ✅ Updated schedule ${scheduleId} priority to ${priority}`);
    } catch (error) {
      console.error('[Schedule] Error updating priority:', error);
      throw error;
    }
  }

  /**
   * Update schedule frequency
   *
   * @param {string} scheduleId - Schedule ID
   * @param {number} frequencyHours - New frequency in hours
   * @returns {Promise<void>}
   */
  async updateFrequency(scheduleId: string, frequencyHours: number): Promise<void> {
    try {
      if (frequencyHours < 1) {
        throw new Error('Frequency must be at least 1 hour');
      }

      await prisma.scrapingSchedule.update({
        where: { id: scheduleId },
        data: {
          frequencyHours,
          updatedAt: new Date(),
        },
      });

      console.log(`[Schedule] ✅ Updated schedule ${scheduleId} frequency to ${frequencyHours}h`);
    } catch (error) {
      console.error('[Schedule] Error updating frequency:', error);
      throw error;
    }
  }

  /**
   * Activate or deactivate a schedule
   *
   * @param {string} scheduleId - Schedule ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<void>}
   */
  async setActive(scheduleId: string, isActive: boolean): Promise<void> {
    try {
      await prisma.scrapingSchedule.update({
        where: { id: scheduleId },
        data: {
          isActive,
          updatedAt: new Date(),
        },
      });

      console.log(`[Schedule] ✅ Schedule ${scheduleId} ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('[Schedule] Error setting active status:', error);
      throw error;
    }
  }

  /**
   * Delete a schedule
   *
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<void>}
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      await prisma.scrapingSchedule.delete({
        where: { id: scheduleId },
      });

      console.log(`[Schedule] ✅ Deleted schedule ${scheduleId}`);
    } catch (error) {
      console.error('[Schedule] Error deleting schedule:', error);
      throw error;
    }
  }

  /**
   * Get schedule statistics
   *
   * @returns {Promise<ScheduleStats>} Statistics about schedules
   */
  async getStats(): Promise<ScheduleStats> {
    try {
      const allSchedules = await prisma.scrapingSchedule.findMany({
        select: {
          id: true,
          source: true,
          isActive: true,
        },
      });

      const now = new Date();

      const dueSchedules = await prisma.scrapingSchedule.findMany({
        where: {
          isActive: true,
          nextScrapeAt: {
            lte: now,
          },
        },
        select: { id: true },
      });

      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

      const upcoming1h = await prisma.scrapingSchedule.findMany({
        where: {
          isActive: true,
          nextScrapeAt: {
            lte: oneHourFromNow,
            gt: now,
          },
        },
        select: { id: true },
      });

      const twentyFourHoursFromNow = new Date();
      twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);

      const upcoming24h = await prisma.scrapingSchedule.findMany({
        where: {
          isActive: true,
          nextScrapeAt: {
            lte: twentyFourHoursFromNow,
            gt: now,
          },
        },
        select: { id: true },
      });

      const schedules_by_source: Record<string, number> = {};
      allSchedules?.forEach((schedule) => {
        if (schedule.isActive) {
          schedules_by_source[schedule.source] =
            (schedules_by_source[schedule.source] || 0) + 1;
        }
      });

      return {
        total_schedules: allSchedules?.length || 0,
        active_schedules: allSchedules?.filter((s) => s.isActive).length || 0,
        schedules_by_source,
        due_now: dueSchedules?.length || 0,
        upcoming_1h: upcoming1h?.length || 0,
        upcoming_24h: upcoming24h?.length || 0,
      };
    } catch (error) {
      console.error('[Schedule] Error fetching stats:', error);
      throw error;
    }
  }
}

export const scheduleService = new ScheduleService();
