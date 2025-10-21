/**
 * Admin Feature Costs API
 * GET - List all features
 * POST - Create new feature
 * PUT - Update existing feature
 * DELETE - Delete feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

// GET - List all features
export async function GET() {
    try {
        // Verify admin authentication
        const user = await getSession();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        const features = await prisma.aIFeatureCost.findMany({
            orderBy: [
                { feature: 'asc' },
                { costTokens: 'desc' }
            ]
        });

        return NextResponse.json({ features });
    } catch (error: any) {
        console.error('[Admin Features] GET Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch features' },
            { status: 500 }
        );
    }
}

// POST - Create new feature
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const user = await getSession();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();

        const data = await prisma.aIFeatureCost.create({
            data: {
                feature: body.feature,
                costTokens: body.cost_tokens || body.token_cost || 0,
                description: body.description,
                averageApiCostUsd: body.average_api_cost_usd,
                isActive: body.active ?? body.is_active ?? true,
            }
        });

        return NextResponse.json({ success: true, feature: data });
    } catch (error: any) {
        console.error('[Admin Features] POST Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create feature' },
            { status: 500 }
        );
    }
}

// PUT - Update existing feature
export async function PUT(request: NextRequest) {
    try {
        // Verify admin authentication
        const user = await getSession();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();

        const data = await prisma.aIFeatureCost.update({
            where: { feature: body.feature },
            data: {
                costTokens: body.cost_tokens || body.token_cost,
                description: body.description,
                averageApiCostUsd: body.average_api_cost_usd,
                isActive: body.active ?? body.is_active,
            }
        });

        return NextResponse.json({ success: true, feature: data });
    } catch (error: any) {
        console.error('[Admin Features] PUT Error:', error);
        return NextResponse.json(
            { error: 'Failed to update feature' },
            { status: 500 }
        );
    }
}

// DELETE - Delete feature
export async function DELETE(request: NextRequest) {
    try {
        // Verify admin authentication
        const user = await getSession();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const featureKey = searchParams.get('key');

        if (!featureKey) {
            return NextResponse.json(
                { error: 'Feature key required' },
                { status: 400 }
            );
        }

        await prisma.aIFeatureCost.delete({
            where: { feature: featureKey }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Features] DELETE Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete feature' },
            { status: 500 }
        );
    }
}
