/**
 * POST /api/subscriptions/create-checkout
 *
 * Creates a Stripe Checkout Session for subscription purchase
 *
 * @requires authentication
 * @param {string} plan - Subscription plan: 'monthly' or 'annual'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
    console.log('🔵 [Subscription Checkout] Starting checkout session creation...');

    try {
        // Step 1: Authenticate user
        const user = await getSession();

        if (!user) {
            console.error('🔴 [Subscription Checkout] Authentication error: No session');
            return NextResponse.json(
                { error: 'Unauthorized - Please log in to subscribe' },
                { status: 401 }
            );
        }

        console.log('✅ [Subscription Checkout] User authenticated:', user.id);

        // Step 2: Get plan from request
        const { plan } = await request.json();

        if (!plan || !['monthly', 'annual'].includes(plan)) {
            return NextResponse.json(
                { error: 'Invalid plan. Must be "monthly" or "annual"' },
                { status: 400 }
            );
        }

        console.log(`🔵 [Subscription Checkout] Creating ${plan} subscription for user ${user.id}`);

        // Step 3: Get or create Stripe customer
        let customerId: string | undefined;

        // Create new Stripe customer
        // TODO: Check for existing customer once Prisma client is regenerated
        const customer = await stripe.customers.create({
            email: user.email!,
            metadata: {
                user_id: user.id,
            },
        });
        customerId = customer.id;

        // TODO: Save customer ID to database once stripeCustomerId field is available
        console.log('✅ [Subscription Checkout] Created/Using Stripe customer:', customerId);

        // Step 4: Create Stripe Checkout Session for subscription
        const priceId = plan === 'monthly'
            ? process.env.STRIPE_MONTHLY_PRICE_ID
            : process.env.STRIPE_ANNUAL_PRICE_ID;

        if (!priceId) {
            console.error('🔴 [Subscription Checkout] Missing price ID for plan:', plan);
            return NextResponse.json(
                { error: 'Subscription plan not configured' },
                { status: 500 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${request.headers.get('origin')}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/tokens/buy`,
            metadata: {
                user_id: user.id,
                plan: plan,
            },
            subscription_data: {
                metadata: {
                    user_id: user.id,
                    plan: plan,
                },
            },
        });

        console.log('✅ [Subscription Checkout] Checkout session created:', session.id);

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });

    } catch (error) {
        console.error('🔴 [Subscription Checkout] Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create checkout session',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
