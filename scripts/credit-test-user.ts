/**
 * Credit Test User with Tokens
 * Updates existing test@jobai.com user with tokens
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function creditTestUser() {
  console.log('🔍 Looking up test user...');

  // Get auth user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const authUser = users.find(u => u.email === 'test@jobai.com');
  if (!authUser) {
    console.error('❌ test@jobai.com not found in Supabase Auth');
    process.exit(1);
  }

  console.log('✅ Found auth user:', authUser.id);

  // Create/update user profile in Neon
  const user = await prisma.user.upsert({
    where: { authUserId: authUser.id },
    update: {
      isAdmin: false,
      isPremium: false,
    },
    create: {
      authUserId: authUser.id,
      email: 'test@jobai.com',
      fullName: 'Test User',
      isAdmin: false,
      isPremium: false,
    },
  });

  console.log('✅ User profile ready:', user.email);

  // Credit tokens
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
  console.log('🎉 TEST USER READY!');
  console.log('========================================');
  console.log('Email: test@jobai.com');
  console.log('Password: Test123!@#');
  console.log('Is Admin: false');
  console.log('Tokens: 500');
  console.log('Login: http://localhost:3000/auth/login');
  console.log('========================================\n');

  await prisma.$disconnect();
}

creditTestUser();
