/**
 * Admin API: AI Engine Management
 *
 * GET - List all AI engines with their configurations
 * POST - Create a new AI engine configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/admin/ai-engines - List all AI engines
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
    const provider = searchParams.get('provider');

    // Build where clause
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    if (provider) {
      where.provider = provider;
    }

    // Fetch AI engines
    const engines = await prisma.aIEngine.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { provider: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      engines,
      total: engines.length
    });

  } catch (error) {
    console.error('Error fetching AI engines:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI engines' },
      { status: 500 }
    );
  }
}

// POST /api/admin/ai-engines - Create new AI engine
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

    if (!data.provider || typeof data.provider !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Provider is required and must be a string (e.g., "openai", "anthropic")' },
        { status: 400 }
      );
    }

    if (!data.model || typeof data.model !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Model is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if engine with this name already exists
    const existing = await prisma.aIEngine.findUnique({
      where: { name: data.name }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'AI engine with this name already exists' },
        { status: 409 }
      );
    }

    // Create AI engine
    const engine = await prisma.aIEngine.create({
      data: {
        name: data.name,
        provider: data.provider,
        model: data.model,
        apiKey: data.apiKey || null,
        baseUrl: data.baseUrl || null,
        maxTokens: data.maxTokens || 4096,
        temperature: data.temperature ?? 0.7,
        costPer1kTokensInput: data.costPer1kTokensInput || 0,
        costPer1kTokensOutput: data.costPer1kTokensOutput || 0,
        isActive: data.isActive ?? true,
        config: data.config || {},
      }
    });

    console.log(`✅ Admin created AI engine: ${engine.name} (${engine.provider}/${engine.model})`);

    return NextResponse.json({
      success: true,
      engine
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating AI engine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create AI engine' },
      { status: 500 }
    );
  }
}
