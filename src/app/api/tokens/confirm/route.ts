/**
 * POST /api/tokens/confirm
 *
 * Confirm token purchase and credit tokens after successful Stripe payment
 * Called from the success page after payment is completed
 *
 * @description Credits tokens to user account after payment confirmation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { TokenService } from '@/lib/tokens/token-service';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
    console.log('🔵 [Token Confirm] Starting token confirmation...');

    try {
        // Step 1: Authenticate user via session
        const user = await getSession();

        if (!user) {
            console.error('🔴 [Token Confirm] Authentication error: No session');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('✅ [Token Confirm] User authenticated:', user.id);

        // Step 2: Get payment intent ID from request
        const { paymentIntentId } = await request.json();

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: 'Payment intent ID required' },
                { status: 400 }
            );
        }

        console.log('🔵 [Token Confirm] Verifying payment:', paymentIntentId);

        // Step 3: Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            console.error('🔴 [Token Confirm] Payment not succeeded:', paymentIntent.status);
            return NextResponse.json(
                { error: 'Payment not completed', status: paymentIntent.status },
                { status: 400 }
            );
        }

        // Step 4: Verify payment belongs to this user
        const metadataUserId = paymentIntent.metadata.user_id;
        if (metadataUserId !== user.id) {
            console.error('🔴 [Token Confirm] User ID mismatch');
            return NextResponse.json(
                { error: 'Unauthorized - Payment does not belong to this user' },
                { status: 403 }
            );
        }

        // Step 5: Extract purchase details
        const tokensAmount = parseInt(paymentIntent.metadata.tokens || '0');
        const packageId = paymentIntent.metadata.package_id;

        console.log(`✅ [Token Confirm] Payment verified: ${tokensAmount} tokens`);

        // Step 6: Check if already credited (prevent double-crediting) using Prisma
        const existingCredit = await prisma.tokenTransaction.findFirst({
            where: {
                userId: user.id,
                type: 'purchase',
                metadata: {
                    path: ['payment_intent_id'],
                    equals: paymentIntentId,
                },
            },
        });

        if (existingCredit) {
            console.log('🟡 [Token Confirm] Tokens already credited for this payment');
            return NextResponse.json({
                success: true,
                alreadyCredited: true,
                tokensAdded: tokensAmount
            });
        }

        // Step 7: Credit tokens to user account
        console.log(`🔵 [Token Confirm] Crediting ${tokensAmount} tokens to user...`);

        await TokenService.addTokens(
            user.id,
            tokensAmount,
            'purchase',
            `Purchased ${tokensAmount} tokens`,
            {
                package_id: packageId,
                payment_intent_id: paymentIntentId,
                amount_cents: paymentIntent.amount,
                stripe_charge_id: paymentIntent.charges.data[0]?.id
            }
        );

        console.log(`✅ [Token Confirm] Tokens credited successfully`);

        // Step 8: Update purchase status in database using Prisma
        await prisma.tokenPurchase.updateMany({
            where: {
                stripePaymentIntentId: paymentIntentId,
            },
            data: {
                status: 'completed',
                completedAt: new Date(),
                stripeChargeId: paymentIntent.charges.data[0]?.id,
            },
        });

        return NextResponse.json({
            success: true,
            tokensAdded: tokensAmount,
            newBalance: await TokenService.getBalance(user.id)
        });

    } catch (error: any) {
        console.error('🔴 [Token Confirm] Fatal error:', error);
        return NextResponse.json(
            { error: 'Failed to confirm purchase', details: error.message },
            { status: 500 }
        );
    }
}
