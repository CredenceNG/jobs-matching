/**
 * Admin API: Dashboard Statistics
 *
 * GET endpoint that aggregates statistics from multiple tables for the admin dashboard overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/stats - Get dashboard statistics
export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch all statistics in parallel for performance
    const [
      totalUsers,
      activeSubscribers,
      totalRevenue,
      monthlyRevenue,
      tokensSold,
      tokensUsed,
      totalLocations,
      activeLocations,
      totalJobs,
      jobsScrapedToday,
      activeScrapers,
      totalScrapeRuns,
      successfulScrapeRuns,
      aiEngines,
      totalAIUsage,
    ] = await Promise.all([
      // User statistics
      prisma.user.count(),

      // Active subscribers (users with isPremium = true)
      prisma.user.count({
        where: { isPremium: true }
      }),

      // Total revenue from token purchases (sum of amountCents)
      prisma.tokenPurchase.aggregate({
        _sum: { amountCents: true }
      }).then(result => result._sum.amountCents || 0),

      // Monthly revenue (current month)
      prisma.tokenPurchase.aggregate({
        where: {
          createdAt: { gte: startOfMonth }
        },
        _sum: { amountCents: true }
      }).then(result => result._sum.amountCents || 0),

      // Total tokens sold (sum of lifetimeEarned)
      prisma.userToken.aggregate({
        _sum: { lifetimeEarned: true }
      }).then(result => result._sum.lifetimeEarned || 0),

      // Total tokens used (sum of lifetimeSpent)
      prisma.userToken.aggregate({
        _sum: { lifetimeSpent: true }
      }).then(result => result._sum.lifetimeSpent || 0),

      // Location statistics
      prisma.locationConfig.count(),
      prisma.locationConfig.count({
        where: { isActive: true }
      }),

      // Job statistics
      prisma.job.count(),
      prisma.job.count({
        where: {
          scrapedAt: { gte: startOfToday }
        }
      }),

      // Scraper statistics
      prisma.scraperStats.count({
        where: { isActive: true }
      }),

      // Scrape run statistics
      prisma.scrapeRun.count(),
      prisma.scrapeRun.count({
        where: { status: 'completed' }
      }),

      // AI Engine statistics
      prisma.aIEngine.count({
        where: { isActive: true }
      }),

      // Total AI usage
      prisma.aIUsage.count(),
    ]);

    // Calculate scraper success rate
    const scraperSuccessRate = totalScrapeRuns > 0
      ? ((successfulScrapeRuns / totalScrapeRuns) * 100).toFixed(1)
      : '0.0';

    // Return aggregated statistics
    return NextResponse.json({
      success: true,
      // Main dashboard stats (existing format for compatibility)
      totalUsers,
      activeSubscribers,
      totalRevenue,
      monthlyRevenue,
      tokensSold,
      tokensUsed,

      // Extended stats (new format with nested structure)
      stats: {
        // User & Revenue Stats
        users: {
          total: totalUsers,
          premium: activeSubscribers,
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
        },
        tokens: {
          sold: tokensSold,
          used: tokensUsed,
          remaining: tokensSold - tokensUsed,
        },

        // Location Stats
        locations: {
          total: totalLocations,
          active: activeLocations,
        },

        // Job Stats
        jobs: {
          total: totalJobs,
          scrapedToday: jobsScrapedToday,
        },

        // Scraper Stats
        scrapers: {
          active: activeScrapers,
          totalRuns: totalScrapeRuns,
          successfulRuns: successfulScrapeRuns,
          successRate: parseFloat(scraperSuccessRate),
        },

        // AI Stats
        ai: {
          activeEngines: aiEngines,
          totalUsage: totalAIUsage,
        },
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
