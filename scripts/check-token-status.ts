import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function checkUserTokens() {
  try {
    // Find all users with their token records
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        authUserId: true,
        tokens: {
          select: {
            balance: true
          }
        }
      }
    });

    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      const balance = user.tokens?.balance ?? 0;
      console.log(`\n👤 User: ${user.email}`);
      console.log(`   Auth ID: ${user.authUserId}`);
      console.log(`   DB ID: ${user.id}`);
      console.log(`   Balance: ${balance} tokens`);
    });

    // Check recent token transactions
    const transactions = await prisma.tokenTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    console.log(`\n💰 Recent ${transactions.length} token transactions:`);
    transactions.forEach(tx => {
      console.log(`\n   ${tx.user.email}: ${tx.type} - ${tx.amount} tokens`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Date: ${tx.createdAt}`);
      if (tx.metadata) {
        console.log(`   Metadata:`, tx.metadata);
      }
    });

    // Check recent purchases
    const purchases = await prisma.tokenPurchase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    console.log(`\n🛒 Recent ${purchases.length} token purchases:`);
    purchases.forEach(purchase => {
      const completedText = purchase.completedAt ? purchase.completedAt.toISOString() : 'Not completed';
      console.log(`\n   ${purchase.user.email}: ${purchase.tokens} tokens for $${purchase.amountCents / 100}`);
      console.log(`   Status: ${purchase.status}`);
      console.log(`   Payment Intent: ${purchase.stripePaymentIntentId}`);
      console.log(`   Created: ${purchase.createdAt}`);
      console.log(`   Completed: ${completedText}`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTokens();
