/**
 * Stripe Create Subscription API
 * 
 * Handles Stripe subscription creation for premium upgrades.
 * Creates customers, attaches payment methods, and manages subscriptions.
 * 
 * @description API endpoint for Stripe subscription creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

import { 
    getStripeServer, 
    createStripeCustomer, 
    createSubscription,
    getPlanConfig 
} from '@/lib/stripe/config';

interface CreateSubscriptionRequest {
    priceId: string;
    paymentMethodId: string;
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json() as CreateSubscriptionRequest;
        const { priceId, paymentMethodId } = body;

        if (!priceId || !paymentMethodId) {
            return NextResponse.json(
                { error: 'Missing priceId or paymentMethodId' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();
        const stripe = getStripeServer();

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('full_name, stripe_customer_id, subscription_status')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching user profile:', profileError);
            return NextResponse.json(
                { error: 'Failed to fetch user profile' },
                { status: 500 }
            );
        }

        // Check if user is already premium
        if (profile.subscription_status === 'premium') {
            return NextResponse.json(
                { error: 'User is already subscribed to premium' },
                { status: 400 }
            );
        }

        let customerId = profile.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            try {
                const customer = await createStripeCustomer(
                    user.email || '',
                    profile.full_name || 'JobAI User'
                );
                customerId = customer.id;

                // Update user with Stripe customer ID
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', user.id);

                if (updateError) {
                    console.error('Error updating user with customer ID:', updateError);
                    // Continue anyway, we have the customer ID
                }
            } catch (customerError) {
                console.error('Error creating Stripe customer:', customerError);
                return NextResponse.json(
                    { error: 'Failed to create customer account' },
                    { status: 500 }
                );
            }
        }

        try {
            // Attach payment method to customer
            await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });

            // Set as default payment method
            await stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });

            // Create subscription
            const subscription = await createSubscription(customerId, priceId);

            let subscriptionStatus = subscription.status;
            let clientSecret: string | null = null;

            // Handle different subscription statuses
            if (subscription.status === 'incomplete') {
                // Payment requires additional action (e.g., 3D Secure)
                const invoice = subscription.latest_invoice as any;
                if (invoice?.payment_intent) {
                    clientSecret = invoice.payment_intent.client_secret;
                    subscriptionStatus = invoice.payment_intent.status;
                }
            } else if (subscription.status === 'active') {
                // Subscription is active, update user in database
                const subscriptionEndDate = new Date(subscription.current_period_end * 1000);

                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        subscription_status: 'premium',
                        subscription_id: subscription.id,
                        subscription_expires_at: subscriptionEndDate.toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);

                if (updateError) {
                    console.error('Error updating user subscription status:', updateError);
                    // Don't fail the request, subscription was created successfully
                }

                // Log the subscription creation
                const { error: logError } = await supabase
                    .from('ai_usage')
                    .insert({
                        user_id: user.id,
                        request_type: 'subscription_created',
                        cost_usd: (subscription.items.data[0]?.price?.unit_amount || 0) / 100,
                        created_at: new Date().toISOString(),
                        metadata: { subscription_id: subscription.id }
                    });

                if (logError) {
                    console.error('Error logging subscription creation:', logError);
                }
            }

            return NextResponse.json({
                subscriptionId: subscription.id,
                clientSecret,
                status: subscriptionStatus,
                message: 'Subscription created successfully'
            });

        } catch (subscriptionError: any) {
            console.error('Error creating subscription:', subscriptionError);

            // Handle specific Stripe errors
            if (subscriptionError.type === 'StripeCardError') {
                return NextResponse.json(
                    { error: subscriptionError.message },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: 'Failed to create subscription' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Create subscription error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Get subscription setup intent for updating payment methods
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createServerSupabaseClient();
        const stripe = getStripeServer();

        // Get user's Stripe customer ID
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No customer account found' },
                { status: 400 }
            );
        }

        // Create setup intent for future payments
        const setupIntent = await stripe.setupIntents.create({
            customer: profile.stripe_customer_id,
            usage: 'off_session',
        });

        return NextResponse.json({
            clientSecret: setupIntent.client_secret,
        });

    } catch (error) {
        console.error('Setup intent error:', error);
        return NextResponse.json(
            { error: 'Failed to create setup intent' },
            { status: 500 }
        );
    }
}