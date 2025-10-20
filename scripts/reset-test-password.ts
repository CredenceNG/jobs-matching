/**
 * Reset Test User Password
 *
 * Resets the password for test@jobai.com to Test123!
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function resetPassword() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('🔍 Finding test user...');

    // Get all users and find test@jobai.com
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    const testUser = users.find(u => u.email === 'test@jobai.com');

    if (!testUser) {
      console.error('❌ Test user not found. Creating new user...');

      // Create the user with the password
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'test@jobai.com',
        password: 'Test123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
        },
      });

      if (createError) {
        throw createError;
      }

      console.log('✅ Test user created successfully!');
      console.log('   Email: test@jobai.com');
      console.log('   Password: Test123!');
      console.log('   User ID:', newUser.user?.id);
      return;
    }

    console.log('✅ Test user found:', testUser.id);
    console.log('   Email:', testUser.email);

    // Update the user's password
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      testUser.id,
      {
        password: 'Test123!',
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Password reset successfully!');
    console.log('');
    console.log('📧 Login Credentials:');
    console.log('   Email: test@jobai.com');
    console.log('   Password: Test123!');
    console.log('');
    console.log('🔗 Login at: http://localhost:3000/auth/login');

  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  }
}

resetPassword();
