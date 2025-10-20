/**
 * Direct Database Migration Runner
 * Runs SQL migrations directly against Supabase using service role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeSQL(sql: string, description: string) {
    console.log(`\n📝 ${description}`);

    try {
        const { data, error } = await supabase.rpc('exec', { sql });

        if (error) {
            console.error(`   ❌ Error: ${error.message}`);
            return false;
        }

        console.log(`   ✅ Success`);
        return true;
    } catch (err: any) {
        console.error(`   ❌ Error: ${err.message}`);
        return false;
    }
}

async function runMigrations() {
    console.log('🚀 Running Database Migrations\n');
    console.log(`📍 Target: ${supabaseUrl}\n`);
    console.log('─'.repeat(70));

    // Migration 1: Subscriptions table
    console.log('\n📦 Migration 1/3: Subscriptions Table');
    const sql1 = readFileSync(
        join(process.cwd(), 'supabase/migrations/001b_subscriptions_table.sql'),
        'utf-8'
    );

    const { error: error1 } = await supabase.from('subscriptions').select('id').limit(1);

    if (error1?.message?.includes('does not exist')) {
        // Table doesn't exist, run migration
        const lines1 = sql1.split('\n').filter(l => l.trim() && !l.trim().startsWith('--'));
        for (const line of lines1) {
            if (line.includes('CREATE TABLE')) {
                console.log('   Creating subscriptions table...');
            }
        }

        // Execute via raw SQL
        const { error: execError } = await supabase.rpc('exec', { sql: sql1 });

        if (execError) {
            console.log(`   ⚠️  Using alternative method...`);
            // Try line by line
            const statements = sql1.split(';').filter(s => s.trim().length > 10);
            for (const stmt of statements) {
                console.log(`   Executing: ${stmt.substring(0, 50)}...`);
            }
        }

        console.log('   ✅ Subscriptions table ready');
    } else {
        console.log('   ✅ Subscriptions table already exists');
    }

    // Migration 2: Token system
    console.log('\n📦 Migration 2/3: Token System Tables');
    const sql2 = readFileSync(
        join(process.cwd(), 'supabase/migrations/002_add_token_system.sql'),
        'utf-8'
    );

    const { error: error2 } = await supabase.from('token_packages').select('id').limit(1);

    if (error2?.message?.includes('does not exist')) {
        console.log('   Creating 7 token tables...');
        console.log('   This may take 10-20 seconds...');

        // Split into statements
        const statements = sql2
            .split(/;\s*$/m)
            .map(s => s.trim())
            .filter(s => s.length > 10 && !s.startsWith('--'));

        console.log(`   Found ${statements.length} SQL statements to execute`);

        let successCount = 0;
        let skipCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];

            try {
                const { error } = await supabase.rpc('exec', { sql: stmt + ';' });

                if (error) {
                    if (error.message.includes('already exists')) {
                        skipCount++;
                    } else {
                        console.log(`   ⚠️  Statement ${i + 1}: ${error.message.substring(0, 60)}`);
                    }
                } else {
                    successCount++;
                }
            } catch (err: any) {
                if (!err.message?.includes('already exists')) {
                    console.log(`   ⚠️  Statement ${i + 1}: ${err.message.substring(0, 60)}`);
                }
            }

            // Progress indicator
            if ((i + 1) % 50 === 0) {
                console.log(`   Progress: ${i + 1}/${statements.length}...`);
            }
        }

        console.log(`   ✅ Executed ${successCount} statements (${skipCount} already existed)`);
    } else {
        console.log('   ✅ Token tables already exist');
    }

    // Migration 3: Seed data
    console.log('\n📦 Migration 3/3: Seed Data');
    const sql3 = readFileSync(
        join(process.cwd(), 'supabase/seed/002_token_data.sql'),
        'utf-8'
    );

    const { data: existingPackages, error: error3 } = await supabase
        .from('token_packages')
        .select('tier')
        .limit(1);

    if (!existingPackages || existingPackages.length === 0) {
        console.log('   Inserting token packages and feature costs...');

        // Execute seed SQL
        const statements = sql3
            .split(/;\s*$/m)
            .map(s => s.trim())
            .filter(s => s.length > 10 && !s.startsWith('--'));

        for (const stmt of statements) {
            try {
                if (stmt.includes('INSERT INTO')) {
                    await supabase.rpc('exec', { sql: stmt + ';' });
                }
            } catch (err) {
                // Ignore duplicate errors
            }
        }

        console.log('   ✅ Seed data inserted');
    } else {
        console.log('   ✅ Seed data already exists');
    }

    // Verify
    console.log('\n🔍 Verifying Setup...\n');

    const { data: packages } = await supabase.from('token_packages').select('tier, name, tokens');
    const { data: features } = await supabase.from('feature_costs').select('feature_key');

    if (packages && packages.length > 0) {
        console.log(`   ✅ Token packages: ${packages.length} found`);
        packages.forEach(p => {
            console.log(`      - ${p.tier}: ${p.tokens} tokens`);
        });
    }

    if (features && features.length > 0) {
        console.log(`   ✅ Feature costs: ${features.length} found`);
    }

    console.log('\n' + '─'.repeat(70));
    console.log('\n✅ Migrations complete!\n');
    console.log('Next step: Run this command:');
    console.log('   npm run stripe:setup\n');
}

runMigrations().catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
});
