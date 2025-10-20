/**
 * Admin Token Packages API
 * GET - List all packages
 * POST - Create new package
 * PUT - Update existing package
 * DELETE - Delete package
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

// GET - List all packages
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

        const packages = await prisma.tokenPackage.findMany({
            orderBy: { sortOrder: 'asc' }
        });

        return NextResponse.json({ packages });
    } catch (error: any) {
        console.error('[Admin Packages] GET Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch packages' },
            { status: 500 }
        );
    }
}

// POST - Create new package
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

        const data = await prisma.tokenPackage.create({
            data: {
                tier: body.tier,
                name: body.name,
                tokens: body.tokens,
                priceCents: body.price_cents,
                discountPercentage: body.discount_percentage,
                popular: body.popular,
                bestValue: body.best_value,
                active: body.active,
                sortOrder: body.sort_order,
            }
        });

        return NextResponse.json({ success: true, package: data });
    } catch (error: any) {
        console.error('[Admin Packages] POST Error:', error);
        return NextResponse.json(
            { error: 'Failed to create package' },
            { status: 500 }
        );
    }
}

// PUT - Update existing package
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

        const data = await prisma.tokenPackage.update({
            where: { id: body.id },
            data: {
                tier: body.tier,
                name: body.name,
                tokens: body.tokens,
                priceCents: body.price_cents,
                discountPercentage: body.discount_percentage,
                popular: body.popular,
                bestValue: body.best_value,
                active: body.active,
                sortOrder: body.sort_order,
            }
        });

        return NextResponse.json({ success: true, package: data });
    } catch (error: any) {
        console.error('[Admin Packages] PUT Error:', error);
        return NextResponse.json(
            { error: 'Failed to update package' },
            { status: 500 }
        );
    }
}

// DELETE - Delete package
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
        const packageId = searchParams.get('id');

        if (!packageId) {
            return NextResponse.json(
                { error: 'Package ID required' },
                { status: 400 }
            );
        }

        await prisma.tokenPackage.delete({
            where: { id: packageId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Packages] DELETE Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete package' },
            { status: 500 }
        );
    }
}
