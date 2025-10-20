/**
 * GET /api/tokens/history
 *
 * Get user's token transaction history
 *
 * @query limit - Number of transactions to fetch (default: 50, max: 100)
 * @returns { transactions: TokenTransaction[], total: number }
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

        const { searchParams } = new URL(request.url);
        const limit = Math.min(
            parseInt(searchParams.get('limit') || '50'),
            100
        );

        const transactions = await TokenService.getTransactionHistory(user.id, limit);

        return NextResponse.json({
            transactions,
            total: transactions.length
        });
    } catch (error: any) {
        console.error('Error fetching transaction history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch history', details: error.message },
            { status: 500 }
        );
    }
}
