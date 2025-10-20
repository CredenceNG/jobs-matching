# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe payments for the JobAI premium subscription system.

## 🎯 Overview

The JobAI platform uses Stripe for:

- Premium subscription billing ($29/month)
- Secure payment processing
- Subscription management (upgrades, downgrades, cancellations)
- Webhook event handling

## 📋 Prerequisites

1. **Stripe Account**: Create a free account at [stripe.com](https://stripe.com)
2. **Test Mode**: Start with Stripe's test mode for development
3. **Webhooks**: Configure webhook endpoints for subscription events

## 🔧 Step-by-Step Setup

### Step 1: Create Stripe Account & Get API Keys

1. **Sign up** at [stripe.com](https://stripe.com)
2. **Navigate** to Dashboard → Developers → API Keys
3. **Copy** your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Step 2: Create Premium Product & Price

1. **Go to** Dashboard → Products
2. **Click** "Add product"
3. **Fill in** product details:
   - **Name**: JobAI Premium
   - **Description**: Unlimited AI job matching, resume analysis, and career insights
4. **Add pricing**:
   - **Price**: $29.00
   - **Billing**: Monthly recurring
   - **Currency**: USD
5. **Save** and copy the **Price ID** (starts with `price_`)

### Step 3: Set Up Webhooks

1. **Navigate** to Dashboard → Developers → Webhooks
2. **Click** "Add endpoint"
3. **Endpoint URL**: `https://your-domain.com/api/stripe/webhooks`
4. **Select events**:
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.payment_succeeded
   invoice.payment_failed
   customer.subscription.trial_will_end
   ```
5. **Save** and copy the **Webhook Secret** (starts with `whsec_`)

### Step 4: Configure Environment Variables

Add to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_price_id_here
```

### Step 5: Database Setup

Add Stripe-related fields to your users table (if not already present):

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;
```

## 🧪 Testing

### Test Cards

Use these test card numbers in development:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0000 0000 3220
```

- **Expiry**: Any future date
- **CVC**: Any 3-digit number
- **ZIP**: Any valid ZIP code

### Test Subscription Flow

1. **Sign up** for a premium account
2. **Use test card** for payment
3. **Verify** subscription in Stripe Dashboard
4. **Check** user status in your database

## 🚀 Going Live

### Step 1: Activate Live Mode

1. **Complete** Stripe account setup
2. **Activate** your account
3. **Switch** to Live mode in Dashboard

### Step 2: Update Environment Variables

Replace test keys with live keys:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_secret_here
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_live_price_id_here
```

### Step 3: Update Webhook Endpoint

Update your webhook endpoint URL to your production domain:

```
https://your-production-domain.com/api/stripe/webhooks
```

## 📊 Features Included

### ✅ Complete Payment Flow

- Secure card input with Stripe Elements
- 3D Secure authentication support
- Real-time payment status updates
- Subscription confirmation

### ✅ Subscription Management

- Premium account activation
- Automatic billing cycles
- Subscription status tracking
- Cancellation handling

### ✅ Webhook Event Handling

- Payment success/failure
- Subscription updates
- Account downgrades
- Trial period management

### ✅ User Experience

- Professional checkout UI
- Loading states and error handling
- Success confirmations
- Mobile-responsive design

## 🔒 Security Features

- **Webhook signature verification** prevents malicious requests
- **Server-side validation** ensures payment integrity
- **Secure key management** with environment variables
- **PCI compliance** through Stripe Elements

## 💰 Pricing Structure

```typescript
Premium Plan: $29/month
- 200 AI job matches per day
- Unlimited resume analyses
- Unlimited cover letters
- Advanced interview prep
- Career insights & analytics
- Priority AI processing
- Export functionality
```

## 🛠 Troubleshooting

### Common Issues

**Issue**: Webhook signature verification fails
**Solution**: Ensure webhook secret is correct and payload is raw

**Issue**: Payment fails with test cards
**Solution**: Verify test card numbers and ensure test mode is active

**Issue**: Subscription not updating in database
**Solution**: Check webhook endpoint URL and event selection

### Debug Logs

Check these locations for debugging:

- Stripe Dashboard → Logs
- Browser Console for client errors
- Server logs for API errors
- Webhook endpoint logs

## 📞 Support

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Test Mode**: Always test before going live
- **Webhook Testing**: Use Stripe CLI for local development

## 🎉 Congratulations!

Your Stripe integration is now complete! Users can:

- Sign up for premium accounts with payment
- Upgrade/downgrade subscriptions
- Manage billing automatically
- Access premium features immediately

The system handles all payment complexities, subscription management, and provides a seamless user experience for premium upgrades.
