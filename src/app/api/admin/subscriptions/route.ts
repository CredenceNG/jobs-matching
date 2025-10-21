/**
 * Admin Subscriptions API
 * GET - List all subscriptions with user details
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

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

        // Get all premium users (subscription data is stored on users table)
        const premiumUsers = await prisma.user.findMany({
            where: { isPremium: true },
            select: {
                id: true,
                email: true,
                fullName: true,
                subscriptionId: true,
                subscriptionStatus: true,
                subscriptionEndDate: true,
                subscriptionCreatedAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format the data
        const formattedSubscriptions = premiumUsers.map((user) => ({
            id: user.id,
            user_id: user.id,
            user_email: user.email || 'Unknown',
            user_name: user.fullName,
            status: user.subscriptionStatus || 'active',
            subscription_id: user.subscriptionId,
            current_period_end: user.subscriptionEndDate,
            subscription_created_at: user.subscriptionCreatedAt,
            created_at: user.createdAt,
        }));

        return NextResponse.json({ subscriptions: formattedSubscriptions });
    } catch (error: any) {
        console.error('[Admin Subscriptions] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscriptions' },
            { status: 500 }
        );
    }
}
