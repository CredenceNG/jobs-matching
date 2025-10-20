import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...');

  // Hash passwords
  const testPassword = await bcrypt.hash('Test123', 10);
  const adminPassword = await bcrypt.hash('Admin123', 10);

  // Create or update test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@jobai.com' },
    update: {
      password: testPassword,
      fullName: 'Test User',
      lastLogin: new Date(),
    },
    create: {
      email: 'test@jobai.com',
      password: testPassword,
      fullName: 'Test User',
      isAdmin: false,
      lastLogin: new Date(),
    },
  });

  // Create token balance for test user if doesn't exist
  await prisma.userToken.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      balance: 100,
      lifetimeEarned: 0,
      lifetimePurchased: 100,
      lifetimeSpent: 0,
    },
  });

  console.log('✅ Created test@jobai.com (password: Test123) with 100 tokens');

  // Create or update admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jobai.com' },
    update: {
      password: adminPassword,
      fullName: 'Admin User',
      isAdmin: true,
      lastLogin: new Date(),
    },
    create: {
      email: 'admin@jobai.com',
      password: adminPassword,
      fullName: 'Admin User',
      isAdmin: true,
      lastLogin: new Date(),
    },
  });

  // Create token balance for admin user if doesn't exist
  await prisma.userToken.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      balance: 1000,
      lifetimeEarned: 0,
      lifetimePurchased: 1000,
      lifetimeSpent: 0,
    },
  });

  console.log('✅ Created admin@jobai.com (password: Admin123) with 1000 tokens');

  console.log('\n🎉 Seeding complete!');
  console.log('\nLogin credentials:');
  console.log('  Test User:  test@jobai.com / Test123');
  console.log('  Admin User: admin@jobai.com / Admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
