/**
 * GET /api/tokens/balance
 *
 * Get user's current token balance and unlimited status
 *
 * @returns { balance: number, unlimited: boolean, lifetimeStats?: TokenBalance }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { TokenService } from '@/lib/tokens';

export async function GET(request: NextRequest) {
    try {
        const user = await getSession();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get balance and unlimited status using user ID from session
        const [balance, isUnlimited, lifetimeStats] = await Promise.all([
            TokenService.getBalance(user.id),
            TokenService.hasUnlimitedTokens(user.id),
            TokenService.getBalanceInfo(user.id)
        ]);

        return NextResponse.json({
            balance: isUnlimited ? Infinity : balance,
            unlimited: isUnlimited,
            lifetimeStats
        });
    } catch (error: any) {
        console.error('Error fetching token balance:', error);
        return NextResponse.json(
            { error: 'Failed to fetch balance', details: error.message },
            { status: 500 }
        );
    }
}
