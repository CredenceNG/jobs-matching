# 🚀 Complete Token System Setup Instructions

Follow these steps in order to set up the token pricing system.

## Prerequisites

✅ Stripe API keys configured in `.env.local`
✅ Supabase project accessible
✅ Dependencies installed (`npm install` completed)

---

## Step 1: Database Setup (Run in Supabase SQL Editor)

### 1a. Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/haadlwqijqcrpdixbklc/sql/new**

### 1b. Create Subscriptions Table

1. Open file: `supabase/migrations/001b_subscriptions_table.sql`
2. Copy **entire contents**
3. Paste into SQL Editor
4. Click **"Run"**
5. Wait for: "Success. No rows returned" OR "relation already exists" (both OK)

### 1c. Run Token System Migration

1. Open file: `supabase/migrations/002_add_token_system.sql`
2. Copy **entire contents** (357 lines)
3. Paste into SQL Editor
4. Click **"Run"**
5. Wait for: "Success. No rows returned"

### 1d. Seed Token Data

1. Open file: `supabase/seed/002_token_data.sql`
2. Copy **entire contents** (149 lines)
3. Paste into SQL Editor
4. Click **"Run"**
5. Wait for: "Success. 24 rows affected"

You should see NOTICE messages:
```
NOTICE: Inserted 5 active token packages
NOTICE: Inserted 19 active feature costs
NOTICE: === Token Packages ===
NOTICE: Starter Package: 100 tokens for $5 (0% off)
...
```

### 1e. Verify Database Setup

Run this query:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%token%'
ORDER BY table_name;

-- Check packages
SELECT tier, name, tokens, price_cents FROM token_packages ORDER BY sort_order;

-- Check features
SELECT category, COUNT(*) as features FROM feature_costs GROUP BY category;
```

Expected:
- 7 tables with 'token' in the name
- 5 token packages
- 6 feature categories

---

## Step 2: Create Stripe Products

### Option A: Automated (Recommended)

```bash
npm run stripe:setup
```

This script will:
1. Create 5 products in Stripe
2. Create prices for each
3. Update database with Price IDs
4. Verify everything is configured

### Option B: Manual

See [STRIPE_SETUP.md](scripts/STRIPE_SETUP.md) for detailed manual instructions.

---

## Step 3: Configure Webhooks

### 3a. Install Stripe CLI (if not installed)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login
```

### 3b. Start Development Server

```bash
npm run dev
```

### 3c. Forward Webhooks (in new terminal)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

This will output a webhook signing secret: `whsec_...`

### 3d. Add Webhook Secret to Environment

Copy the `whsec_...` secret and add to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

**Restart dev server** after adding this!

---

## Step 4: Verify Complete Setup

```bash
npm run stripe:verify
```

This will check:
- ✅ Environment variables
- ✅ Stripe API connection
- ✅ Database tables
- ✅ Token packages with Price IDs
- ✅ Feature costs
- ✅ API endpoints

All checks should pass!

---

## Step 5: Test Purchase Flow

### 5a. Create Test User

1. Go to: http://localhost:3000/login
2. Sign up with test email

### 5b. Check Initial Balance

Go to: http://localhost:3000/tokens/buy

Should show:
- Current balance: 10 tokens (welcome bonus)
- 5 token packages available

### 5c. Purchase Tokens

1. Click "Buy Now" on any package (try Pro - 600 tokens for $20)
2. Enter test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
3. Click "Pay"
4. Should redirect to `/tokens/success`
5. Balance should update: 610 tokens (10 + 600)

### 5d. Verify in Database

```sql
-- Check your user's tokens
SELECT balance, lifetime_purchased, lifetime_spent
FROM user_tokens
WHERE user_id = 'YOUR_USER_ID';

-- Check transaction
SELECT transaction_type, amount, balance_after, description
FROM token_transactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;

-- Check purchase record
SELECT package_tier, tokens_purchased, amount_paid, status
FROM token_purchases
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

---

## ✅ Success Checklist

After completing all steps:

- [ ] Database has 7 token tables
- [ ] 5 token packages seeded
- [ ] 19 feature costs configured
- [ ] 5 Stripe products created
- [ ] Database updated with Stripe Price IDs
- [ ] Webhook secret configured
- [ ] `stripe listen` running and receiving events
- [ ] Test purchase completes successfully
- [ ] Tokens credited to account
- [ ] Transaction logged in database
- [ ] Balance displays correctly

---

## 🎉 You're Done!

The token system is now fully operational. Next steps:

### Integrate with AI Features

Wrap your AI features with TokenGate:

```tsx
import TokenGate from '@/components/tokens/TokenGate';

export default function YourAIFeature() {
    const handleGenerate = async () => {
        // Your AI logic here
        const result = await callAIService();
        return result;
    };

    return (
        <TokenGate
            featureKey="cover_letter_generation"
            featureName="Cover Letter"
            description="Generate a personalized cover letter"
            onConfirm={handleGenerate}
        >
            <button>Generate Cover Letter</button>
        </TokenGate>
    );
}
```

### Monitor Usage

Check token usage in Supabase:

```sql
-- Daily revenue
SELECT DATE(created_at) as date,
       COUNT(*) as purchases,
       SUM(amount_paid/100.0) as revenue
FROM token_purchases
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Most used features
SELECT metadata->>'feature_key' as feature,
       COUNT(*) as uses,
       SUM(ABS(amount)) as tokens_used
FROM token_transactions
WHERE transaction_type = 'spent'
GROUP BY metadata->>'feature_key'
ORDER BY uses DESC;
```

### Deploy to Production

1. Build: `npm run build`
2. Deploy to Netlify
3. Configure production webhook in Stripe Dashboard
4. Update environment variables with production values
5. Switch to live Stripe keys when ready

---

## 📚 Additional Documentation

- [TOKEN_SETUP_QUICKSTART.md](TOKEN_SETUP_QUICKSTART.md) - Quick reference guide
- [TOKEN_IMPLEMENTATION_COMPLETE.md](TOKEN_IMPLEMENTATION_COMPLETE.md) - Full technical docs
- [STRIPE_SETUP.md](scripts/STRIPE_SETUP.md) - Stripe configuration details
- [TOKENS_PRICING_STRATEGY.md](TOKENS_PRICING_STRATEGY.md) - Pricing strategy & economics

---

## 🐛 Troubleshooting

### Webhook not receiving events
- Check `stripe listen` is running
- Verify webhook secret matches in `.env.local`
- Restart dev server after adding secret

### Tokens not credited
- Check Next.js logs for webhook handler errors
- Verify Stripe Payment Intent has user_id in metadata
- Check Supabase logs for database errors

### "No such price" error
- Run `npm run stripe:verify` to check Price IDs
- Ensure Price IDs in database match Stripe Dashboard

### Database errors
- Ensure migrations ran in correct order
- Check RLS policies aren't blocking operations
- Verify service role key is correct

---

**Need help? Check the detailed guides or review error logs!** 🚀
