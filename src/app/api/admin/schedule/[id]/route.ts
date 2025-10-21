/**
 * Admin API: Individual Schedule Operations
 *
 * GET, PUT, DELETE operations for a specific scrape schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/schedule/[id] - Get single schedule
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

    const schedule = await prisma.scrapeSchedule.findUnique({
      where: { id: params.id }
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      schedule
    });

  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/schedule/[id] - Update schedule
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

    // Check if schedule exists
    const existing = await prisma.scrapeSchedule.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const data = await req.json();

    // Build update data (only include provided fields)
    const updateData: any = {};

    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.sourcesToScrape !== undefined) {
      if (!Array.isArray(data.sourcesToScrape) || data.sourcesToScrape.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Sources to scrape must be a non-empty array' },
          { status: 400 }
        );
      }
      updateData.sourcesToScrape = data.sourcesToScrape;
    }
    if (data.nextRun !== undefined) {
      updateData.nextRun = new Date(data.nextRun);
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update schedule
    const schedule = await prisma.scrapeSchedule.update({
      where: { id: params.id },
      data: updateData
    });

    console.log(`✅ Admin updated schedule: ${schedule.id}`);

    return NextResponse.json({
      success: true,
      schedule
    });

  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/schedule/[id] - Delete schedule
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

    // Check if schedule exists
    const existing = await prisma.scrapeSchedule.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Delete schedule
    await prisma.scrapeSchedule.delete({
      where: { id: params.id }
    });

    console.log(`✅ Admin deleted schedule: ${existing.id}`);

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
