import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setUserPasswords() {
  console.log('🔐 Setting passwords for existing users...\n');

  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const testPassword = await bcrypt.hash('test123', 10);

    // Update admin user
    const admin = await prisma.user.update({
      where: { email: 'admin@jobai.com' },
      data: { password: adminPassword },
      select: { email: true, fullName: true },
    });
    console.log(`✅ Password set for: ${admin.email} (${admin.fullName})`);
    console.log(`   Login with: admin@jobai.com / admin123`);

    // Update test user
    const test = await prisma.user.update({
      where: { email: 'test@jobai.com' },
      data: { password: testPassword },
      select: { email: true, fullName: true },
    });
    console.log(`✅ Password set for: ${test.email} (${test.fullName})`);
    console.log(`   Login with: test@jobai.com / test123`);

    console.log('\n✅ All user passwords have been set!');
    console.log('\n📝 Credentials:');
    console.log('   Admin: admin@jobai.com / admin123');
    console.log('   Test:  test@jobai.com / test123');
    console.log('\n⚠️  Please change these passwords after first login!');

  } catch (error: any) {
    console.error('❌ Error setting passwords:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setUserPasswords();
