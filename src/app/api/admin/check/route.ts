/**
 * GET /api/admin/check
 *
 * Check if current user is an admin
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const user = await getSession();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin using Prisma (Neon database)
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                isAdmin: true,
            }
        });

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!userData.isAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: userData.email,
                isAdmin: true
            }
        });

    } catch (error: any) {
        console.error('[Admin Check] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
