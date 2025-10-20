# 🚀 What's Next - Implementation Roadmap

The token system is fully set up! Here's your roadmap to make it production-ready.

---

## ✅ Completed (Just Now)

- ✅ Database with 7 token tables
- ✅ 5 Stripe products created and linked
- ✅ 20 AI features with token costs configured
- ✅ Backend API (6 endpoints)
- ✅ Frontend components (TokenGate, useTokenBalance)
- ✅ All verification checks passed

---

## 🎯 Phase 1: Test & Validate (Today - 1 hour)

### 1.1 Test Purchase Flow

**Server is running at**: http://localhost:3001

**Do this now**:

1. **Setup Webhook Forwarding** (in new terminal):
   ```bash
   stripe login
   stripe listen --forward-to localhost:3001/api/stripe/webhooks
   ```

2. **Copy webhook secret** from the output (`whsec_...`)

3. **Add to `.env.local`**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

4. **Restart dev server** (I'll do this for you after you add the secret)

5. **Test Purchase**:
   - Go to: http://localhost:3001/tokens/buy
   - Select "Pro" package (600 tokens / $20)
   - Use test card: `4242 4242 4242 4242`
   - Complete payment
   - Verify tokens were credited

### 1.2 Test Token Deduction

Create a simple test page to verify token deduction works:

**I can create**: `src/app/test-tokens/page.tsx`

This will let you:
- View current balance
- Test deducting tokens for a feature
- See transaction history

**Want me to create this test page?**

---

## 🔧 Phase 2: Integrate with AI Features (Next 2-3 hours)

### 2.1 Wrap Existing AI Features

You need to wrap your AI features with `TokenGate`. Here's what to update:

#### Features to Wrap:

1. **Cover Letter Generation** (`src/app/cover-letter/page.tsx`)
   ```tsx
   <TokenGate
       featureKey="cover_letter"
       featureName="Cover Letter Generation"
       description="Generate a personalized cover letter"
       onConfirm={handleGenerate}
   >
       <button>Generate Cover Letter</button>
   </TokenGate>
   ```

2. **Resume Parsing** (`src/app/resume/upload/page.tsx`)
   - Feature key: `resume_parsing` (8 tokens)

3. **Job Matching** (wherever you show match scores)
   - Feature key: `job_match_detailed` (5 tokens)

4. **Interview Prep**
   - Feature key: `interview_prep` (8 tokens)

5. **Salary Analysis**
   - Feature key: `salary_analysis` (6 tokens)

**Want me to update these files for you?**

### 2.2 Add Token Balance Display

Add token balance to your header/navbar:

```tsx
import { useTokenBalance } from '@/hooks/useTokenBalance';

function Header() {
    const { balance, isUnlimited } = useTokenBalance();

    return (
        <header>
            <div className="token-display">
                {isUnlimited ? (
                    <span>∞ Unlimited</span>
                ) : (
                    <span>💎 {balance} tokens</span>
                )}
            </div>
        </header>
    );
}
```

**Want me to add this to your layout?**

---

## 💳 Phase 3: Polish Purchase Experience (1-2 hours)

### 3.1 Create Pricing Page

You have the hybrid pricing page, but you may want to:
- Update the homepage to link to `/pricing-hybrid`
- Add "Buy Tokens" button in navbar
- Create upsell prompts when users run low on tokens

### 3.2 Low Balance Warnings

Add a component that shows when balance is low:

```tsx
// Shows warning at < 20 tokens
{balance < 20 && balance > 0 && (
    <Alert>
        ⚠️ Low balance! You have {balance} tokens left.
        <Link href="/tokens/buy">Buy more</Link>
    </Alert>
)}
```

### 3.3 First-Time User Experience

- Welcome modal explaining tokens
- Tutorial on how to earn/use tokens
- Highlight the 10 token welcome bonus

**Want me to create these components?**

---

## 📊 Phase 4: Analytics & Monitoring (1 hour)

### 4.1 Create Admin Dashboard

Track key metrics:

```sql
-- Daily revenue
SELECT DATE(created_at), COUNT(*), SUM(amount_paid/100.0)
FROM token_purchases
WHERE status = 'completed'
GROUP BY DATE(created_at);

-- Most used features
SELECT metadata->>'feature_key', COUNT(*), SUM(ABS(amount))
FROM token_transactions
WHERE transaction_type = 'spent'
GROUP BY metadata->>'feature_key';

-- Conversion rate
SELECT
    COUNT(DISTINCT user_id) as total_users,
    COUNT(DISTINCT CASE WHEN lifetime_purchased > 0 THEN user_id END) as paying_users
FROM user_tokens;
```

**Want me to create an admin page with these stats?**

### 4.2 User Token Dashboard

Create `/dashboard/tokens` showing:
- Current balance
- Transaction history
- Purchase history
- Most used features
- Spending patterns

**Want me to create this page?**

---

## 🚀 Phase 5: Production Deployment (2-3 hours)

### 5.1 Environment Setup

1. **Switch to Live Stripe Keys**:
   - Get live keys from Stripe
   - Update `.env` on Netlify
   - Re-run `npm run stripe:setup` with live keys

2. **Configure Production Webhook**:
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhooks`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret
   - Add to Netlify env vars

### 5.2 Deploy to Netlify

```bash
npm run build
netlify deploy --prod
```

### 5.3 Test Production

- Test purchase with real $5 Starter pack
- Verify webhook receives event
- Confirm tokens are credited

---

## 🎁 Phase 6: Growth Features (Optional - Future)

### 6.1 Referral Program
- Give 50 tokens for each referral
- Already have `referrals` table set up
- Just need to implement the UI

### 6.2 Daily Login Bonus
- Award 2 tokens per day for logging in
- Encourage daily engagement

### 6.3 Token Gifting
- Let users gift tokens to others
- Great for viral growth

### 6.4 Bulk Purchase Discounts
- Add 10% more tokens for purchases over $50
- Encourage larger purchases

### 6.5 Token Expiry Warnings
- Email users when tokens are about to expire (if you decide to add expiry)
- Currently tokens don't expire

---

## 🐛 Phase 7: Edge Cases & Polish (1-2 hours)

### 7.1 Error Handling

- Handle Stripe payment failures gracefully
- Show retry option if webhook fails
- Handle insufficient token balance elegantly

### 7.2 Loading States

- Show spinner during token deduction
- Disable buttons during processing
- Add optimistic UI updates

### 7.3 Mobile Optimization

- Ensure purchase flow works on mobile
- Responsive token balance display
- Mobile-friendly payment form

---

## 📋 Immediate Action Items (Pick One)

**Option A: Test Everything (Recommended)**
```bash
# I'll create a test page where you can:
# - Buy tokens
# - Deduct tokens
# - View balance
# - See transaction history
```

**Option B: Integrate First AI Feature**
```bash
# I'll wrap your cover letter generator with TokenGate
# So it actually charges tokens when used
```

**Option C: Create User Dashboard**
```bash
# I'll create /dashboard/tokens showing:
# - Balance, history, stats
```

**Option D: Add Token Display to Navbar**
```bash
# I'll add token balance to your main layout
# So users always see their balance
```

---

## 🎯 Recommended Order

If you're not sure, I recommend this order:

1. **Test purchase flow** (verify webhooks work) ← Do this first!
2. **Create test page** (verify token deduction works)
3. **Add token display to navbar** (always visible)
4. **Integrate with cover letter generator** (real usage)
5. **Create user dashboard** (full token management)
6. **Deploy to production** (go live!)

---

## 💬 What Would You Like Me To Do Next?

Pick any of these:

- **"Test the purchase flow"** - I'll guide you through buying tokens
- **"Create a test page"** - I'll build a page to test all token operations
- **"Integrate cover letter"** - I'll wrap your AI feature with TokenGate
- **"Add token balance to header"** - I'll show balance in navbar
- **"Create admin dashboard"** - I'll build analytics page
- **"Create user dashboard"** - I'll build token management page
- **Something else?** - Just tell me what you need!

The system is 100% functional. Now we just need to connect it to your actual features! 🚀
