/**
 * Admin API: Individual Scraper Operations
 *
 * GET - Get scraper statistics (read-only)
 * PUT, DELETE - Not supported (statistics are read-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/scrapers/[id] - Get single scraper statistics
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const scraper = await prisma.scraperStats.findUnique({
      where: { id: params.id }
    });

    if (!scraper) {
      return NextResponse.json(
        { success: false, error: 'Scraper statistics not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      scraper
    });

  } catch (error) {
    console.error('Error fetching scraper:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scraper' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/scrapers/[id] - Not supported
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // ScraperStats is read-only, no updates allowed
    return NextResponse.json(
      {
        success: false,
        error: 'Scraper statistics are read-only and managed automatically by the scraping system'
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in scraper update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/scrapers/[id] - Not supported
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // ScraperStats is read-only, no deletions allowed
    return NextResponse.json(
      {
        success: false,
        error: 'Scraper statistics are read-only and managed automatically by the scraping system'
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in scraper delete:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
