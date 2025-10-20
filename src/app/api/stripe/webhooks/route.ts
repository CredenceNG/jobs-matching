/**
 * Stripe Webhooks Handler
 * 
 * Handles Stripe webhook events for subscription management.
 * Processes payment confirmations, subscription updates, and cancellations.
 * 
 * @description Stripe webhook endpoint for subscription events
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/stripe/config';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const headersList = headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            console.error('Missing stripe-signature header');
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // Verify webhook signature
        const event = verifyWebhookSignature(body, signature);
        if (!event) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        console.log('Received Stripe webhook:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event);
                break;

            case 'customer.subscription.trial_will_end':
                await handleTrialWillEnd(event);
                break;

            // Token purchase events
            case 'payment_intent.succeeded':
                await handleTokenPurchaseSucceeded(event);
                break;

            case 'payment_intent.payment_failed':
                await handleTokenPurchaseFailed(event);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

// =============================================================================
// WEBHOOK HANDLERS
// =============================================================================

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(event: any) {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    const status = subscription.status;
    
    console.log('Subscription created:', subscriptionId, 'Status:', status);

    try {
        // Find user by Stripe customer ID
        const user = await prisma.user.findUnique({
            where: { stripeCustomerId: customerId },
            select: { id: true },
        });

        if (!user) {
            console.error('User not found for customer:', customerId);
            return;
        }

        // Update user subscription status
        if (status === 'active' || status === 'trialing') {
            const subscriptionEndDate = new Date(subscription.current_period_end * 1000);

            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionStatus: 'premium',
                        subscriptionId: subscriptionId,
                        subscriptionExpiresAt: subscriptionEndDate,
                        updatedAt: new Date(),
                    },
                });
                console.log('User subscription updated for user:', user.id);
            } catch (updateError) {
                console.error('Error updating user subscription:', updateError);
            }
        }

    } catch (error) {
        console.error('Error handling subscription created:', error);
    }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(event: any) {
    const subscription = event.data.object;
    const subscriptionId = subscription.id;
    const status = subscription.status;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;

    console.log('Subscription updated:', subscriptionId, 'Status:', status);

    try {
        // Find user by subscription ID
        const user = await prisma.user.findFirst({
            where: { subscriptionId: subscriptionId },
            select: { id: true },
        });

        if (!user) {
            console.error('User not found for subscription:', subscriptionId);
            return;
        }

        let subscriptionStatus = 'free';
        let subscriptionExpiresAt: Date | null = null;

        if (status === 'active') {
            subscriptionStatus = cancelAtPeriodEnd ? 'cancelled' : 'premium';
            subscriptionExpiresAt = new Date(subscription.current_period_end * 1000);
        } else if (status === 'trialing') {
            subscriptionStatus = 'trial';
            subscriptionExpiresAt = new Date(subscription.trial_end * 1000);
        } else if (status === 'past_due') {
            subscriptionStatus = 'premium'; // Keep premium access during grace period
            subscriptionExpiresAt = new Date(subscription.current_period_end * 1000);
        } else {
            // cancelled, incomplete, incomplete_expired, unpaid
            subscriptionStatus = 'free';
        }

        // Update user subscription
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionStatus: subscriptionStatus,
                    subscriptionExpiresAt: subscriptionExpiresAt,
                    updatedAt: new Date(),
                },
            });
            console.log('Subscription status updated for user:', user.id);
        } catch (updateError) {
            console.error('Error updating subscription status:', updateError);
        }

    } catch (error) {
        console.error('Error handling subscription updated:', error);
    }
}

/**
 * Handle subscription deleted/cancelled event
 */
async function handleSubscriptionDeleted(event: any) {
    const subscription = event.data.object;
    const subscriptionId = subscription.id;

    console.log('Subscription deleted:', subscriptionId);

    try {
        // Find and update user
        try {
            await prisma.user.updateMany({
                where: { subscriptionId: subscriptionId },
                data: {
                    subscriptionStatus: 'free',
                    subscriptionExpiresAt: null,
                    updatedAt: new Date(),
                },
            });
            console.log('User downgraded to free after subscription deletion');
        } catch (updateError) {
            console.error('Error updating user after subscription deletion:', updateError);
        }

    } catch (error) {
        console.error('Error handling subscription deleted:', error);
    }
}

/**
 * Handle successful payment event
 */
async function handlePaymentSucceeded(event: any) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    const amountPaid = invoice.amount_paid;

    console.log('Payment succeeded for subscription:', subscriptionId, 'Amount:', amountPaid);

    try {
        // Find user by subscription ID
        const user = await prisma.user.findFirst({
            where: { subscriptionId: subscriptionId },
            select: { id: true },
        });

        if (!user) {
            console.error('User not found for subscription:', subscriptionId);
            return;
        }

        // Log the payment
        try {
            await prisma.aiUsage.create({
                data: {
                    userId: user.id,
                    requestType: 'payment_received',
                    costUsd: amountPaid / 100,
                    createdAt: new Date(),
                    metadata: {
                        subscription_id: subscriptionId,
                        invoice_id: invoice.id
                    },
                },
            });
        } catch (logError) {
            console.error('Error logging payment:', logError);
        }

        // Ensure user has premium access
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionStatus: 'premium',
                    updatedAt: new Date(),
                },
            });
        } catch (updateError) {
            console.error('Error updating user after payment:', updateError);
        }

    } catch (error) {
        console.error('Error handling payment succeeded:', error);
    }
}

/**
 * Handle failed payment event
 */
async function handlePaymentFailed(event: any) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    console.log('Payment failed for subscription:', subscriptionId);

    try {
        // Find user by subscription ID
        const user = await prisma.user.findFirst({
            where: { subscriptionId: subscriptionId },
            select: { id: true, email: true },
        });

        if (!user) {
            console.error('User not found for subscription:', subscriptionId);
            return;
        }

        // Log the failed payment
        try {
            await prisma.aiUsage.create({
                data: {
                    userId: user.id,
                    requestType: 'payment_failed',
                    costUsd: 0,
                    createdAt: new Date(),
                    metadata: {
                        subscription_id: subscriptionId,
                        invoice_id: invoice.id,
                        failure_reason: 'Payment failed'
                    },
                },
            });
        } catch (logError) {
            console.error('Error logging payment failure:', logError);
        }

        // TODO: Send notification email to user about failed payment
        console.log('Payment failed for user:', user.email);

    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
}

/**
 * Handle trial ending soon event
 */
async function handleTrialWillEnd(event: any) {
    const subscription = event.data.object;
    const subscriptionId = subscription.id;

    console.log('Trial will end for subscription:', subscriptionId);

    try {
        // Find user by subscription ID
        const user = await prisma.user.findFirst({
            where: { subscriptionId: subscriptionId },
            select: { id: true, email: true },
        });

        if (!user) {
            console.error('User not found for subscription:', subscriptionId);
            return;
        }

        // TODO: Send notification email about trial ending
        console.log('Trial ending soon for user:', user.email);

    } catch (error) {
        console.error('Error handling trial will end:', error);
    }
}

// Only allow POST method
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}

/**
 * Handle token purchase payment succeeded
 */
async function handleTokenPurchaseSucceeded(event: any) {
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata.user_id;
    const tokens = parseInt(paymentIntent.metadata.tokens || '0');
    const packageId = paymentIntent.metadata.package_id;

    console.log('Token purchase succeeded:', paymentIntent.id, 'Tokens:', tokens);

    if (!userId || !tokens) {
        console.error('Missing user_id or tokens in payment metadata');
        return;
    }

    try {
        // Credit tokens to user
        const currentTokens = await prisma.userToken.findUnique({
            where: { userId: userId },
            select: { balance: true, lifetimePurchased: true },
        });

        if (!currentTokens) {
            // Initialize if doesn't exist
            await prisma.userToken.create({
                data: {
                    userId: userId,
                    balance: tokens,
                    lifetimePurchased: tokens,
                },
            });
        } else {
            // Update existing balance
            await prisma.userToken.update({
                where: { userId: userId },
                data: {
                    balance: currentTokens.balance + tokens,
                    lifetimePurchased: currentTokens.lifetimePurchased + tokens,
                },
            });
        }

        // Log transaction
        await prisma.tokenTransaction.create({
            data: {
                userId: userId,
                amount: tokens,
                type: 'purchase',
                balanceBefore: currentTokens?.balance || 0,
                balanceAfter: (currentTokens?.balance || 0) + tokens,
                description: `Purchased ${tokens} tokens`,
                metadata: {
                    payment_intent_id: paymentIntent.id,
                    package_id: packageId,
                    amount_cents: paymentIntent.amount
                },
            },
        });

        // Update purchase record
        await prisma.tokenPurchase.updateMany({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: {
                status: 'completed',
                stripeChargeId: paymentIntent.latest_charge,
                completedAt: new Date(),
            },
        });

        console.log(`Successfully credited ${tokens} tokens to user ${userId}`);
    } catch (error) {
        console.error('Error crediting tokens:', error);
        throw error;
    }
}

/**
 * Handle token purchase payment failed
 */
async function handleTokenPurchaseFailed(event: any) {
    const paymentIntent = event.data.object;

    console.log('Token purchase failed:', paymentIntent.id);

    try {
        // Update purchase record
        await prisma.tokenPurchase.updateMany({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: {
                status: 'failed',
            },
        });
    } catch (error) {
        console.error('Error updating failed purchase:', error);
    }
}

export async function PUT() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function DELETE() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}