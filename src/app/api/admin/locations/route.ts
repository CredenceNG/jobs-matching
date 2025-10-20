/**
 * Admin API: Location Management
 *
 * CRUD operations for location configurations
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/locations - List all locations
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

    // Get query parameters for filtering/sorting
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'priority';
    const order = searchParams.get('order') || 'desc';

    // Build query
    const where: any = {};
    if (region) {
      where.region = region;
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Fetch locations
    const locations = await prisma.locationConfig.findMany({
      where,
      orderBy: sortBy === 'priority'
        ? { priority: order as 'asc' | 'desc' }
        : { country: order as 'asc' | 'desc' }
    });

    return NextResponse.json({
      success: true,
      locations,
      total: locations.length
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

// POST /api/admin/locations - Create new location
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

    // Parse request body
    const data = await req.json();

    // Validate required fields
    const requiredFields = ['country', 'region', 'keywords', 'indeedDomain', 'linkedinRegion', 'recommendedBoards'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate arrays
    if (!Array.isArray(data.keywords) || data.keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keywords must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(data.recommendedBoards) || data.recommendedBoards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recommended boards must be a non-empty array' },
        { status: 400 }
      );
    }

    // Create location
    const location = await prisma.locationConfig.create({
      data: {
        country: data.country,
        region: data.region,
        keywords: data.keywords,
        indeedDomain: data.indeedDomain,
        linkedinRegion: data.linkedinRegion,
        recommendedBoards: data.recommendedBoards,
        priority: data.priority || 50,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    console.log(`✅ Admin created location: ${location.country}`);

    return NextResponse.json({
      success: true,
      location
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating location:', error);

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Location with these keywords already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
