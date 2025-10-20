/**
 * Admin API: Individual Location Operations
 *
 * GET, PUT, DELETE operations for a specific location
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/locations/[id] - Get single location
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

    const location = await prisma.locationConfig.findUnique({
      where: { id: params.id }
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location
    });

  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/locations/[id] - Update location
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

    // Check if location exists
    const existing = await prisma.locationConfig.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const data = await req.json();

    // Build update data (only include provided fields)
    const updateData: any = {};

    if (data.country !== undefined) updateData.country = data.country;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.keywords !== undefined) {
      if (!Array.isArray(data.keywords) || data.keywords.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Keywords must be a non-empty array' },
          { status: 400 }
        );
      }
      updateData.keywords = data.keywords;
    }
    if (data.indeedDomain !== undefined) updateData.indeedDomain = data.indeedDomain;
    if (data.linkedinRegion !== undefined) updateData.linkedinRegion = data.linkedinRegion;
    if (data.recommendedBoards !== undefined) {
      if (!Array.isArray(data.recommendedBoards) || data.recommendedBoards.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Recommended boards must be a non-empty array' },
          { status: 400 }
        );
      }
      updateData.recommendedBoards = data.recommendedBoards;
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update location
    const location = await prisma.locationConfig.update({
      where: { id: params.id },
      data: updateData
    });

    console.log(`✅ Admin updated location: ${location.country}`);

    return NextResponse.json({
      success: true,
      location
    });

  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/locations/[id] - Delete location
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

    // Check if location exists
    const existing = await prisma.locationConfig.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Delete location
    await prisma.locationConfig.delete({
      where: { id: params.id }
    });

    console.log(`✅ Admin deleted location: ${existing.country}`);

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
