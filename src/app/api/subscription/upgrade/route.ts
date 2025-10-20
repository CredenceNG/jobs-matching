/**
 * Subscription Upgrade API Endpoint
 * 
 * Handles premium subscription upgrades and payment processing.
 * Integrates with payment providers and updates user subscription status.
 * 
 * @description API endpoint for premium subscription upgrades
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';


interface UpgradeRequest {
    plan: 'premium' | 'free';
    paymentMethodId?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json() as UpgradeRequest;
        const { plan } = body;

        if (!plan || !['premium', 'free'].includes(plan)) {
            return NextResponse.json(
                { success: false, error: 'Invalid plan specified' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Get current user profile
        const { data: currentProfile, error: profileError } = await supabase
            .from('users')
            .select('subscription_status, subscription_expires_at')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching user profile:', profileError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch user profile' },
                { status: 500 }
            );
        }

        // Check if user is already on the requested plan
        if (currentProfile.subscription_status === plan) {
            return NextResponse.json({
                success: true,
                message: `Already on ${plan} plan`,
                alreadySubscribed: true
            });
        }

        if (plan === 'premium') {
            // Handle premium upgrade
            
            // TODO: Integrate with your payment processor (Stripe, PayPal, etc.)
            // For now, we'll simulate successful payment processing
            
            // Example Stripe integration:
            /*
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: 2900, // $29.00 in cents
                    currency: 'usd',
                    customer: user.stripe_customer_id,
                    payment_method: body.paymentMethodId,
                    confirmation_method: 'manual',
                    confirm: true,
                });

                if (paymentIntent.status !== 'succeeded') {
                    return NextResponse.json(
                        { success: false, error: 'Payment failed' },
                        { status: 400 }
                    );
                }
            } catch (paymentError) {
                console.error('Payment processing error:', paymentError);
                return NextResponse.json(
                    { success: false, error: 'Payment processing failed' },
                    { status: 400 }
                );
            }
            */

            // For demo purposes, we'll simulate successful payment
            const subscriptionExpiresAt = new Date();
            subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1); // 1 month from now

            // Update user subscription status
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    subscription_status: 'premium',
                    subscription_expires_at: subscriptionExpiresAt.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error updating subscription:', updateError);
                return NextResponse.json(
                    { success: false, error: 'Failed to update subscription' },
                    { status: 500 }
                );
            }

            // Log the subscription change
            const { error: logError } = await supabase
                .from('ai_usage')
                .insert({
                    user_id: user.id,
                    request_type: 'subscription_upgrade',
                    cost_usd: 29.00,
                    created_at: new Date().toISOString()
                });

            if (logError) {
                console.error('Error logging subscription change:', logError);
                // Don't fail the request if logging fails
            }

            return NextResponse.json({
                success: true,
                message: 'Successfully upgraded to Premium!',
                subscription: {
                    status: 'premium',
                    expiresAt: subscriptionExpiresAt.toISOString()
                }
            });

        } else if (plan === 'free') {
            // Handle downgrade to free plan
            
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    subscription_status: 'free',
                    subscription_expires_at: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error downgrading subscription:', updateError);
                return NextResponse.json(
                    { success: false, error: 'Failed to downgrade subscription' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Successfully downgraded to Free plan',
                subscription: {
                    status: 'free',
                    expiresAt: null
                }
            });
        }

    } catch (error) {
        console.error('Subscription upgrade error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Get current subscription status
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Get current user subscription info
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('subscription_status, subscription_expires_at, created_at')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching subscription status:', profileError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch subscription status' },
                { status: 500 }
            );
        }

        // Check if subscription is expired
        const now = new Date();
        const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
        const isExpired = expiresAt && expiresAt < now;

        let actualStatus = profile.subscription_status;
        if (isExpired && actualStatus === 'premium') {
            // Auto-downgrade expired premium subscriptions
            actualStatus = 'free';
            
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    subscription_status: 'free',
                    subscription_expires_at: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error auto-downgrading expired subscription:', updateError);
            }
        }

        return NextResponse.json({
            success: true,
            subscription: {
                status: actualStatus || 'free',
                expiresAt: isExpired ? null : profile.subscription_expires_at,
                createdAt: profile.created_at,
                isExpired
            }
        });

    } catch (error) {
        console.error('Get subscription status error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}