/**
 * Admin Users API
 * GET - List all users with their tokens and subscription info
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

        // Get all users data from database using Prisma
        const dbUsers = await prisma.user.findMany({
            include: {
                tokens: true,
            },
        });

        // Format users data
        const users = dbUsers.map((dbUser) => {
            const tokens = dbUser.tokens;

            return {
                id: dbUser.id,
                email: dbUser.email || '',
                full_name: dbUser.fullName,
                created_at: dbUser.createdAt,
                is_premium: dbUser.isPremium || false,
                is_admin: dbUser.isAdmin || false,
                token_balance: tokens?.balance || 0,
                lifetime_earned: tokens?.lifetimeEarned || 0,
                lifetime_spent: tokens?.lifetimeSpent || 0,
            };
        });

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('[Admin Users] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
