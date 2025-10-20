# Stripe Setup Guide

Complete setup instructions for configuring Stripe products and webhooks for the token system.

## Prerequisites

✅ Stripe API keys added to `.env.local`:
- `STRIPE_SECRET_KEY`: sk_test_51RbCRcGpNFb6poEp...
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: pk_test_51RbCRcGpNFb6poEp...

## Step 1: Create Stripe Products

Go to: https://dashboard.stripe.com/test/products

Create 5 products for the token packages:

### Product 1: Starter Pack
- **Name**: 100 Tokens - Starter Pack
- **Description**: Perfect for trying out AI features. Get started with 100 tokens.
- **Type**: One-time purchase
- **Price**: $5.00 USD
- **Metadata** (important!):
  - `package_tier`: `starter`
  - `tokens`: `100`
  - `discount_percentage`: `0`

After creating, copy the **Price ID** (starts with `price_...`)

### Product 2: Basic Pack
- **Name**: 250 Tokens - Basic Pack
- **Description**: Great value! 250 tokens with 20% savings.
- **Type**: One-time purchase
- **Price**: $10.00 USD
- **Metadata**:
  - `package_tier`: `basic`
  - `tokens`: `250`
  - `discount_percentage`: `20`

Copy the **Price ID**

### Product 3: Pro Pack (Popular)
- **Name**: 600 Tokens - Pro Pack
- **Description**: Most popular! 600 tokens with 34% savings. Best for regular users.
- **Type**: One-time purchase
- **Price**: $20.00 USD
- **Metadata**:
  - `package_tier`: `pro`
  - `tokens`: `600`
  - `discount_percentage`: `34`
  - `popular`: `true`

Copy the **Price ID**

### Product 4: Business Pack (Best Value)
- **Name**: 1500 Tokens - Business Pack
- **Description**: Best value! 1500 tokens with 40% savings. Perfect for power users.
- **Type**: One-time purchase
- **Price**: $40.00 USD
- **Metadata**:
  - `package_tier`: `business`
  - `tokens`: `1500`
  - `discount_percentage`: `40`
  - `best_value`: `true`

Copy the **Price ID**

### Product 5: Enterprise Pack
- **Name**: 5000 Tokens - Enterprise Pack
- **Description**: Ultimate pack! 5000 tokens with 50% savings. For serious professionals.
- **Type**: One-time purchase
- **Price**: $100.00 USD
- **Metadata**:
  - `package_tier`: `enterprise`
  - `tokens`: `5000`
  - `discount_percentage`: `50`

Copy the **Price ID**

## Step 2: Update Database with Price IDs

After creating all 5 products, run this SQL in Supabase SQL Editor:

```sql
-- Update token_packages with Stripe Price IDs
UPDATE token_packages SET stripe_price_id = 'price_YOUR_STARTER_ID' WHERE tier = 'starter';
UPDATE token_packages SET stripe_price_id = 'price_YOUR_BASIC_ID' WHERE tier = 'basic';
UPDATE token_packages SET stripe_price_id = 'price_YOUR_PRO_ID' WHERE tier = 'pro';
UPDATE token_packages SET stripe_price_id = 'price_YOUR_BUSINESS_ID' WHERE tier = 'business';
UPDATE token_packages SET stripe_price_id = 'price_YOUR_ENTERPRISE_ID' WHERE tier = 'enterprise';

-- Verify all are set
SELECT tier, name, tokens, price_cents, stripe_price_id FROM token_packages ORDER BY sort_order;
```

Replace `price_YOUR_*_ID` with the actual Price IDs from Stripe.

## Step 3: Configure Webhook Endpoint

### 3a. Start Local Development Server

```bash
npm run dev
```

Your app should be running on `http://localhost:3000`

### 3b. Install Stripe CLI (if not already installed)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login
```

### 3c. Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

This will output a webhook signing secret like: `whsec_...`

### 3d. Add Webhook Secret to .env.local

Copy the `whsec_...` secret and add it:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef
```

Restart your dev server after adding this.

## Step 4: Test Webhook Events

In a new terminal, trigger a test event:

```bash
stripe trigger payment_intent.succeeded
```

You should see output in both:
1. The `stripe listen` terminal showing the webhook was sent
2. Your Next.js server logs showing it received and processed the webhook

## Step 5: Verify Webhook Handler

Check the webhook processing:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on the webhook endpoint
3. Check "Events" tab to see recent events
4. Verify `payment_intent.succeeded` shows as "Succeeded"

## Production Webhook Setup (When Deploying)

When deploying to production (Netlify):

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-domain.netlify.app/api/stripe/webhooks`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded` (optional)
5. Copy the webhook signing secret
6. Add to Netlify environment variables: `STRIPE_WEBHOOK_SECRET`

## Step 6: Test Complete Purchase Flow

### Test Card Numbers (Stripe Test Mode)

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Require 3D Secure**: 4000 0025 0000 3155

### Test Purchase

1. Go to: http://localhost:3000/tokens/buy
2. Select a token package (e.g., "Pro Pack")
3. Fill in test card details:
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
4. Click "Pay"
5. You should be redirected to `/tokens/success`
6. Check your token balance increased

### Verify in Database

```sql
-- Check token balance increased
SELECT * FROM user_tokens WHERE user_id = 'YOUR_USER_ID';

-- Check transaction was logged
SELECT * FROM token_transactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;

-- Check purchase record
SELECT * FROM token_purchases
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

## Troubleshooting

### "No such price" error
- Make sure you updated the database with correct Stripe Price IDs
- Verify the Price IDs in Stripe Dashboard match the database

### Webhook not receiving events
- Check `stripe listen` is running
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Restart dev server after adding webhook secret
- Check Next.js logs for errors

### Payment succeeds but tokens not credited
- Check webhook handler logs in Next.js terminal
- Verify the webhook signature is valid
- Check Supabase logs for database errors
- Verify user_id in payment metadata matches a real user

### "User not found" error
- Make sure you're logged in (webhook uses user_id from payment metadata)
- Test with a real authenticated user, not just test UUIDs

## Success Checklist

- [ ] 5 Stripe products created with correct metadata
- [ ] Database updated with all Price IDs
- [ ] Webhook endpoint configured and receiving events
- [ ] Test purchase completes successfully
- [ ] Token balance updates in database
- [ ] Transaction logged in `token_transactions`
- [ ] Purchase recorded in `token_purchases`
- [ ] User redirected to success page

## Next Steps

After successful Stripe setup:
1. ✅ Stripe products configured
2. ✅ Webhooks working locally
3. ⏭️  Test token usage (deduction) via AI features
4. ⏭️  Deploy to production
5. ⏭️  Configure production webhooks
