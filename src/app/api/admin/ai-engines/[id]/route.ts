/**
 * Admin API: Individual AI Engine Operations
 *
 * GET, PUT, DELETE operations for a specific AI engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/ai-engines/[id] - Get single AI engine
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

    const engine = await prisma.aIEngine.findUnique({
      where: { id: params.id }
    });

    if (!engine) {
      return NextResponse.json(
        { success: false, error: 'AI engine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      engine
    });

  } catch (error) {
    console.error('Error fetching AI engine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI engine' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/ai-engines/[id] - Update AI engine
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

    // Check if engine exists
    const existing = await prisma.aIEngine.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'AI engine not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const data = await req.json();

    // Build update data (only include provided fields)
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
    if (data.costPer1kTokens !== undefined) updateData.costPer1kTokens = data.costPer1kTokens;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.defaultFor !== undefined) updateData.defaultFor = data.defaultFor;
    if (data.rateLimit !== undefined) updateData.rateLimit = data.rateLimit;

    // Update AI engine
    const engine = await prisma.aIEngine.update({
      where: { id: params.id },
      data: updateData
    });

    console.log(`✅ Admin updated AI engine: ${engine.name}`);

    return NextResponse.json({
      success: true,
      engine
    });

  } catch (error) {
    console.error('Error updating AI engine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update AI engine' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/ai-engines/[id] - Delete AI engine
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

    // Check if engine exists
    const existing = await prisma.aIEngine.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'AI engine not found' },
        { status: 404 }
      );
    }

    // Delete AI engine
    await prisma.aIEngine.delete({
      where: { id: params.id }
    });

    console.log(`✅ Admin deleted AI engine: ${existing.name}`);

    return NextResponse.json({
      success: true,
      message: 'AI engine deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting AI engine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete AI engine' },
      { status: 500 }
    );
  }
}
