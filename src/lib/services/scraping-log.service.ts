/**
 * Scraping Log Service
 *
 * Tracks all scraping operations for monitoring, debugging, and analytics
 *
 * Features:
 * - Log scraping operations (success/failure)
 * - Track performance metrics (duration, items scraped)
 * - Monitor error rates by source
 * - Analyze scraping trends
 * - Detect potential blocking or rate limiting issues
 *
 * @usage Used by scrapers and scheduled function to track all scraping activity
 */

import { prisma } from '@/lib/prisma';

export interface ScrapingLog {
  id?: string;
  source: string;
  search_query?: string;
  location?: string;
  status: 'success' | 'error' | 'partial';
  items_found: number;
  items_stored: number;
  duration_ms: number;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface ScrapingStats {
  total_scrapes: number;
  successful_scrapes: number;
  failed_scrapes: number;
  success_rate: number;
  total_items_found: number;
  total_items_stored: number;
  avg_duration_ms: number;
  scrapes_by_source: Record<string, {
    total: number;
    success: number;
    failed: number;
    items_found: number;
  }>;
  recent_errors: Array<{
    source: string;
    error_message: string;
    created_at: string;
  }>;
}

export class ScrapingLogService {
  /**
   * Log a scraping operation
   *
   * @description Records scraping attempt with results and performance metrics
   * @param {ScrapingLog} log - Log entry data
   * @returns {Promise<string>} Log ID
   */
  async log(log: ScrapingLog): Promise<string> {
    try {
      const logData = {
        source: log.source,
        searchQuery: log.search_query,
        location: log.location,
        status: log.status,
        itemsFound: log.items_found,
        itemsStored: log.items_stored,
        durationMs: log.duration_ms,
        errorMessage: log.error_message,
        metadata: log.metadata || {},
      };

      const result = await prisma.scrapingLog.create({
        data: logData,
      });

      const statusEmoji = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
      console.log(
        `[ScrapingLog] ${statusEmoji} ${log.source}: ${log.items_stored}/${log.items_found} items in ${log.duration_ms}ms`
      );

      return result.id;
    } catch (error) {
      console.error('[ScrapingLog] Error logging scrape:', error);
      throw error;
    }
  }

  /**
   * Get recent logs
   *
   * @param {number} limit - Number of logs to retrieve
   * @param {string} source - Filter by source (optional)
   * @returns {Promise<ScrapingLog[]>} Recent scraping logs
   */
  async getRecentLogs(limit: number = 100, source?: string): Promise<ScrapingLog[]> {
    try {
      const logs = await prisma.scrapingLog.findMany({
        where: source ? { source } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return logs.map(log => ({
        id: log.id,
        source: log.source,
        search_query: log.searchQuery || undefined,
        location: log.location || undefined,
        status: log.status as 'success' | 'error' | 'partial',
        items_found: log.itemsFound,
        items_stored: log.itemsStored,
        duration_ms: log.durationMs,
        error_message: log.errorMessage || undefined,
        metadata: log.metadata as Record<string, any> || undefined,
        created_at: log.createdAt.toISOString(),
      }));
    } catch (error) {
      console.error('[ScrapingLog] Error fetching recent logs:', error);
      return [];
    }
  }

  /**
   * Get logs for a specific time range
   *
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} source - Filter by source (optional)
   * @returns {Promise<ScrapingLog[]>} Logs in time range
   */
  async getLogsByDateRange(
    startDate: Date,
    endDate: Date,
    source?: string
  ): Promise<ScrapingLog[]> {
    try {
      const logs = await prisma.scrapingLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          ...(source ? { source } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      return logs.map(log => ({
        id: log.id,
        source: log.source,
        search_query: log.searchQuery || undefined,
        location: log.location || undefined,
        status: log.status as 'success' | 'error' | 'partial',
        items_found: log.itemsFound,
        items_stored: log.itemsStored,
        duration_ms: log.durationMs,
        error_message: log.errorMessage || undefined,
        metadata: log.metadata as Record<string, any> || undefined,
        created_at: log.createdAt.toISOString(),
      }));
    } catch (error) {
      console.error('[ScrapingLog] Error fetching logs by date range:', error);
      return [];
    }
  }

  /**
   * Get failed scraping attempts
   *
   * @param {number} limit - Number of errors to retrieve
   * @param {number} hoursBack - Look back this many hours
   * @returns {Promise<ScrapingLog[]>} Recent failed scrapes
   */
  async getRecentErrors(limit: number = 50, hoursBack: number = 24): Promise<ScrapingLog[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

      const logs = await prisma.scrapingLog.findMany({
        where: {
          status: 'error',
          createdAt: {
            gte: cutoffDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return logs.map(log => ({
        id: log.id,
        source: log.source,
        search_query: log.searchQuery || undefined,
        location: log.location || undefined,
        status: log.status as 'success' | 'error' | 'partial',
        items_found: log.itemsFound,
        items_stored: log.itemsStored,
        duration_ms: log.durationMs,
        error_message: log.errorMessage || undefined,
        metadata: log.metadata as Record<string, any> || undefined,
        created_at: log.createdAt.toISOString(),
      }));
    } catch (error) {
      console.error('[ScrapingLog] Error fetching recent errors:', error);
      return [];
    }
  }

  /**
   * Get scraping statistics
   *
   * @param {number} hoursBack - Calculate stats for last N hours (default 24)
   * @returns {Promise<ScrapingStats>} Comprehensive scraping statistics
   */
  async getStats(hoursBack: number = 24): Promise<ScrapingStats> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

      const logs = await prisma.scrapingLog.findMany({
        where: {
          createdAt: {
            gte: cutoffDate,
          },
        },
      });

      if (!logs || logs.length === 0) {
        return {
          total_scrapes: 0,
          successful_scrapes: 0,
          failed_scrapes: 0,
          success_rate: 0,
          total_items_found: 0,
          total_items_stored: 0,
          avg_duration_ms: 0,
          scrapes_by_source: {},
          recent_errors: [],
        };
      }

      const totalScrapes = logs.length;
      const successfulScrapes = logs.filter((l) => l.status === 'success').length;
      const failedScrapes = logs.filter((l) => l.status === 'error').length;
      const successRate = (successfulScrapes / totalScrapes) * 100;

      const totalItemsFound = logs.reduce((sum, log) => sum + log.itemsFound, 0);
      const totalItemsStored = logs.reduce((sum, log) => sum + log.itemsStored, 0);
      const avgDuration =
        logs.reduce((sum, log) => sum + log.durationMs, 0) / totalScrapes;

      // Group by source
      const scrapesBySource: Record<string, {
        total: number;
        success: number;
        failed: number;
        items_found: number;
      }> = {};

      logs.forEach((log) => {
        if (!scrapesBySource[log.source]) {
          scrapesBySource[log.source] = {
            total: 0,
            success: 0,
            failed: 0,
            items_found: 0,
          };
        }

        scrapesBySource[log.source].total++;
        scrapesBySource[log.source].items_found += log.itemsFound;

        if (log.status === 'success') {
          scrapesBySource[log.source].success++;
        } else if (log.status === 'error') {
          scrapesBySource[log.source].failed++;
        }
      });

      // Get recent errors
      const recentErrors = logs
        .filter((log) => log.status === 'error')
        .slice(0, 10)
        .map((log) => ({
          source: log.source,
          error_message: log.errorMessage || 'Unknown error',
          created_at: log.createdAt.toISOString(),
        }));

      return {
        total_scrapes: totalScrapes,
        successful_scrapes: successfulScrapes,
        failed_scrapes: failedScrapes,
        success_rate: Math.round(successRate * 100) / 100,
        total_items_found: totalItemsFound,
        total_items_stored: totalItemsStored,
        avg_duration_ms: Math.round(avgDuration),
        scrapes_by_source: scrapesBySource,
        recent_errors: recentErrors,
      };
    } catch (error) {
      console.error('[ScrapingLog] Error getting stats:', error);
      return {
        total_scrapes: 0,
        successful_scrapes: 0,
        failed_scrapes: 0,
        success_rate: 0,
        total_items_found: 0,
        total_items_stored: 0,
        avg_duration_ms: 0,
        scrapes_by_source: {},
        recent_errors: [],
      };
    }
  }

  /**
   * Detect potential blocking issues
   *
   * @description Analyzes recent scraping attempts to detect patterns
   * indicating IP blocking or rate limiting
   * @param {string} source - Source to check
   * @param {number} hoursBack - Hours to look back
   * @returns {Promise<{isBlocked: boolean, reason: string}>}
   */
  async detectBlocking(
    source: string,
    hoursBack: number = 2
  ): Promise<{ isBlocked: boolean; reason: string }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

      const logs = await prisma.scrapingLog.findMany({
        where: {
          source,
          createdAt: {
            gte: cutoffDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!logs || logs.length === 0) {
        return { isBlocked: false, reason: 'No recent scraping attempts' };
      }

      // Check consecutive failures
      const recentLogs = logs.slice(0, 5);
      const allFailed = recentLogs.every((log) => log.status === 'error');

      if (allFailed && recentLogs.length >= 3) {
        return {
          isBlocked: true,
          reason: `${recentLogs.length} consecutive failures detected`,
        };
      }

      // Check error rate
      const errorRate = logs.filter((l) => l.status === 'error').length / logs.length;

      if (errorRate > 0.7 && logs.length >= 5) {
        return {
          isBlocked: true,
          reason: `High error rate: ${Math.round(errorRate * 100)}%`,
        };
      }

      // Check for zero items found
      const zeroItemsCount = logs.filter((l) => l.itemsFound === 0).length;

      if (zeroItemsCount > 3 && zeroItemsCount / logs.length > 0.6) {
        return {
          isBlocked: true,
          reason: `Consistently finding 0 items (${zeroItemsCount}/${logs.length} attempts)`,
        };
      }

      return { isBlocked: false, reason: 'Scraping appears normal' };
    } catch (error) {
      console.error('[ScrapingLog] Error detecting blocking:', error);
      return { isBlocked: false, reason: 'Error checking blocking status' };
    }
  }

  /**
   * Clean up old logs
   *
   * @param {number} daysToKeep - Keep logs from last N days
   * @returns {Promise<number>} Number of logs deleted
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.scrapingLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      const count = result.count;
      console.log(`[ScrapingLog] ✅ Cleaned up ${count} logs older than ${daysToKeep} days`);
      return count;
    } catch (error) {
      console.error('[ScrapingLog] Error cleaning up logs:', error);
      return 0;
    }
  }
}

export const scrapingLogService = new ScrapingLogService();
