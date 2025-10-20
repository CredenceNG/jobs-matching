/**
 * Seed Test User
 * Creates a non-admin test user with tokens
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedTestUser() {
  console.log('🌱 Creating test user...');

  try {
    // Step 1: Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@jobai.com',
      password: 'Test123!@#',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Auth user already exists, looking up...');

        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = users.find(u => u.email === 'test@jobai.com');
        if (!existingUser) throw new Error('User exists but could not find it');

        console.log('✅ Found existing auth user:', existingUser.id);
        await setupUserProfile(existingUser.id);
        return;
      }
      throw authError;
    }

    console.log('✅ Created auth user:', authData.user.id);
    await setupUserProfile(authData.user.id);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function setupUserProfile(authUserId: string) {
  // Step 2: Create user profile in Neon database
  const user = await prisma.user.upsert({
    where: { authUserId },
    update: {
      isAdmin: false,
      isPremium: false,
    },
    create: {
      authUserId,
      email: 'test@jobai.com',
      fullName: 'Test User',
      isAdmin: false,
      isPremium: false,
    },
  });

  console.log('✅ User profile created:', user.email);

  // Step 3: Credit tokens
  await prisma.userToken.upsert({
    where: { userId: user.id },
    update: {
      balance: 500,
      lifetimeEarned: 500,
    },
    create: {
      userId: user.id,
      balance: 500,
      lifetimeEarned: 500,
      lifetimePurchased: 0,
      lifetimeSpent: 0,
    },
  });

  console.log('✅ Credited 500 tokens');

  console.log('\n========================================');
  console.log('🎉 TEST USER CREATED!');
  console.log('========================================');
  console.log('Email: test@jobai.com');
  console.log('Password: Test123!@#');
  console.log('Is Admin: false');
  console.log('Tokens: 500');
  console.log('Login: http://localhost:3000/auth/login');
  console.log('========================================\n');

  await prisma.$disconnect();
}

seedTestUser();
