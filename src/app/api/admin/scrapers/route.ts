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

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Fetch scrapers with their latest statistics
    const scrapers = await prisma.scraperStats.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      scrapers,
      total: scrapers.length
    });

  } catch (error) {
    console.error('Error fetching scrapers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scrapers' },
      { status: 500 }
    );
  }
}

// POST /api/admin/scrapers - Create new scraper
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

    // Parse and validate request body
    const data = await req.json();

    // Validate required fields
    if (!data.name || typeof data.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!data.source || typeof data.source !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Source is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if scraper with this name or source already exists
    const existing = await prisma.scraperStats.findFirst({
      where: {
        OR: [
          { name: data.name },
          { source: data.source }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Scraper with this name or source already exists' },
        { status: 409 }
      );
    }

    // Create scraper with default values
    const scraper = await prisma.scraperStats.create({
      data: {
        name: data.name,
        source: data.source,
        isActive: data.isActive ?? true,
        totalJobs: 0,
        successfulScrapes: 0,
        failedScrapes: 0,
        averageDuration: 0,
      }
    });

    console.log(`✅ Admin created scraper: ${scraper.name}`);

    return NextResponse.json({
      success: true,
      scraper
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating scraper:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create scraper' },
      { status: 500 }
    );
  }
}
