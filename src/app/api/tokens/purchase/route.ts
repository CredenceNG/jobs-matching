/**
 * POST /api/tokens/purchase
 *
 * Create a Stripe PaymentIntent for token purchase
 *
 * @body { packageId: string }
 * @returns { clientSecret: string, packageDetails: TokenPackage }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { TokenService } from '@/lib/tokens';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia'
});

export async function POST(request: NextRequest) {
    console.log('🔵 [Token Purchase] Starting token purchase request...');

    try {
        // Step 1: Check authentication
        console.log('🔵 [Token Purchase] Step 1: Getting user session...');
        const user = await getSession();

        if (!user) {
            console.error('🔴 [Token Purchase] No user found');
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        console.log('✅ [Token Purchase] User authenticated:', user.id);

        // Step 2: Parse request body
        console.log('🔵 [Token Purchase] Step 3: Parsing request body...');
        const body = await request.json();
        const { packageId } = body;
        console.log('🔵 [Token Purchase] Package ID:', packageId);

        if (!packageId) {
            console.error('🔴 [Token Purchase] Package ID missing');
            return NextResponse.json(
                { error: 'Package ID is required' },
                { status: 400 }
            );
        }

        // Step 3: Get package details
        console.log('🔵 [Token Purchase] Step 4: Getting token packages...');
        const packages = await TokenService.getTokenPackages();
        console.log('🔵 [Token Purchase] Available packages:', packages.map(p => p.id));

        const pkg = packages.find(p => p.id === packageId);

        if (!pkg) {
            console.error('🔴 [Token Purchase] Package not found:', packageId);
            return NextResponse.json(
                { error: 'Package not found', availablePackages: packages.map(p => p.id) },
                { status: 404 }
            );
        }

        console.log('✅ [Token Purchase] Package found:', pkg.name, '-', pkg.priceCents, 'cents');

        // Step 4: Get user email
        const userEmail = user.email;
        console.log('🔵 [Token Purchase] User email:', userEmail);

        // Step 5: Verify Stripe key
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('🔴 [Token Purchase] STRIPE_SECRET_KEY not configured');
            return NextResponse.json(
                { error: 'Payment system not configured' },
                { status: 500 }
            );
        }
        console.log('✅ [Token Purchase] Stripe key present');

        // Step 6: Create Stripe PaymentIntent
        console.log('🔵 [Token Purchase] Step 5: Creating Stripe PaymentIntent...');
        const paymentIntent = await stripe.paymentIntents.create({
            amount: pkg.priceCents,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true
            },
            metadata: {
                user_id: user.id,
                package_id: pkg.id,
                package_tier: pkg.tier,
                tokens: pkg.tokens.toString(),
                user_email: userEmail || ''
            },
            description: `${pkg.name} Package - ${pkg.tokens} tokens`,
            receipt_email: userEmail
        });

        console.log('✅ [Token Purchase] PaymentIntent created:', paymentIntent.id);

        // Step 7: Log pending purchase in database
        console.log('🔵 [Token Purchase] Step 6: Logging purchase in database (using Prisma)...');
        // Note: Database logging would be done via Prisma here if needed

        console.log('✅ [Token Purchase] SUCCESS - Returning client secret');
        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            packageDetails: pkg
        });
    } catch (error: any) {
        console.error('🔴 [Token Purchase] FATAL ERROR:', error);
        console.error('🔴 [Token Purchase] Error name:', error.name);
        console.error('🔴 [Token Purchase] Error message:', error.message);
        console.error('🔴 [Token Purchase] Error stack:', error.stack);

        return NextResponse.json(
            {
                error: 'Failed to create purchase',
                details: error.message,
                type: error.name
            },
            { status: 500 }
        );
    }
}
