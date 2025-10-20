import { PrismaClient, AIFeature } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding feature costs...');

  const features = [
    {
      feature: AIFeature.cover_letter,
      costTokens: 5,
      description: 'Generate personalized cover letters',
      averageApiCostUsd: 0.015,
      isActive: true,
    },
    {
      feature: AIFeature.resume_analysis,
      costTokens: 3,
      description: 'Analyze resume and extract skills',
      averageApiCostUsd: 0.008,
      isActive: true,
    },
    {
      feature: AIFeature.job_match,
      costTokens: 2,
      description: 'Match jobs to your profile with AI',
      averageApiCostUsd: 0.005,
      isActive: true,
    },
    {
      feature: AIFeature.interview_prep,
      costTokens: 5,
      description: 'Generate interview questions and answers',
      averageApiCostUsd: 0.012,
      isActive: true,
    },
    {
      feature: AIFeature.salary_analysis,
      costTokens: 4,
      description: 'Analyze salary data and market trends',
      averageApiCostUsd: 0.010,
      isActive: true,
    },
    {
      feature: AIFeature.company_research,
      costTokens: 3,
      description: 'Research company information and culture',
      averageApiCostUsd: 0.007,
      isActive: true,
    },
    {
      feature: AIFeature.resume_optimization,
      costTokens: 4,
      description: 'Optimize resume for ATS and recruiters',
      averageApiCostUsd: 0.011,
      isActive: true,
    },
  ];

  for (const feature of features) {
    await prisma.aIFeatureCost.upsert({
      where: { feature: feature.feature },
      update: feature,
      create: feature,
    });
    console.log(`✅ Created/updated: ${AIFeature[feature.feature]}`);
  }

  console.log('\n🎉 Feature costs seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
