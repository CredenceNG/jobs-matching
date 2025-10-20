/**
 * POST /api/tokens/webhook
 *
 * Stripe webhook handler for token purchases
 * Listens for payment_intent.succeeded events and credits tokens
 *
 * @description Processes successful payments and updates token balances
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { TokenService } from '@/lib/tokens/token-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    console.log('🔵 [Stripe Webhook] Received webhook request...');

    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            console.error('🔴 [Stripe Webhook] No signature provided');
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        let event: Stripe.Event;

        // Verify webhook signature
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error('🔴 [Stripe Webhook] Signature verification failed:', err.message);
            return NextResponse.json(
                { error: `Webhook signature verification failed: ${err.message}` },
                { status: 400 }
            );
        }

        console.log(`✅ [Stripe Webhook] Verified event type: ${event.type}`);

        // Handle payment_intent.succeeded event
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            console.log(`🔵 [Stripe Webhook] Processing payment: ${paymentIntent.id}`);
            console.log(`💰 [Stripe Webhook] Amount: ${paymentIntent.amount} cents`);

            // Extract metadata
            const userId = paymentIntent.metadata.user_id;
            const packageId = paymentIntent.metadata.package_id;
            const tokensAmount = parseInt(paymentIntent.metadata.tokens || '0');

            if (!userId || !packageId || !tokensAmount) {
                console.error('🔴 [Stripe Webhook] Missing required metadata', {
                    userId,
                    packageId,
                    tokensAmount
                });
                return NextResponse.json(
                    { error: 'Missing required metadata' },
                    { status: 400 }
                );
            }

            console.log(`✅ [Stripe Webhook] Crediting ${tokensAmount} tokens to user ${userId}`);

            // Credit tokens to user account
            try {
                await TokenService.addTokens(
                    userId,
                    tokensAmount,
                    'purchase',
                    {
                        package_id: packageId,
                        payment_intent_id: paymentIntent.id,
                        amount_cents: paymentIntent.amount,
                        stripe_charge_id: paymentIntent.charges.data[0]?.id
                    }
                );

                console.log(`✅ [Stripe Webhook] Tokens credited successfully`);
            } catch (error: any) {
                console.error('🔴 [Stripe Webhook] Failed to credit tokens:', error);
                return NextResponse.json(
                    { error: 'Failed to credit tokens', details: error.message },
                    { status: 500 }
                );
            }
        }

        // Return 200 to acknowledge receipt
        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('🔴 [Stripe Webhook] Fatal error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed', details: error.message },
            { status: 500 }
        );
    }
}
