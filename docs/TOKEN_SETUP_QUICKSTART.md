# Token System - Quick Start Guide

Complete setup guide to get the token pricing system running in 30 minutes.

## 📋 Overview

This guide will help you:
1. ✅ Configure environment variables (DONE)
2. 🔄 Set up database tables
3. 💳 Create Stripe products
4. 🔗 Configure webhooks
5. ✅ Test the complete flow

## Current Status

✅ **Environment Variables Configured**
- Stripe Test Keys added to `.env.local`
- Supabase credentials already configured
- AI API keys already set

## Step 1: Database Setup (5 minutes)

### Option A: Manual via Supabase Dashboard (Recommended)

1. **Go to Supabase SQL Editor**:
   https://supabase.com/dashboard/project/haadlwqijqcrpdixbklc/sql/new

2. **Run Migration**:
   - Open: `supabase/migrations/002_add_token_system.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"
   - Should see: "Success. No rows returned"

3. **Run Seed Data**:
   - Open: `supabase/seed/002_token_data.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"
   - Should see: "Success. 24 rows affected" (5 packages + 19 costs)

4. **Verify Setup**:
   ```sql
   -- Should return 5 rows
   SELECT tier, name, tokens, price_cents FROM token_packages ORDER BY sort_order;

   -- Should return 19 rows
   SELECT category, feature_key, cost FROM feature_costs ORDER BY category, sort_order;
   ```

### Option B: Via Supabase CLI

```bash
npx supabase db push
npx supabase db seed
```

## Step 2: Stripe Products Setup (10 minutes)

### Create Products in Stripe Dashboard

Go to: https://dashboard.stripe.com/test/products

Create **5 products** with these exact specifications:

| Product | Tokens | Price | Metadata |
|---------|--------|-------|----------|
| Starter | 100 | $5 | `package_tier=starter, tokens=100` |
| Basic | 250 | $10 | `package_tier=basic, tokens=250` |
| Pro | 600 | $20 | `package_tier=pro, tokens=600, popular=true` |
| Business | 1500 | $40 | `package_tier=business, tokens=1500, best_value=true` |
| Enterprise | 5000 | $100 | `package_tier=enterprise, tokens=5000` |

**Important**: Set product type as "One-time purchase" (not subscription)

### Update Database with Price IDs

After creating each product, copy the **Price ID** (starts with `price_...`) and run:

```sql
UPDATE token_packages SET stripe_price_id = 'price_STARTER_ID' WHERE tier = 'starter';
UPDATE token_packages SET stripe_price_id = 'price_BASIC_ID' WHERE tier = 'basic';
UPDATE token_packages SET stripe_price_id = 'price_PRO_ID' WHERE tier = 'pro';
UPDATE token_packages SET stripe_price_id = 'price_BUSINESS_ID' WHERE tier = 'business';
UPDATE token_packages SET stripe_price_id = 'price_ENTERPRISE_ID' WHERE tier = 'enterprise';

-- Verify all set
SELECT tier, stripe_price_id FROM token_packages;
```

## Step 3: Webhook Setup (5 minutes)

### For Local Development

1. **Install Stripe CLI** (if not installed):
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   ```

2. **Start Local Server**:
   ```bash
   npm run dev
   ```

3. **Forward Webhooks** (in new terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhooks
   ```

4. **Copy Webhook Secret**:
   - The `stripe listen` command will output: `whsec_...`
   - Add to `.env.local`:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
     ```
   - Restart dev server

## Step 4: Test Purchase Flow (10 minutes)

### 1. Create Test User

Sign up or log in at: http://localhost:3000/login

### 2. Check Initial Balance

Go to: http://localhost:3000/tokens/buy

You should see:
- Current balance: 10 tokens (welcome bonus)
- 5 token packages displayed

### 3. Purchase Tokens

1. Click "Buy Now" on any package (e.g., Pro Pack - 600 tokens)
2. Fill test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
3. Click "Pay $20.00"
4. Should redirect to `/tokens/success`
5. Balance should now show: 610 tokens (10 + 600)

### 4. Verify in Database

```sql
-- Check balance
SELECT user_id, balance, lifetime_purchased, lifetime_spent
FROM user_tokens
ORDER BY created_at DESC
LIMIT 5;

-- Check transaction
SELECT user_id, transaction_type, amount, balance_after, feature_key
FROM token_transactions
ORDER BY created_at DESC
LIMIT 5;

-- Check purchase record
SELECT user_id, package_tier, tokens_purchased, amount_paid, status
FROM token_purchases
ORDER BY created_at DESC
LIMIT 5;
```

### 5. Test Token Deduction

Use any AI feature that's wrapped with `<TokenGate>` or call the deduct API:

```bash
curl -X POST http://localhost:3000/api/tokens/deduct \
  -H "Content-Type: application/json" \
  -d '{
    "featureKey": "job_match_score",
    "metadata": {"jobId": "test-123"}
  }' \
  --cookie "your-session-cookie"
```

Should return:
```json
{
  "success": true,
  "newBalance": 605,
  "cost": 5,
  "transactionId": "..."
}
```

## Step 5: Test Subscription Users (Unlimited)

### 1. Create Subscription (if not already)

```sql
-- Manually set a user as having an active subscription
INSERT INTO subscriptions (user_id, status, plan_id, current_period_end)
VALUES (
    'YOUR_USER_ID',
    'active',
    'premium_monthly',
    NOW() + INTERVAL '30 days'
);
```

### 2. Test Unlimited Access

With an active subscription:
- Token balance API should return: `{ balance: Infinity, unlimited: true }`
- Token deductions should not decrease balance
- Usage is logged but not charged

## 🎉 Success Checklist

After completing all steps, verify:

- [ ] Database has 7 new tables (`user_tokens`, `token_transactions`, etc.)
- [ ] 5 token packages seeded with correct pricing
- [ ] 19 feature costs defined
- [ ] 5 Stripe products created with metadata
- [ ] Database updated with Stripe Price IDs
- [ ] Webhook secret configured in `.env.local`
- [ ] Test purchase completes successfully
- [ ] Tokens credited to user account
- [ ] Transaction logged in database
- [ ] Token deduction works correctly
- [ ] Subscription users get unlimited tokens

## 🚀 Next Steps

### Integrate with AI Features

Wrap your AI features with the `TokenGate` component:

```tsx
import TokenGate from '@/components/tokens/TokenGate';

export default function CoverLetterGenerator() {
    const handleGenerate = async () => {
        // Your AI generation logic here
        const coverLetter = await generateWithAI(...);
        return coverLetter;
    };

    return (
        <TokenGate
            featureKey="cover_letter_generation"
            featureName="Cover Letter Generation"
            description="Generate a personalized cover letter for this job"
            onConfirm={handleGenerate}
        >
            <button>Generate Cover Letter</button>
        </TokenGate>
    );
}
```

### Deploy to Production

1. **Deploy to Netlify**:
   ```bash
   npm run build
   netlify deploy --prod
   ```

2. **Configure Production Webhook**:
   - Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://your-domain.netlify.app/api/stripe/webhooks`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret
   - Add to Netlify env vars: `STRIPE_WEBHOOK_SECRET`

3. **Switch to Live Mode**:
   - Create products in Stripe live mode
   - Update env vars with live API keys
   - Test with real card (start with $5 Starter pack)

## 📚 Documentation

- **Full Implementation**: [TOKEN_IMPLEMENTATION_COMPLETE.md](TOKEN_IMPLEMENTATION_COMPLETE.md)
- **Database Setup**: [scripts/setup-database.md](scripts/setup-database.md)
- **Stripe Setup**: [scripts/STRIPE_SETUP.md](scripts/STRIPE_SETUP.md)
- **Pricing Strategy**: [TOKENS_PRICING_STRATEGY.md](TOKENS_PRICING_STRATEGY.md)
- **Token vs Subscription**: [TOKEN_VS_SUBSCRIPTION_COMPARISON.md](TOKEN_VS_SUBSCRIPTION_COMPARISON.md)

## 🐛 Troubleshooting

### "No such price" error
- Verify Stripe Price IDs in database match Stripe Dashboard
- Check you're using test mode Price IDs (start with `price_test_...`)

### Webhook not receiving events
- Ensure `stripe listen` is running
- Check webhook secret in `.env.local` matches output from `stripe listen`
- Restart dev server after adding webhook secret

### Tokens not credited after payment
- Check Next.js terminal for webhook handler errors
- Verify webhook signature validation passes
- Check Supabase logs for database errors
- Ensure `user_id` in payment metadata is valid

### Balance shows 0 instead of Infinity for subscribers
- Verify subscription record exists in database
- Check subscription status is 'active'
- Ensure `current_period_end` is in the future

## 💡 Tips

- **Test Mode**: Always test in Stripe test mode first (keys starting with `sk_test_`)
- **Logging**: Check Next.js terminal and Supabase logs for debugging
- **Incremental**: Test each step before moving to the next
- **Backups**: Export database before running migrations
- **Rollback**: Keep migration rollback scripts handy

## 📊 Monitoring

After deployment, track these metrics:

```sql
-- Daily revenue
SELECT DATE(created_at) as date, SUM(amount_paid/100.0) as revenue
FROM token_purchases
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Most popular packages
SELECT package_tier, COUNT(*) as purchases, SUM(tokens_purchased) as total_tokens
FROM token_purchases
WHERE status = 'completed'
GROUP BY package_tier
ORDER BY purchases DESC;

-- Token usage by feature
SELECT feature_key, COUNT(*) as uses, SUM(amount) as tokens_used
FROM token_transactions
WHERE transaction_type = 'deduction'
GROUP BY feature_key
ORDER BY uses DESC;

-- Average tokens per user
SELECT AVG(balance) as avg_balance, AVG(lifetime_purchased) as avg_purchased
FROM user_tokens;
```

---

**Ready to launch! 🚀**

Questions? Check the troubleshooting section or review the detailed documentation files.
