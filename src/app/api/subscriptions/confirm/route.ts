/**
 * POST /api/subscriptions/confirm
 *
 * Confirms subscription purchase and activates premium status
 *
 * @requires authentication
 * @param {string} sessionId - Stripe checkout session ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
    console.log('🔵 [Subscription Confirm] Starting subscription confirmation...');

    try {
        // Step 1: Authenticate user
        const user = await getSession();

        if (!user) {
            console.error('🔴 [Subscription Confirm] Authentication error: No session');
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        console.log('✅ [Subscription Confirm] User authenticated:', user.id);

        // Step 2: Get session ID from request
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        console.log('🔵 [Subscription Confirm] Retrieving session from Stripe:', sessionId);

        // Step 3: Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription'],
        });

        if (!session) {
            console.error('🔴 [Subscription Confirm] Session not found');
            return NextResponse.json(
                { error: 'Invalid session' },
                { status: 404 }
            );
        }

        // Step 4: Verify payment succeeded
        if (session.payment_status !== 'paid') {
            console.error('🔴 [Subscription Confirm] Payment not completed');
            return NextResponse.json(
                { error: 'Payment not completed' },
                { status: 400 }
            );
        }

        // Step 5: Verify session belongs to this user
        const sessionUserId = session.metadata?.user_id;
        if (sessionUserId !== user.id) {
            console.error('🔴 [Subscription Confirm] User mismatch');
            return NextResponse.json(
                { error: 'Session does not belong to this user' },
                { status: 403 }
            );
        }

        console.log('✅ [Subscription Confirm] Session verified');

        // Step 6: Get subscription details
        const subscription = session.subscription as Stripe.Subscription;
        const plan = session.metadata?.plan || 'monthly';

        // Step 7: Check if already activated (prevent double-activation)
        const existingSubscription = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                isPremium: true,
                subscriptionId: true
            }
        });

        if (existingSubscription?.subscriptionId === subscription.id) {
            console.log('🟡 [Subscription Confirm] Subscription already activated');
            return NextResponse.json({
                success: true,
                message: 'Subscription already active',
                plan: plan,
                alreadyActivated: true,
            });
        }

        // Step 8: Activate premium subscription in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isPremium: true,
                subscriptionId: subscription.id,
                subscriptionStatus: 'active',
                subscriptionEndDate: new Date(subscription.current_period_end * 1000),
                subscriptionCreatedAt: new Date(),
                updatedAt: new Date()
            }
        });

        console.log(`✅ [Subscription Confirm] Subscription activated successfully for user ${user.id}`);

        return NextResponse.json({
            success: true,
            message: 'Subscription activated successfully',
            plan: plan,
            status: 'active',
        });

    } catch (error) {
        console.error('🔴 [Subscription Confirm] Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to confirm subscription',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
