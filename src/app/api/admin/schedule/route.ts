/**
 * Admin API: Scrape Schedule Management
 *
 * GET - List all scrape schedules
 * POST - Create a new scrape schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/schedule - List all schedules
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

    // Fetch schedules
    const schedules = await prisma.scrapeSchedule.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      schedules,
      total: schedules.length
    });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST /api/admin/schedule - Create new schedule
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
    if (!data.frequency || typeof data.frequency !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Frequency (cron expression) is required and must be a string' },
        { status: 400 }
      );
    }

    if (!data.sourcesToScrape || !Array.isArray(data.sourcesToScrape) || data.sourcesToScrape.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sources to scrape must be a non-empty array' },
        { status: 400 }
      );
    }

    // Calculate next run time (simplified - assumes frequency is a cron expression)
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 1); // Default: next run in 1 hour

    // Create schedule
    const schedule = await prisma.scrapeSchedule.create({
      data: {
        frequency: data.frequency,
        sourcesToScrape: data.sourcesToScrape,
        nextRun: nextRun,
        isActive: data.isActive ?? true,
      }
    });

    console.log(`✅ Admin created schedule: ${schedule.id}`);

    return NextResponse.json({
      success: true,
      schedule
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
