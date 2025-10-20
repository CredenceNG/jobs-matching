/**
 * Create Admin User Script
 *
 * This script creates an admin user in your Supabase project
 * Run with: npx tsx scripts/create-admin.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🔵 Creating admin user...');

  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@jobai.com',
      password: 'Admin123!@#',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('🟡 Auth user already exists, looking up existing user...');

        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) throw listError;

        const existingUser = users.find(u => u.email === 'admin@jobai.com');

        if (!existingUser) {
          throw new Error('User exists but could not find it');
        }

        console.log('✅ Found existing auth user:', existingUser.id);

        // Use existing auth user
        await setupUserProfile(existingUser.id);
        return;
      }

      throw authError;
    }

    console.log('✅ Created auth user:', authData.user.id);

    // Step 2: Create user profile
    await setupUserProfile(authData.user.id);

  } catch (error: any) {
    console.error('🔴 Error:', error.message);
    process.exit(1);
  }
}

async function setupUserProfile(authUserId: string) {
  console.log('🔵 Setting up user profile...');

  // Step 1: Add is_admin column if it doesn't exist
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE'
  }).then(() => ({ error: null })).catch(e => ({ error: e }));

  // Ignore error if column already exists

  // Step 2: Insert/update user record
  const { data: userData, error: userError } = await supabase
    .from('users')
    .upsert({
      auth_user_id: authUserId,
      email: 'admin@jobai.com',
      full_name: 'Admin User',
      is_admin: true,
      is_premium: true,
      subscription_status: 'active'
    }, {
      onConflict: 'auth_user_id'
    })
    .select()
    .single();

  if (userError) {
    console.error('🔴 Error creating user profile:', userError);
    throw userError;
  }

  console.log('✅ User profile created:', userData.id);

  // Step 3: Credit 1000 tokens
  const { error: tokenError } = await supabase
    .from('user_tokens')
    .upsert({
      user_id: userData.id,
      balance: 1000,
      lifetime_earned: 1000,
      lifetime_purchased: 0,
      lifetime_spent: 0
    }, {
      onConflict: 'user_id'
    });

  if (tokenError) {
    console.error('🔴 Error crediting tokens:', tokenError);
    throw tokenError;
  }

  console.log('✅ Credited 1000 tokens');
  console.log('\n✅ Admin user created successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@jobai.com');
  console.log('  Password: Admin123!@#');
  console.log('\n🔐 Change the password after first login!');
}

// Run the script
createAdminUser();
