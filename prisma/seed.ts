/**
 * Prisma Database Seed Script
 * Seeds the database with admin user and initial data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jobai.com' },
    update: {
      isAdmin: true,
      isPremium: true,
    },
    create: {
      email: 'admin@jobai.com',
      fullName: 'Admin User',
      isAdmin: true,
      isPremium: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // 2. Create user tokens
  await prisma.userToken.upsert({
    where: { userId: adminUser.id },
    update: {
      balance: 1000,
      lifetimeEarned: 1000,
    },
    create: {
      userId: adminUser.id,
      balance: 1000,
      lifetimeEarned: 1000,
      lifetimePurchased: 0,
      lifetimeSpent: 0,
    },
  });

  console.log('✅ Credited 1000 tokens to admin');

  // 3. Seed AI feature costs
  const featureCosts = [
    { feature: 'job_match', costTokens: 5, description: 'AI-powered job matching', averageApiCostUsd: 0.001 },
    { feature: 'resume_analysis', costTokens: 10, description: 'Resume analysis', averageApiCostUsd: 0.002 },
    { feature: 'cover_letter', costTokens: 15, description: 'Cover letter generation', averageApiCostUsd: 0.003 },
    { feature: 'interview_prep', costTokens: 20, description: 'Interview preparation', averageApiCostUsd: 0.004 },
    { feature: 'salary_analysis', costTokens: 8, description: 'Salary analysis', averageApiCostUsd: 0.002 },
    { feature: 'company_research', costTokens: 12, description: 'Company research', averageApiCostUsd: 0.0025 },
    { feature: 'resume_optimization', costTokens: 15, description: 'Resume optimization', averageApiCostUsd: 0.003 },
  ];

  for (const cost of featureCosts) {
    await prisma.aIFeatureCost.upsert({
      where: { feature: cost.feature as any },
      update: {},
      create: cost as any,
    });
  }

  console.log('✅ Seeded AI feature costs');

  // 4. Seed token packages (create only if none exist)
  const existingPackages = await prisma.tokenPackage.count();

  if (existingPackages === 0) {
    const packages = [
      { name: 'Starter Pack', description: 'Perfect for getting started', tokens: 100, priceCents: 499, isPopular: false, displayOrder: 1 },
      { name: 'Popular Pack', description: 'Most popular choice', tokens: 500, priceCents: 1999, isPopular: true, displayOrder: 2 },
      { name: 'Pro Pack', description: 'Best value', tokens: 1200, priceCents: 3999, isPopular: false, displayOrder: 3 },
      { name: 'Ultimate Pack', description: 'Maximum value', tokens: 3000, priceCents: 8999, isPopular: false, displayOrder: 4 },
    ];

    await prisma.tokenPackage.createMany({
      data: packages,
    });

    console.log('✅ Seeded token packages');
  } else {
    console.log('⚠️  Token packages already exist, skipping');
  }

  console.log('\n========================================');
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
  console.log('========================================');
  console.log('Login: http://localhost:3000/auth/login');
  console.log('Email: admin@jobai.com');
  console.log('Password: Admin123!@#');
  console.log('Admin: http://localhost:3000/admin');
  console.log('========================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
