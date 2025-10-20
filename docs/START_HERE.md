# 🚀 START HERE - 3 Simple Steps

The token system is fully coded and ready. You just need to create the database tables.

---

## ⚡ Quick Setup (10 Minutes)

### Step 1: Open Supabase SQL Editor

Click this link: **[Open Supabase SQL Editor](https://supabase.com/dashboard/project/haadlwqijqcrpdixbklc/sql/new)**

---

### Step 2: Run 3 SQL Scripts

Copy and paste each file into the SQL editor, then click "Run".

#### 2a. Create Subscriptions Table

📁 Open: `supabase/migrations/001b_subscriptions_table.sql`

```
1. Open the file
2. Select All (Cmd+A / Ctrl+A)
3. Copy (Cmd+C / Ctrl+C)
4. Paste in SQL Editor
5. Click "Run" button
```

✅ Expected: "Success. No rows returned"

---

#### 2b. Create Token System Tables

📁 Open: `supabase/migrations/002_add_token_system.sql`

```
1. Open the file (357 lines)
2. Select All (Cmd+A / Ctrl+A)
3. Copy (Cmd+C / Ctrl+C)
4. Paste in SQL Editor
5. Click "Run" button
```

✅ Expected: "Success. No rows returned"

This creates:
- ✅ 7 tables (user_tokens, token_transactions, token_packages, etc.)
- ✅ Security policies (RLS)
- ✅ Triggers and functions
- ✅ Indexes for performance

---

#### 2c. Insert Token Packages & Feature Costs

📁 Open: `supabase/seed/002_token_data.sql`

```
1. Open the file (149 lines)
2. Select All (Cmd+A / Ctrl+A)
3. Copy (Cmd+C / Ctrl+C)
4. Paste in SQL Editor
5. Click "Run" button
```

✅ Expected: "Success. 24 rows affected"

You should see notices:
```
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

### Step 3: Create Stripe Products

Back in your terminal, run:

```bash
npm run stripe:setup
```

This will:
1. ✅ Create 5 products in Stripe
2. ✅ Create prices for each ($5, $10, $20, $40, $100)
3. ✅ Update database with Stripe Price IDs
4. ✅ Verify everything is connected

Expected output:
```
🚀 Stripe Product Setup Script
🔑 Stripe Mode: TEST

📦 Creating Stripe product: Starter (100 tokens)
   ✅ Product created: prod_xxx
   ✅ Price created: price_xxx ($5)
   ✅ Database updated: starter → price_xxx

[... 4 more products ...]

✅ All products created successfully!
🎉 Setup complete!
```

---

## ✅ Verify It Worked

Run this to check everything:

```bash
npm run stripe:verify
```

Should show:
```
✅ Passed: 20+
❌ Failed: 0
⚠️  Warnings: 1 (webhook secret - we'll add that next)

🎉 ALL CHECKS PASSED!
```

---

## 🎉 Done! Now Test It

### Start Dev Server

```bash
npm run dev
```

### Visit Purchase Page

http://localhost:3000/tokens/buy

You should see:
- ✅ Current balance: 10 tokens (welcome bonus)
- ✅ 5 token packages displayed
- ✅ Prices: $5, $10, $20, $40, $100

---

## 🔧 If Something Goes Wrong

### "relation already exists" error
✅ **This is OK!** It means you already ran that migration. Skip to the next one.

### "permission denied" error
❌ Make sure you're logged into Supabase as the project owner.

### "syntax error" in SQL
❌ Make sure you copied the ENTIRE file, not just part of it.

### Still getting "table not found" after running migrations?
Run this query in Supabase to check:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE '%token%';
```

Should return 7 tables. If not, the migration didn't run successfully.

---

## 📞 Need More Help?

- **Detailed guide**: [COMPLETE_SETUP_INSTRUCTIONS.md](COMPLETE_SETUP_INSTRUCTIONS.md)
- **Stripe details**: [STRIPE_SETUP.md](scripts/STRIPE_SETUP.md)
- **Quick reference**: [TOKEN_SETUP_QUICKSTART.md](TOKEN_SETUP_QUICKSTART.md)

---

## 🎯 Summary

**Current Status**: Code is 100% ready, database needs setup

**What You Need To Do**:
1. ⏳ Run 3 SQL scripts in Supabase (5 minutes)
2. ⏳ Run `npm run stripe:setup` (2 minutes)
3. ✅ Test purchase with card `4242 4242 4242 4242`

**That's it!** The entire token system will be live. 🚀
