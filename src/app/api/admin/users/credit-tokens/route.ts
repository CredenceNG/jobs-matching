/**
 * POST /api/admin/users/credit-tokens
 *
 * Credit tokens to a user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/tokens/token-service';

export async function POST(request: NextRequest) {
    try {
        const { userId, amount } = await request.json();

        if (!userId || !amount) {
            return NextResponse.json(
                { error: 'User ID and amount required' },
                { status: 400 }
            );
        }

        // Credit tokens
        await TokenService.addTokens(
            userId,
            amount,
            'bonus',
            `Admin credited ${amount} tokens`,
            { admin_credit: true, credited_by: 'admin' }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Credit Tokens] Error:', error);
        return NextResponse.json(
            { error: 'Failed to credit tokens' },
            { status: 500 }
        );
    }
}
