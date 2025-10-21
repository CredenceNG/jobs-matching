/**
 * Admin API: Job Scraper Management
 *
 * GET - List all job scrapers with their statistics
 * POST - Create a new scraper configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/scrapers - List all scrapers
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

    // Fetch scraper statistics grouped by scraper name
    const scrapers = await prisma.scraperStats.findMany({
      orderBy: [
        { timestamp: 'desc' },
        { scraperName: 'asc' }
      ]
    });

    // Group by scraper name to get unique scrapers
    const uniqueScrapers = Array.from(
      new Map(scrapers.map(s => [s.scraperName, s])).values()
    );

    return NextResponse.json({
      success: true,
      scrapers: uniqueScrapers,
      total: uniqueScrapers.length
    });

  } catch (error) {
    console.error('Error fetching scrapers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scrapers' },
      { status: 500 }
    );
  }
}

// POST /api/admin/scrapers - Scrapers are auto-created, this endpoint is not used
export async function POST(req: NextRequest) {
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

    // Scrapers are automatically created when scraping runs
    // This endpoint returns information about how to manage scrapers
    return NextResponse.json({
      success: true,
      message: 'Scrapers are automatically created when scraping runs occur',
      info: {
        note: 'Scraper statistics are read-only and tracked automatically',
        how_to_configure: 'Use /api/admin/schedule endpoints to configure scraping schedules'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in scrapers POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
