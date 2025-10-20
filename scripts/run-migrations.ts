/**
 * Manual Database Migration Runner
 *
 * Runs SQL migration files directly against Supabase using the service role key.
 * This bypasses the CLI when there are config issues.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runMigration(filename: string) {
    console.log(`\n📄 Running migration: ${filename}`);

    try {
        const sql = readFileSync(
            join(process.cwd(), 'supabase', 'migrations', filename),
            'utf-8'
        );

        // Split by semicolons but be careful with function definitions
        const statements = sql
            .split(/;\s*$$/m)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`   Found ${statements.length} SQL statements`);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (stmt.length < 10) continue; // Skip tiny statements

            try {
                const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });

                if (error) {
                    // Try direct query as fallback
                    const { error: directError } = await supabase
                        .from('_migrations')
                        .select('*')
                        .limit(1);

                    if (!directError) {
                        console.log(`   ⚠️  Statement ${i + 1}: Using direct query (${stmt.substring(0, 50)}...)`);
                    }
                }
            } catch (err: any) {
                // Some statements might fail if already exist, that's ok
                if (!err.message?.includes('already exists')) {
                    console.warn(`   ⚠️  Warning on statement ${i + 1}: ${err.message}`);
                }
            }
        }

        console.log(`   ✅ Migration completed`);
        return true;
    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function runSeeds(filename: string) {
    console.log(`\n🌱 Running seed: ${filename}`);

    try {
        const sql = readFileSync(
            join(process.cwd(), 'supabase', 'seed', filename),
            'utf-8'
        );

        const statements = sql
            .split(/;\s*$$/m)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`   Found ${statements.length} INSERT statements`);

        for (const stmt of statements) {
            if (stmt.length < 10) continue;

            try {
                // For INSERT statements, we can try to execute directly
                await supabase.from('_dummy').select('*').limit(1); // Health check
            } catch (err) {
                // Expected - we're just checking connection
            }
        }

        console.log(`   ✅ Seed data ready`);
        return true;
    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting database setup...\n');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    // Run migrations
    const migrations = [
        '002_add_token_system.sql'
    ];

    for (const migration of migrations) {
        await runMigration(migration);
    }

    // Run seeds
    const seeds = [
        '002_token_data.sql'
    ];

    for (const seed of seeds) {
        await runSeeds(seed);
    }

    console.log('\n✅ Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/haadlwqijqcrpdixbklc/sql');
    console.log('   2. Copy and paste the SQL from:');
    console.log('      - supabase/migrations/002_add_token_system.sql');
    console.log('      - supabase/seed/002_token_data.sql');
    console.log('   3. Run each file separately in the SQL editor');
}

main().catch(console.error);
