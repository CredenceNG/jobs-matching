import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkPackages() {
  try {
    console.log('🔍 Fetching token packages...');

    const packages = await prisma.tokenPackage.findMany();

    console.log(`✅ Found ${packages.length} packages:`);
    console.log(JSON.stringify(packages, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackages();
