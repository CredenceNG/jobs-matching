/**
 * POST /api/tokens/deduct
 *
 * Deduct tokens for a feature usage
 * Checks affordability first, then atomically deducts tokens
 *
 * @body { featureKey: string, metadata?: Record<string, any> }
 * @returns { success: boolean, newBalance: number, transactionId: string, unlimited: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { TokenService } from '@/lib/tokens';

export async function POST(request: NextRequest) {
    try {
        const user = await getSession();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { featureKey, metadata } = body;

        if (!featureKey) {
            return NextResponse.json(
                { error: 'Feature key is required' },
                { status: 400 }
            );
        }

        // Check affordability first
        const affordability = await TokenService.canAffordFeature(user.id, featureKey);

        if (!affordability.canAfford && !affordability.isUnlimited) {
            return NextResponse.json(
                {
                    error: 'INSUFFICIENT_TOKENS',
                    balance: affordability.balance,
                    required: affordability.required
                },
                { status: 402 } // Payment Required
            );
        }

        // Deduct tokens
        const result = await TokenService.deductTokens(user.id, featureKey, metadata);

        return NextResponse.json({
            success: result.success,
            newBalance: result.newBalance,
            transactionId: result.transactionId,
            unlimited: result.isUnlimited
        });
    } catch (error: any) {
        console.error('Error deducting tokens:', error);

        if (error.message === 'INSUFFICIENT_TOKENS') {
            return NextResponse.json(
                { error: 'Insufficient tokens' },
                { status: 402 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to deduct tokens', details: error.message },
            { status: 500 }
        );
    }
}
