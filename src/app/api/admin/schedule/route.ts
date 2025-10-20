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
        { name: 'asc' }
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
    if (!data.name || typeof data.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!data.cronExpression || typeof data.cronExpression !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Cron expression is required and must be a string' },
        { status: 400 }
      );
    }

    if (!data.sources || !Array.isArray(data.sources) || data.sources.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sources must be a non-empty array' },
        { status: 400 }
      );
    }

    // Check if schedule with this name already exists
    const existing = await prisma.scrapeSchedule.findUnique({
      where: { name: data.name }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule with this name already exists' },
        { status: 409 }
      );
    }

    // Create schedule
    const schedule = await prisma.scrapeSchedule.create({
      data: {
        name: data.name,
        cronExpression: data.cronExpression,
        sources: data.sources,
        locations: data.locations || [],
        keywords: data.keywords || [],
        isActive: data.isActive ?? true,
      }
    });

    console.log(`✅ Admin created schedule: ${schedule.name}`);

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
