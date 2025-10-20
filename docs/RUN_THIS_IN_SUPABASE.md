# 🚀 Run This in Supabase SQL Editor

## Step 1: Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/haadlwqijqcrpdixbklc/sql/new**

---

## Step 2: Run Migration (Copy & Paste This)

Copy the **entire** contents below and paste into the SQL Editor, then click "Run":

### ⚠️ IMPORTANT: Copy from the file instead

The migration is too long to paste here. Please:

1. Open the file: `supabase/migrations/002_add_token_system.sql`
2. Select ALL (Cmd+A or Ctrl+A)
3. Copy (Cmd+C or Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click **"Run"** button
6. Wait for success message

Expected result: **"Success. No rows returned"**

---

## Step 3: Run Seed Data (Copy & Paste This)

After the migration succeeds, copy the **entire** contents below:

### ⚠️ IMPORTANT: Copy from the file instead

1. Open the file: `supabase/seed/002_token_data.sql`
2. Select ALL (Cmd+A or Ctrl+A)
3. Copy (Cmd+C or Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click **"Run"** button
6. Wait for success message

Expected result:
```
Success. 24 rows affected
NOTICE: Inserted 5 active token packages
NOTICE: Inserted 19 active feature costs
NOTICE: === Token Packages ===
NOTICE: Starter Package: 100 tokens for $5 (0% off)
NOTICE: Basic Package: 250 tokens for $10 (20% off)
NOTICE: Pro Package: 600 tokens for $20 (34% off)
NOTICE: Power Package: 1500 tokens for $40 (46% off)
NOTICE: Enterprise Package: 5000 tokens for $100 (60% off)
```

---

## Step 4: Verify Setup

Run this query to verify everything was created:

```sql
-- Check tables exist
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
)
ORDER BY table_name;

-- Check packages
SELECT tier, name, tokens, price_cents, stripe_price_id, active
FROM token_packages
ORDER BY sort_order;

-- Check feature costs
SELECT category, feature_name, token_cost
FROM feature_costs
WHERE active = TRUE
ORDER BY category, token_cost DESC;
```

Expected results:
- **7 tables** should be listed
- **5 token packages** (Starter, Basic, Pro, Power, Enterprise)
- **19 feature costs** across 6 categories

---

## ✅ Success Indicators

You'll know it worked when you see:

1. ✅ Migration runs with "Success. No rows returned"
2. ✅ Seed runs with "24 rows affected" and NOTICE messages
3. ✅ Verification queries show 7 tables, 5 packages, 19 features
4. ✅ No error messages in red

---

## 🐛 Troubleshooting

### "relation already exists" errors
**This is OK!** It means you already ran the migration. Skip to Step 3 (seed data).

### "type already exists" errors
**This is OK!** The enums were created previously. The script will continue.

### "permission denied" errors
Make sure you're logged in to Supabase as the project owner.

### Other errors
1. Check you copied the ENTIRE file contents
2. Make sure you're in the correct project (haadlwqijqcrpdixbklc)
3. Try running the migration in smaller chunks if needed

---

## 📁 File Locations

If you need to reference the files:
- Migration: `supabase/migrations/002_add_token_system.sql`
- Seed: `supabase/seed/002_token_data.sql`

---

## ⏭️ After Successful Migration

Once you see success messages, run:

```bash
npm run stripe:setup
```

This will create the Stripe products automatically!
