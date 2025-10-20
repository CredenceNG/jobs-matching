/**
 * Admin API: Individual Scraper Operations
 *
 * GET, PUT, DELETE operations for a specific scraper
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/scrapers/[id] - Get single scraper
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
        { success: false, error: 'Scraper not found' },
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

// PUT /api/admin/scrapers/[id] - Update scraper
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

    // Check if scraper exists
    const existing = await prisma.scraperStats.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Scraper not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const data = await req.json();

    // Build update data (only include provided fields)
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update scraper
    const scraper = await prisma.scraperStats.update({
      where: { id: params.id },
      data: updateData
    });

    console.log(`✅ Admin updated scraper: ${scraper.name}`);

    return NextResponse.json({
      success: true,
      scraper
    });

  } catch (error) {
    console.error('Error updating scraper:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scraper' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/scrapers/[id] - Delete scraper
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

    // Check if scraper exists
    const existing = await prisma.scraperStats.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Scraper not found' },
        { status: 404 }
      );
    }

    // Delete scraper
    await prisma.scraperStats.delete({
      where: { id: params.id }
    });

    console.log(`✅ Admin deleted scraper: ${existing.name}`);

    return NextResponse.json({
      success: true,
      message: 'Scraper deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting scraper:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete scraper' },
      { status: 500 }
    );
  }
}
