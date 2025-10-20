# Apply Database Migrations - Quick Guide

## Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

## Step 2: Create Token System Tables

Copy and paste the contents of `/supabase/migrations/20250110000002_create_token_system.sql` into the SQL editor and click **Run**.

This creates:
- `token_packages` table
- `user_tokens` table
- `token_transactions` table
- `token_feature_costs` table
- Indexes and RLS policies

## Step 3: Seed Token Packages

Copy and paste the contents of `/supabase/migrations/20250110000001_seed_token_packages.sql` into the SQL editor and click **Run**.

This inserts 4 default token packages:
- **Starter**: 100 tokens for $5
- **Basic**: 250 tokens for $10 (20% off)
- **Pro**: 600 tokens for $20 (34% off) - Most Popular + Best Value
- **Power**: 1500 tokens for $40 (46% off)

## Step 4: Verify Migration

Run this query to verify packages were created:

```sql
SELECT * FROM token_packages ORDER BY sort_order;
```

You should see 4 rows with UUIDs as IDs.

## Step 5: Test Token Purchase

1. Login at: http://localhost:3001/auth/login
   - Email: `test@jobai.com`
   - Password: `Test123456!`

2. Go to: http://localhost:3001/tokens/buy

3. Select a token package - you should now see the packages load from the database

4. Click to purchase - this will create a Stripe PaymentIntent

## Troubleshooting

### "Table token_packages does not exist"
- Run Step 2 migration first

### "No packages showing on /tokens/buy"
- Run Step 3 migration to seed packages
- Check browser console for errors
- Verify `/api/tokens/packages` returns data

### "Failed to create payment"
- Make sure you're logged in (run the seed-test-user script)
- Check server logs for detailed error messages
- Verify STRIPE_SECRET_KEY is set in .env.local

---

**Quick Command Reference:**

```bash
# Seed test user (if not already done)
npx tsx scripts/seed-test-user.ts

# Start dev server
npm run dev

# Check server logs for payment flow
# Look for: 🔵 [Token Purchase] logs
```
