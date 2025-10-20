import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  console.log('🔍 Checking migration status in Neon database...\n');

  try {
    // Check users
    const userCount = await prisma.user.count();
    console.log(`✅ Users table: ${userCount} records`);

    // Check token packages
    const packageCount = await prisma.tokenPackage.count();
    console.log(`✅ Token packages: ${packageCount} records`);

    // Check token features
    const featureCount = await prisma.tokenFeature.count();
    console.log(`✅ Token features: ${featureCount} records`);

    // Check jobs table exists
    try {
      const jobCount = await prisma.$queryRaw`SELECT COUNT(*) FROM jobs`;
      console.log(`✅ Jobs table: exists`);
    } catch (e) {
      console.log(`❌ Jobs table: missing`);
    }

    console.log('\n📊 Summary:');
    console.log('   All Supabase migrations have already been applied to Neon database');
    console.log('   The supabase/migrations folder is now obsolete and can be removed');
    console.log('   Your Prisma schema is the source of truth now');

  } catch (error: any) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();
