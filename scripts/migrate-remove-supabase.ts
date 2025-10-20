import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRemoveSupabase() {
  console.log('🔄 Starting migration to remove Supabase dependency...');

  try {
    // Step 1: Add password column
    console.log('1️⃣ Adding password column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);
    `);
    console.log('✅ Password column added');

    // Step 2: Drop auth_user_id column
    console.log('2️⃣ Dropping auth_user_id column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "auth_user_id";
    `);
    console.log('✅ auth_user_id column dropped');

    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: Existing users need to re-register with new passwords');
    console.log('   - admin@jobai.com');
    console.log('   - test@jobai.com');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateRemoveSupabase();
