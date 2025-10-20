/**
 * Automated Stripe Product Creation Script
 *
 * Creates all 5 token packages as Stripe products and updates the database
 * with the generated Price IDs.
 *
 * Usage:
 *   npx tsx scripts/create-stripe-products.ts
 *
 * Prerequisites:
 *   - STRIPE_SECRET_KEY in .env.local
 *   - Supabase credentials in .env.local
 *   - Token packages already seeded in database
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TokenPackage {
    id: string;
    tier: string;
    name: string;
    tokens: number;
    price_cents: number;
    discount_percentage: number;
    popular: boolean;
    best_value: boolean;
    description?: string;
}

/**
 * Token package definitions matching database seed
 */
const TOKEN_PACKAGES = [
    {
        tier: 'starter',
        name: 'Starter',
        tokens: 100,
        price_cents: 500,
        discount_percentage: 0,
        popular: false,
        best_value: false,
        description: 'Perfect for trying out AI features. Get started with 100 tokens.',
    },
    {
        tier: 'basic',
        name: 'Basic',
        tokens: 250,
        price_cents: 1000,
        discount_percentage: 20,
        popular: false,
        best_value: false,
        description: 'Great value! 250 tokens with 20% savings.',
    },
    {
        tier: 'pro',
        name: 'Pro',
        tokens: 600,
        price_cents: 2000,
        discount_percentage: 34,
        popular: true,
        best_value: false,
        description: 'Most popular! 600 tokens with 34% savings. Best for regular users.',
    },
    {
        tier: 'power',
        name: 'Power',
        tokens: 1500,
        price_cents: 4000,
        discount_percentage: 46,
        popular: false,
        best_value: false,
        description: 'Best value! 1500 tokens with 46% savings. Perfect for power users.',
    },
    {
        tier: 'enterprise',
        name: 'Enterprise',
        tokens: 5000,
        price_cents: 10000,
        discount_percentage: 50,
        popular: false,
        best_value: false,
        description: 'Ultimate pack! 5000 tokens with 50% savings. For serious professionals.',
    },
];

async function createStripeProduct(pkg: typeof TOKEN_PACKAGES[0]) {
    console.log(`\n📦 Creating Stripe product: ${pkg.name} (${pkg.tokens} tokens)`);

    try {
        // Create the product
        const product = await stripe.products.create({
            name: `${pkg.tokens} Tokens - ${pkg.name} Pack`,
            description: pkg.description,
            metadata: {
                package_tier: pkg.tier,
                tokens: pkg.tokens.toString(),
                discount_percentage: pkg.discount_percentage.toString(),
                popular: pkg.popular.toString(),
                best_value: pkg.best_value.toString(),
            },
        });

        console.log(`   ✅ Product created: ${product.id}`);

        // Create the price
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: pkg.price_cents,
            currency: 'usd',
            metadata: {
                package_tier: pkg.tier,
                tokens: pkg.tokens.toString(),
            },
        });

        console.log(`   ✅ Price created: ${price.id} ($${pkg.price_cents / 100})`);

        return {
            productId: product.id,
            priceId: price.id,
            tier: pkg.tier,
        };
    } catch (error: any) {
        console.error(`   ❌ Error creating product: ${error.message}`);
        throw error;
    }
}

async function updateDatabaseWithPriceId(tier: string, priceId: string) {
    console.log(`\n💾 Updating database for tier: ${tier}`);

    try {
        const { data, error } = await supabase
            .from('token_packages')
            .update({ stripe_price_id: priceId })
            .eq('tier', tier)
            .select();

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error(`No token package found for tier: ${tier}`);
        }

        console.log(`   ✅ Database updated: ${tier} → ${priceId}`);
        return data[0];
    } catch (error: any) {
        console.error(`   ❌ Error updating database: ${error.message}`);
        throw error;
    }
}

async function verifySetup() {
    console.log('\n\n🔍 Verifying setup...\n');

    try {
        // Check database
        const { data: packages, error } = await supabase
            .from('token_packages')
            .select('tier, name, tokens, price_cents, stripe_price_id')
            .order('sort_order');

        if (error) {
            throw error;
        }

        console.log('📊 Database Status:');
        console.log('─────────────────────────────────────────────────────────────');

        let allConfigured = true;

        for (const pkg of packages || []) {
            const hasPrice = !!pkg.stripe_price_id;
            const status = hasPrice ? '✅' : '❌';
            const priceDisplay = hasPrice ? pkg.stripe_price_id : 'NOT SET';

            console.log(`${status} ${pkg.tier.padEnd(12)} | ${pkg.tokens.toString().padEnd(5)} tokens | $${(pkg.price_cents / 100).toFixed(2).padEnd(6)} | ${priceDisplay}`);

            if (!hasPrice) {
                allConfigured = false;
            }
        }

        console.log('─────────────────────────────────────────────────────────────\n');

        if (allConfigured) {
            console.log('✅ All packages configured with Stripe Price IDs!\n');

            // Test Stripe API connectivity
            console.log('🔌 Testing Stripe API connectivity...');
            const prices = await stripe.prices.list({ limit: 5 });
            console.log(`   ✅ Connected! Found ${prices.data.length} prices in Stripe\n`);

            return true;
        } else {
            console.log('⚠️  Some packages missing Stripe Price IDs\n');
            return false;
        }
    } catch (error: any) {
        console.error(`❌ Verification failed: ${error.message}\n`);
        return false;
    }
}

async function main() {
    console.log('🚀 Stripe Product Setup Script\n');
    console.log('This script will:');
    console.log('  1. Create 5 Stripe products for token packages');
    console.log('  2. Create prices for each product');
    console.log('  3. Update database with Price IDs');
    console.log('  4. Verify the setup\n');

    // Verify environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ Error: STRIPE_SECRET_KEY not found in .env.local');
        process.exit(1);
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Error: Supabase credentials not found in .env.local');
        process.exit(1);
    }

    // Check if test mode
    const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
    console.log(`🔑 Stripe Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);

    if (!isTestMode) {
        console.log('\n⚠️  WARNING: You are using LIVE Stripe keys!');
        console.log('This will create real products that customers can purchase.');
        console.log('Press Ctrl+C to cancel, or Enter to continue...\n');

        // In a real script, you'd wait for user input here
        // For now, we'll just exit
        console.log('❌ Aborting for safety. Switch to test keys first.\n');
        process.exit(1);
    }

    console.log('\n─────────────────────────────────────────────────────────────\n');

    const results = [];

    // Create products and update database
    for (const pkg of TOKEN_PACKAGES) {
        try {
            const result = await createStripeProduct(pkg);
            await updateDatabaseWithPriceId(result.tier, result.priceId);
            results.push(result);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`\n❌ Failed to process package: ${pkg.tier}`);
            console.error('Stopping script. Fix errors and re-run.\n');
            process.exit(1);
        }
    }

    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('\n✅ All products created successfully!\n');

    // Verify setup
    const verified = await verifySetup();

    if (verified) {
        console.log('🎉 Setup complete! You can now test purchases.\n');
        console.log('Next steps:');
        console.log('  1. Start dev server: npm run dev');
        console.log('  2. Start webhook forwarding: stripe listen --forward-to localhost:3000/api/stripe/webhooks');
        console.log('  3. Test purchase: http://localhost:3000/tokens/buy');
        console.log('  4. Use test card: 4242 4242 4242 4242\n');
    } else {
        console.log('⚠️  Setup incomplete. Check errors above.\n');
        process.exit(1);
    }
}

// Run the script
main().catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
});
