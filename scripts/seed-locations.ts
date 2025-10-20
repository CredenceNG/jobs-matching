/**
 * Seed Location Configurations
 *
 * Populates the database with initial location configurations for job board selection.
 * Run with: npx ts-node scripts/seed-locations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const locationConfigs = [
  // North America
  {
    region: 'north_america',
    country: 'Canada',
    keywords: ['canada', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'edmonton', 'winnipeg', 'quebec'],
    indeedDomain: 'ca.indeed.com',
    linkedinRegion: 'Canada',
    recommendedBoards: ['indeed', 'linkedin', 'jobbank', 'workopolis', 'eluta'],
    priority: 100,
  },
  {
    region: 'north_america',
    country: 'United States',
    keywords: ['usa', 'united states', 'america', 'new york', 'san francisco', 'los angeles', 'chicago', 'boston', 'seattle', 'austin', 'denver', 'miami', 'dallas', 'houston'],
    indeedDomain: 'indeed.com',
    linkedinRegion: 'United States',
    recommendedBoards: ['indeed', 'linkedin', 'glassdoor', 'dice', 'monster', 'ziprecruiter'],
    priority: 80,
  },

  // Europe
  {
    region: 'europe',
    country: 'United Kingdom',
    keywords: ['uk', 'united kingdom', 'london', 'manchester', 'birmingham', 'england', 'scotland', 'wales', 'edinburgh', 'glasgow'],
    indeedDomain: 'uk.indeed.com',
    linkedinRegion: 'United Kingdom',
    recommendedBoards: ['indeed', 'linkedin', 'reed', 'totaljobs', 'cwjobs'],
    priority: 100,
  },
  {
    region: 'europe',
    country: 'Germany',
    keywords: ['germany', 'berlin', 'munich', 'hamburg', 'deutschland', 'frankfurt', 'cologne'],
    indeedDomain: 'de.indeed.com',
    linkedinRegion: 'Germany',
    recommendedBoards: ['indeed', 'linkedin', 'stepstone', 'xing'],
    priority: 90,
  },
  {
    region: 'europe',
    country: 'France',
    keywords: ['france', 'paris', 'lyon', 'marseille', 'toulouse', 'nice'],
    indeedDomain: 'fr.indeed.com',
    linkedinRegion: 'France',
    recommendedBoards: ['indeed', 'linkedin', 'apec', 'jobteaser'],
    priority: 90,
  },
  {
    region: 'europe',
    country: 'Netherlands',
    keywords: ['netherlands', 'holland', 'amsterdam', 'rotterdam', 'the hague', 'utrecht'],
    indeedDomain: 'nl.indeed.com',
    linkedinRegion: 'Netherlands',
    recommendedBoards: ['indeed', 'linkedin', 'monsterboard'],
    priority: 85,
  },
  {
    region: 'europe',
    country: 'Spain',
    keywords: ['spain', 'madrid', 'barcelona', 'valencia', 'seville'],
    indeedDomain: 'es.indeed.com',
    linkedinRegion: 'Spain',
    recommendedBoards: ['indeed', 'linkedin', 'infojobs'],
    priority: 85,
  },

  // Asia-Pacific
  {
    region: 'asia',
    country: 'India',
    keywords: ['india', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai', 'kolkata'],
    indeedDomain: 'in.indeed.com',
    linkedinRegion: 'India',
    recommendedBoards: ['indeed', 'linkedin', 'naukri', 'monsterindia'],
    priority: 90,
  },
  {
    region: 'asia',
    country: 'Singapore',
    keywords: ['singapore'],
    indeedDomain: 'sg.indeed.com',
    linkedinRegion: 'Singapore',
    recommendedBoards: ['indeed', 'linkedin', 'jobstreet', 'jobsdb'],
    priority: 90,
  },
  {
    region: 'asia',
    country: 'Japan',
    keywords: ['japan', 'tokyo', 'osaka', 'kyoto', 'yokohama'],
    indeedDomain: 'jp.indeed.com',
    linkedinRegion: 'Japan',
    recommendedBoards: ['indeed', 'linkedin', 'rikunabi'],
    priority: 85,
  },

  // Oceania
  {
    region: 'oceania',
    country: 'Australia',
    keywords: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'canberra'],
    indeedDomain: 'au.indeed.com',
    linkedinRegion: 'Australia',
    recommendedBoards: ['indeed', 'linkedin', 'seek', 'jora'],
    priority: 100,
  },
  {
    region: 'oceania',
    country: 'New Zealand',
    keywords: ['new zealand', 'auckland', 'wellington', 'christchurch'],
    indeedDomain: 'nz.indeed.com',
    linkedinRegion: 'New Zealand',
    recommendedBoards: ['indeed', 'linkedin', 'seek'],
    priority: 90,
  },

  // Remote/Global
  {
    region: 'global',
    country: 'Remote',
    keywords: ['remote', 'anywhere', 'worldwide', 'work from home', 'wfh'],
    indeedDomain: 'indeed.com',
    linkedinRegion: 'global',
    recommendedBoards: ['remoteok', 'weworkremotely', 'linkedin', 'stackoverflow', 'indeed'],
    priority: 50,
  },
];

async function main() {
  console.log('🌍 Starting location configuration seed...\n');

  try {
    // Clear existing configs (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing location configs...');
    await prisma.locationConfig.deleteMany({});
    console.log('✅ Cleared\n');

    // Insert new configs
    console.log('📝 Inserting location configs...');
    let count = 0;

    for (const config of locationConfigs) {
      await prisma.locationConfig.create({
        data: config,
      });
      count++;
      console.log(`   ✓ Added ${config.country} (${config.keywords.length} keywords, priority: ${config.priority})`);
    }

    console.log(`\n✅ Successfully seeded ${count} location configurations!`);

    // Display summary
    console.log('\n📊 Summary by region:');
    const byRegion = await prisma.locationConfig.groupBy({
      by: ['region'],
      _count: true,
      orderBy: {
        region: 'asc',
      },
    });

    for (const group of byRegion) {
      console.log(`   ${group.region}: ${group._count} locations`);
    }

    console.log('\n🎉 Seed complete! You can now use dynamic location detection.');
    console.log('💡 To add more locations, update the database via Prisma Studio or API.');

  } catch (error) {
    console.error('❌ Error seeding locations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
