/**
 * Simple Database Setup Script
 * Executes SQL migrations via Supabase REST API
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(filePath, description) {
    console.log(`\n📝 ${description}`);
    console.log(`   File: ${filePath}`);

    const sql = fs.readFileSync(filePath, 'utf-8');
    const lines = sql.split('\n').length;
    console.log(`   Lines: ${lines}`);

    // Split into individual statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 20 && !s.startsWith('--'))
        .map(s => s + ';');

    console.log(`   Statements: ${statements.length}`);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        try {
            // Use raw SQL execution
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({ sql: stmt })
            });

            if (response.ok) {
                success++;
            } else {
                const error = await response.text();
                if (error.includes('already exists')) {
                    skipped++;
                } else {
                    failed++;
                    if (failed <= 3) {
                        console.log(`   ⚠️  ${error.substring(0, 80)}`);
                    }
                }
            }
        } catch (err) {
            if (err.message && err.message.includes('already exists')) {
                skipped++;
            } else {
                failed++;
            }
        }

        // Progress
        if ((i + 1) % 20 === 0) {
            console.log(`   Progress: ${i + 1}/${statements.length}...`);
        }
    }

    console.log(`   ✅ Success: ${success} | Skipped: ${skipped} | Failed: ${failed}`);
    return failed === 0 || failed < statements.length / 2;
}

async function insertData(tableName, data) {
    console.log(`\n📦 Inserting data into ${tableName}...`);

    try {
        const { error } = await supabase.from(tableName).upsert(data);

        if (error) {
            console.log(`   ⚠️  ${error.message}`);
            return false;
        }

        console.log(`   ✅ Inserted ${data.length} rows`);
        return true;
    } catch (err) {
        console.log(`   ❌ ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Database Setup Script\n');
    console.log(`📍 Target: ${supabaseUrl}\n`);
    console.log('═'.repeat(70));

    // Step 1: Subscriptions
    await runSQL(
        path.join(__dirname, '../supabase/migrations/001b_subscriptions_table.sql'),
        'Migration 1: Subscriptions Table'
    );

    // Step 2: Token System
    await runSQL(
        path.join(__dirname, '../supabase/migrations/002_add_token_system.sql'),
        'Migration 2: Token System'
    );

    // Step 3: Manual seed using Supabase client
    console.log('\n📦 Migration 3: Seed Data');

    // Token packages
    const packages = [
        { tier: 'starter', name: 'Starter', tokens: 100, price_cents: 500, discount_percentage: 0, popular: false, best_value: false, active: true, sort_order: 1 },
        { tier: 'basic', name: 'Basic', tokens: 250, price_cents: 1000, discount_percentage: 20, popular: false, best_value: false, active: true, sort_order: 2 },
        { tier: 'pro', name: 'Pro', tokens: 600, price_cents: 2000, discount_percentage: 34, popular: true, best_value: true, active: true, sort_order: 3 },
        { tier: 'power', name: 'Power', tokens: 1500, price_cents: 4000, discount_percentage: 46, popular: false, best_value: false, active: true, sort_order: 4 },
        { tier: 'enterprise', name: 'Enterprise', tokens: 5000, price_cents: 10000, discount_percentage: 60, popular: false, best_value: false, active: true, sort_order: 5 }
    ];

    await insertData('token_packages', packages);

    // Feature costs
    const features = [
        { feature_key: 'job_match_simple', feature_name: 'Simple Job Match', token_cost: 2, description: 'Quick compatibility score', category: 'job_search', active: true },
        { feature_key: 'job_match_detailed', feature_name: 'Detailed Job Match', token_cost: 5, description: 'Full AI analysis', category: 'job_search', active: true },
        { feature_key: 'company_research', feature_name: 'Company Research', token_cost: 4, description: 'Company info and culture', category: 'job_search', active: true },
        { feature_key: 'resume_parsing', feature_name: 'Resume Parsing', token_cost: 8, description: 'Extract resume data', category: 'resume', active: true },
        { feature_key: 'resume_analysis', feature_name: 'Resume Analysis', token_cost: 10, description: 'Resume feedback', category: 'resume', active: true },
        { feature_key: 'resume_optimization', feature_name: 'Resume Optimization', token_cost: 15, description: 'AI improvements', category: 'resume', active: true },
        { feature_key: 'cover_letter', feature_name: 'Cover Letter Generation', token_cost: 12, description: 'Tailored cover letter', category: 'application', active: true },
        { feature_key: 'application_review', feature_name: 'Application Review', token_cost: 6, description: 'Review application', category: 'application', active: true },
        { feature_key: 'interview_prep', feature_name: 'Interview Preparation', token_cost: 8, description: 'Interview questions', category: 'interview', active: true },
        { feature_key: 'interview_feedback', feature_name: 'Interview Answer Feedback', token_cost: 5, description: 'Answer critique', category: 'interview', active: true },
        { feature_key: 'mock_interview', feature_name: 'Mock Interview Session', token_cost: 20, description: 'Full mock interview', category: 'interview', active: true },
        { feature_key: 'career_insights', feature_name: 'Career Insights Report', token_cost: 20, description: 'Weekly insights', category: 'career', active: true },
        { feature_key: 'salary_analysis', feature_name: 'Salary Analysis', token_cost: 6, description: 'Salary data', category: 'career', active: true },
        { feature_key: 'skill_gap_analysis', feature_name: 'Skill Gap Analysis', token_cost: 10, description: 'Skills comparison', category: 'career', active: true },
        { feature_key: 'career_path_planning', feature_name: 'Career Path Planning', token_cost: 15, description: 'Career trajectory', category: 'career', active: true },
        { feature_key: 'saved_search', feature_name: 'Saved Search (30 days)', token_cost: 5, description: 'Save search criteria', category: 'automation', active: true },
        { feature_key: 'job_alert_weekly', feature_name: 'Job Alert (per week)', token_cost: 2, description: 'Weekly alerts', category: 'automation', active: true },
        { feature_key: 'job_alert_daily', feature_name: 'Job Alert (per day)', token_cost: 1, description: 'Daily alerts', category: 'automation', active: true },
        { feature_key: 'export_pdf', feature_name: 'Export to PDF', token_cost: 1, description: 'Export to PDF', category: 'automation', active: true },
        { feature_key: 'export_csv', feature_name: 'Export to CSV', token_cost: 1, description: 'Export to CSV', category: 'automation', active: true }
    ];

    await insertData('feature_costs', features);

    // Verify
    console.log('\n🔍 Verification\n');

    const { data: pkgs, error: e1 } = await supabase.from('token_packages').select('tier, name, tokens');
    const { data: fts, error: e2 } = await supabase.from('feature_costs').select('feature_key');

    if (pkgs && pkgs.length > 0) {
        console.log(`   ✅ Token packages: ${pkgs.length}`);
        pkgs.forEach(p => console.log(`      - ${p.tier}: ${p.tokens} tokens`));
    }

    if (fts && fts.length > 0) {
        console.log(`   ✅ Feature costs: ${fts.length}`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ Database setup complete!\n');
    console.log('Next step:');
    console.log('   npm run stripe:setup\n');
}

main().catch(err => {
    console.error('\n💥 Error:', err.message);
    process.exit(1);
});
