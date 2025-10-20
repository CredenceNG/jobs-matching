# Database Setup Instructions

Since we encountered CLI issues, please run the migrations manually via the Supabase Dashboard SQL Editor.

## Step 1: Access Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/haadlwqijqcrpdixbklc/sql/new

## Step 2: Run Token System Migration

1. Open the file: `supabase/migrations/002_add_token_system.sql`
2. Copy the **entire contents** of the file
3. Paste into the Supabase SQL Editor
4. Click "Run" button
5. Verify success (you should see "Success. No rows returned")

## Step 3: Insert Seed Data

1. Open the file: `supabase/seed/002_token_data.sql`
2. Copy the **entire contents** of the file
3. Paste into the Supabase SQL Editor
4. Click "Run" button
5. Verify success (should show 5 token packages and 19 feature costs inserted)

## Step 4: Verify Tables Created

Run this query in the SQL Editor:

```sql
-- Check token_packages
SELECT * FROM token_packages ORDER BY sort_order;

-- Check feature_costs
SELECT * FROM feature_costs ORDER BY category, sort_order;

-- Check other tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'user_tokens',
    'token_transactions',
    'token_packages',
    'feature_costs',
    'token_purchases',
    'daily_token_usage',
    'referrals'
);
```

You should see:
- 5 token packages (Starter, Basic, Pro, Business, Enterprise)
- 19 feature costs across 6 categories
- 7 tables listed

## Step 5: Test Token System

Run this query to test the token initialization:

```sql
-- Create a test user token record
INSERT INTO user_tokens (user_id, balance)
VALUES ('00000000-0000-0000-0000-000000000000', 100)
ON CONFLICT (user_id) DO NOTHING;

-- Verify it was created
SELECT * FROM user_tokens WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

## Troubleshooting

### "relation already exists" errors
This is OK - it means the table was created in a previous run. The migration is idempotent.

### "permission denied" errors
Make sure you're using the service_role key or are logged in as the project owner.

### "column does not exist" errors
Make sure you ran the migration BEFORE the seed data.

## Next Steps

After successful database setup:
1. ✅ Database tables created
2. ⏭️  Create Stripe products (see STRIPE_SETUP.md)
3. ⏭️  Configure webhook endpoint
4. ⏭️  Test purchase flow
