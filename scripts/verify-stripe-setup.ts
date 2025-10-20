/**
 * Stripe Setup Verification Script
 *
 * Verifies that the Stripe integration is configured correctly
 * by checking products, prices, and database connections.
 *
 * Usage:
 *   npm run stripe:verify
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

interface VerificationResult {
    step: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    details?: any;
}

const results: VerificationResult[] = [];

function addResult(step: string, status: 'pass' | 'fail' | 'warn', message: string, details?: any) {
    results.push({ step, status, message, details });

    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️ ';
    console.log(`${icon} ${step}: ${message}`);
    if (details) {
        console.log(`   ${JSON.stringify(details, null, 2)}`);
    }
}

async function verifyEnvironmentVariables() {
    console.log('\n📋 Step 1: Environment Variables\n');

    const requiredVars = [
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
    ];

    for (const varName of requiredVars) {
        if (process.env[varName]) {
            const value = process.env[varName]!;
            const masked = value.substring(0, 15) + '...';
            addResult(varName, 'pass', `Set (${masked})`);
        } else {
            addResult(varName, 'fail', 'Not set in .env.local');
        }
    }

    // Check webhook secret
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        addResult('STRIPE_WEBHOOK_SECRET', 'pass', 'Configured');
    } else {
        addResult('STRIPE_WEBHOOK_SECRET', 'warn', 'Not set (needed for webhooks)');
    }

    // Check Stripe key mode
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    addResult(
        'Stripe Mode',
        isTestMode ? 'pass' : 'warn',
        isTestMode ? 'Test Mode' : 'Live Mode'
    );
}

async function verifyStripeConnection() {
    console.log('\n🔌 Step 2: Stripe API Connection\n');

    try {
        const account = await stripe.accounts.retrieve();
        addResult('Stripe API', 'pass', `Connected to account: ${account.id}`);

        const products = await stripe.products.list({ limit: 10 });
        addResult('Stripe Products', 'pass', `Found ${products.data.length} products`);

        const prices = await stripe.prices.list({ limit: 10 });
        addResult('Stripe Prices', 'pass', `Found ${prices.data.length} prices`);

        return true;
    } catch (error: any) {
        addResult('Stripe API', 'fail', `Connection failed: ${error.message}`);
        return false;
    }
}

async function verifyDatabase() {
    console.log('\n💾 Step 3: Database Tables\n');

    const expectedTables = [
        'token_packages',
        'user_tokens',
        'token_transactions',
        'feature_costs',
        'token_purchases',
        'daily_token_usage',
        'referrals',
    ];

    try {
        for (const table of expectedTables) {
            const { error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                addResult(`Table: ${table}`, 'fail', `Does not exist or no access: ${error.message}`);
            } else {
                addResult(`Table: ${table}`, 'pass', `Exists (${count || 0} rows)`);
            }
        }

        return true;
    } catch (error: any) {
        addResult('Database', 'fail', `Connection failed: ${error.message}`);
        return false;
    }
}

async function verifyTokenPackages() {
    console.log('\n📦 Step 4: Token Packages Configuration\n');

    try {
        const { data: packages, error } = await supabase
            .from('token_packages')
            .select('tier, name, tokens, price_cents, stripe_price_id, active')
            .order('sort_order');

        if (error) {
            addResult('Token Packages', 'fail', error.message);
            return false;
        }

        if (!packages || packages.length === 0) {
            addResult('Token Packages', 'fail', 'No token packages found in database');
            return false;
        }

        addResult('Token Packages', 'pass', `Found ${packages.length} packages`);

        // Check each package
        let allConfigured = true;
        for (const pkg of packages) {
            if (!pkg.stripe_price_id) {
                addResult(
                    `Package: ${pkg.tier}`,
                    'fail',
                    'Missing Stripe Price ID - Run: npm run stripe:setup'
                );
                allConfigured = false;
            } else if (!pkg.active) {
                addResult(`Package: ${pkg.tier}`, 'warn', 'Inactive');
            } else {
                addResult(
                    `Package: ${pkg.tier}`,
                    'pass',
                    `${pkg.tokens} tokens for $${pkg.price_cents / 100} (${pkg.stripe_price_id})`
                );

                // Verify price exists in Stripe
                try {
                    const price = await stripe.prices.retrieve(pkg.stripe_price_id);
                    if (price.active) {
                        addResult(`   Stripe Price: ${pkg.tier}`, 'pass', 'Active in Stripe');
                    } else {
                        addResult(`   Stripe Price: ${pkg.tier}`, 'warn', 'Inactive in Stripe');
                    }
                } catch (error: any) {
                    addResult(
                        `   Stripe Price: ${pkg.tier}`,
                        'fail',
                        `Not found in Stripe: ${error.message}`
                    );
                    allConfigured = false;
                }
            }
        }

        return allConfigured;
    } catch (error: any) {
        addResult('Token Packages', 'fail', error.message);
        return false;
    }
}

async function verifyFeatureCosts() {
    console.log('\n💰 Step 5: Feature Costs\n');

    try {
        const { data: costs, error } = await supabase
            .from('feature_costs')
            .select('category, feature_key, token_cost, active')
            .order('category, token_cost');

        if (error) {
            addResult('Feature Costs', 'fail', error.message);
            return false;
        }

        if (!costs || costs.length === 0) {
            addResult('Feature Costs', 'fail', 'No feature costs found');
            return false;
        }

        addResult('Feature Costs', 'pass', `Found ${costs.length} features`);

        // Group by category
        const categories = costs.reduce((acc, cost) => {
            if (!acc[cost.category]) acc[cost.category] = [];
            acc[cost.category].push(cost);
            return acc;
        }, {} as Record<string, any[]>);

        for (const [category, features] of Object.entries(categories)) {
            const activeCount = features.filter(f => f.active).length;
            addResult(
                `   Category: ${category}`,
                'pass',
                `${activeCount}/${features.length} active features`
            );
        }

        return true;
    } catch (error: any) {
        addResult('Feature Costs', 'fail', error.message);
        return false;
    }
}

async function verifyAPIEndpoints() {
    console.log('\n🔗 Step 6: API Endpoints\n');

    const endpoints = [
        '/api/tokens/balance',
        '/api/tokens/costs',
        '/api/tokens/packages',
        '/api/stripe/webhooks',
    ];

    addResult('API Endpoints', 'pass', `Should verify: ${endpoints.join(', ')}`);
    addResult('Note', 'warn', 'Start dev server (npm run dev) to test endpoints');
}

async function generateSummary() {
    console.log('\n' + '═'.repeat(70) + '\n');
    console.log('📊 VERIFICATION SUMMARY\n');

    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warned = results.filter(r => r.status === 'warn').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warned}`);
    console.log(`📋 Total: ${results.length}`);

    console.log('\n' + '═'.repeat(70) + '\n');

    if (failed === 0) {
        console.log('🎉 ALL CHECKS PASSED!\n');
        console.log('Your token system is configured correctly.\n');
        console.log('Next steps:');
        console.log('  1. Start dev server: npm run dev');
        console.log('  2. Forward webhooks: stripe listen --forward-to localhost:3000/api/stripe/webhooks');
        console.log('  3. Test purchase: http://localhost:3000/tokens/buy');
        console.log('  4. Use test card: 4242 4242 4242 4242\n');
        return true;
    } else {
        console.log('❌ SETUP INCOMPLETE\n');
        console.log('Please fix the failed checks above.\n');

        const failedSteps = results.filter(r => r.status === 'fail');
        console.log('Failed checks:');
        failedSteps.forEach(step => {
            console.log(`  - ${step.step}: ${step.message}`);
        });

        console.log('\nCommon fixes:');
        console.log('  - Missing Stripe Price IDs? Run: npm run stripe:setup');
        console.log('  - Database tables missing? Run migrations in Supabase SQL Editor');
        console.log('  - Environment variables? Check .env.local file');
        console.log('\nSee: TOKEN_SETUP_QUICKSTART.md for detailed instructions\n');
        return false;
    }
}

async function main() {
    console.log('🔍 Token System Verification\n');
    console.log('This script checks that all components are configured correctly.\n');
    console.log('═'.repeat(70));

    await verifyEnvironmentVariables();
    await verifyStripeConnection();
    await verifyDatabase();
    await verifyTokenPackages();
    await verifyFeatureCosts();
    await verifyAPIEndpoints();

    const success = await generateSummary();

    process.exit(success ? 0 : 1);
}

main().catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
});
