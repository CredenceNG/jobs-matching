# Token-Based Pricing Strategy for JobAI

## Overview

Replace monthly subscriptions with a **token credit system** similar to OpenAI. Users purchase token packages and spend them on AI features. This model offers:

- **Pay-as-you-go flexibility** - Only pay for what you use
- **No recurring charges** - One-time purchases, no subscriptions
- **Transparent pricing** - Clear cost per action
- **Better for occasional users** - No wasted subscription fees
- **Scalable for power users** - Buy more when needed

---

## Token Pricing Structure

### Token Packages

| Package | Tokens | Price | Price per Token | Savings | Best For |
|---------|--------|-------|----------------|---------|----------|
| **Starter** | 100 | $5 | $0.050 | - | Trying out features |
| **Basic** | 250 | $10 | $0.040 | 20% | Occasional job search |
| **Pro** | 600 | $20 | $0.033 | 34% | Active job seekers |
| **Power** | 1,500 | $40 | $0.027 | 46% | Heavy users |
| **Enterprise** | 5,000 | $100 | $0.020 | 60% | Recruiters/Teams |

### Token Economics

- **Tokens never expire** - Use them anytime
- **Volume discounts** - Bigger packages = lower per-token cost
- **Rollover credits** - Unused tokens stay in your account
- **Refillable** - Buy more tokens when you run low
- **Gift tokens** - Transfer tokens to others (future feature)

---

## Feature Cost Breakdown

### 🔍 Job Search Features (Free Tier)

| Feature | Token Cost | Notes |
|---------|-----------|-------|
| **Basic Job Search** | 0 tokens | Always free |
| **View Job Listings** | 0 tokens | Always free |
| **Apply to Jobs** | 0 tokens | Always free |
| **Save Jobs** | 0 tokens | Always free (local storage only) |

### 🤖 AI-Powered Features (Premium - Token-Based)

| Feature | Token Cost | Notes |
|---------|-----------|-------|
| **AI Job Matching (Simple)** | 2 tokens | Quick compatibility score |
| **AI Job Matching (Detailed)** | 5 tokens | Full analysis with reasoning |
| **Resume Parsing** | 8 tokens | One-time per resume upload |
| **AI Resume Analysis** | 10 tokens | Comprehensive feedback |
| **Resume Optimization** | 15 tokens | AI-powered improvements |
| **Cover Letter Generation** | 12 tokens | Tailored to job posting |
| **Interview Prep Questions** | 8 tokens | 10-15 questions per job |
| **Interview Answer Feedback** | 5 tokens | AI critique per answer |
| **Career Insights Report** | 20 tokens | Weekly personalized insights |
| **Salary Analysis** | 6 tokens | Market data + negotiation tips |
| **Company Research** | 4 tokens | AI-compiled company info |
| **Skill Gap Analysis** | 10 tokens | Compare skills vs market |

### 📊 Data & Automation Features

| Feature | Token Cost | Notes |
|---------|-----------|-------|
| **Saved Search (30 days)** | 5 tokens | One-time fee for 30 days |
| **Job Alert (per week)** | 2 tokens | Auto-renews if tokens available |
| **Application Tracking** | 0 tokens | Free (basic tracking) |
| **Export to PDF** | 1 token | Per export |
| **Export to CSV** | 1 token | Per export |
| **Advanced Filters** | 0 tokens | Free |

---

## Pricing Rationale

### Cost-Based Pricing

Actual AI API costs (approximate):

- **Claude Sonnet 4.5**: $3 per 1M input tokens, $15 per 1M output tokens
- **GPT-4o-mini**: $0.15 per 1M input tokens, $0.60 per 1M output tokens

Example: Detailed Job Matching
- Input: ~2,000 tokens (user profile + job description)
- Output: ~800 tokens (analysis)
- Cost with Claude: ~$0.006 per match
- **Charge: 5 tokens ($0.25)** = **41x markup** (industry standard for SaaS)

### Value-Based Pricing

Comparison to subscription model:

**Old Subscription Model**:
- Premium: $5/month → $60/year
- Assumes ~30 AI actions per month (360/year)

**New Token Model**:
- 600 tokens for $20
- 600 tokens = ~120 detailed AI actions (depending on feature mix)
- Cost per action: $0.033 per token × average 5 tokens/action = **$0.165**
- Annual cost for 30 actions/month: **$59.40** (similar to subscription)

**User wins**:
- No commitment
- Pay only for what you use
- Tokens don't expire
- Can use sparingly or in bursts

---

## User Scenarios & Token Usage

### Scenario 1: Casual Job Seeker (Sarah)
*Checking market every few months*

**Usage over 6 months**:
- 10 detailed job matches: 50 tokens
- 2 cover letters: 24 tokens
- 1 resume analysis: 10 tokens
- 1 interview prep: 8 tokens

**Total: 92 tokens** → $5 Starter Package (100 tokens)
**Savings vs subscription**: $30 (avoided 6 months × $5)

### Scenario 2: Active Job Seeker (Mike)
*Actively applying for 2 months*

**Usage over 2 months**:
- 30 detailed job matches: 150 tokens
- 8 cover letters: 96 tokens
- 3 interview preps: 24 tokens
- 2 resume optimizations: 30 tokens
- 4 salary analyses: 24 tokens
- 2 saved searches (30 days each): 10 tokens

**Total: 334 tokens** → $20 Pro Package (600 tokens)
**Savings vs subscription**: Same cost as 4 months subscription ($20), but with 266 tokens remaining

### Scenario 3: Power User (Alex)
*Career coach helping multiple people*

**Usage per month**:
- 100 job matches: 500 tokens
- 30 cover letters: 360 tokens
- 20 resume analyses: 200 tokens
- 15 interview preps: 120 tokens

**Total: 1,180 tokens/month** → $40 Power Package (1,500 tokens) every 1.5 months
**Annual cost**: ~$320
**Comparable subscription**: Would need "unlimited" tier at $29-49/month ($348-588/year)

---

## Free Tier Strategy

### What Stays Free

1. **Core Job Search**
   - Browse all job listings
   - Basic filters (location, salary, type)
   - Apply to jobs via external links
   - Local job saving (browser storage)

2. **First-Time Bonuses**
   - 10 free tokens on signup
   - 5 bonus tokens for email verification
   - 3 tokens for completing profile

3. **Earn Free Tokens**
   - 2 tokens per referral signup
   - 5 tokens per referred user who buys tokens
   - 1 token for daily login streak (max 5/week)

### Token-Gated Features

Everything using AI costs tokens. This creates clear value:
- **Free users**: Can browse and apply
- **Token users**: Get AI superpowers

---

## Token Display & UX

### Token Balance Display

```
┌──────────────────────────────────────┐
│  💎 Your Token Balance               │
│                                      │
│         248 tokens                   │
│                                      │
│  ≈ 50 AI job matches                │
│  ≈ 20 cover letters                 │
│  ≈ 25 resume analyses               │
│                                      │
│  [ Buy More Tokens ]                │
└──────────────────────────────────────┘
```

### Before AI Action

```
┌──────────────────────────────────────┐
│  Generate AI Cover Letter            │
│                                      │
│  Cost: 12 tokens                     │
│  Your balance: 248 tokens            │
│                                      │
│  After this action: 236 tokens       │
│                                      │
│  [ Generate ] [ Cancel ]            │
└──────────────────────────────────────┘
```

### Low Balance Warning

```
┌──────────────────────────────────────┐
│  ⚠️ Low Token Balance                │
│                                      │
│  You have 8 tokens remaining         │
│                                      │
│  Not enough for:                     │
│  • Resume Analysis (10 tokens)       │
│  • Cover Letter (12 tokens)         │
│                                      │
│  [ Buy Tokens Now ]                 │
└──────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Token Infrastructure
- [ ] Create `tokens` table in Supabase
- [ ] Add token balance to user profiles
- [ ] Implement token deduction logic
- [ ] Add transaction history

### Phase 2: Payment Integration
- [ ] Stripe product setup for token packages
- [ ] Checkout flow for token purchase
- [ ] Webhook for crediting tokens
- [ ] Receipt generation

### Phase 3: Feature Gating
- [ ] Add token check middleware
- [ ] Update UI to show token costs
- [ ] Implement "insufficient tokens" modal
- [ ] Add token usage analytics

### Phase 4: Gamification
- [ ] Daily login rewards
- [ ] Referral system
- [ ] Achievement badges (e.g., "Power User: Spent 1000 tokens")
- [ ] Token gift system

---

## Migration from Subscription Model

### For Existing Users (if any)

**Option 1: Convert Subscription to Tokens**
- Monthly $5 plan → 250 tokens/month (converted once)
- Annual $48 plan → 600 tokens upfront

**Option 2: Grandfather Premium Users**
- Keep subscription active
- Give unlimited tokens while subscribed
- Offer conversion bonus: 500 extra tokens to switch

### Messaging

> **We're Going Token-Based! 🎉**
>
> Pay only for what you use. No more monthly charges!
>
> Your current plan: Premium ($5/month)
> **Convert now and get 500 tokens ($16.50 value) for just $10**
>
> That's 200 bonus tokens FREE!

---

## Competitive Analysis

### Similar Token Models

**OpenAI ChatGPT**:
- Pay-per-use tokens
- Volume discounts
- Enterprise plans available

**Anthropic Claude**:
- Credit-based pricing
- $5 minimum purchase
- API usage tracked

**Jasper AI** (Content Writing):
- Credit system
- Credits = words generated
- $39/month for 50K credits

**Copy.ai**:
- Word credits
- 2,000 free words/month
- Paid plans: $49/month unlimited

### JobAI Advantage

- **Lower entry cost**: $5 vs $10-49/month subscriptions
- **No expiration**: Competitors often have monthly credit resets
- **Transparent pricing**: Clear token cost per feature
- **Flexible**: Use tokens across multiple features

---

## Financial Projections

### Revenue Model

**Assumptions**:
- 1,000 monthly active users
- 30% conversion to token buyers
- Average purchase: $15 (400 tokens)

**Monthly Revenue**:
- 300 paying users × $15 = **$4,500/month**

**Annual Revenue**:
- $4,500 × 12 = **$54,000/year**

### Cost Analysis

**AI API Costs**:
- Average 5 tokens per action = $0.165 per action (at $0.033/token)
- Actual cost: ~$0.01 per action (depending on feature)
- **Profit margin: 94%** (standard for SaaS)

**Infrastructure**:
- Supabase: $25/month
- Netlify: $19/month
- Stripe fees: 2.9% + $0.30 per transaction
- Total fixed costs: ~$100/month

**Net Profit**: $4,400/month × 12 = **$52,800/year**

---

## Risks & Mitigation

### Risk 1: Users Hoard Tokens
**Problem**: Users buy tokens but don't use them
**Mitigation**:
- Gamification to encourage usage
- "Expiring bonus tokens" (promotional only)
- Regular feature updates to drive engagement

### Risk 2: Token Abuse
**Problem**: Users share accounts or exploit free tokens
**Mitigation**:
- Rate limiting per IP
- Require email verification for free tokens
- Monitor suspicious patterns

### Risk 3: Pricing Complexity
**Problem**: Users confused by token costs
**Mitigation**:
- Simple token packages ($5, $10, $20)
- Clear cost display before each action
- "Recommended package" based on usage

### Risk 4: Lower Revenue Than Subscription
**Problem**: Users spend less with tokens than with subscriptions
**Mitigation**:
- Optimize token costs to match subscription value
- Upsell larger packages with better discounts
- Add subscription option for power users (unlimited tokens/month)

---

## Hybrid Model (Alternative)

Offer both tokens AND subscription:

| Plan | Price | Tokens/Month | Best For |
|------|-------|--------------|----------|
| **Pay-as-you-go** | Variable | Buy as needed | Occasional users |
| **Basic Subscription** | $10/month | 300 tokens | Regular users |
| **Pro Subscription** | $20/month | 800 tokens | Power users |
| **Unlimited** | $50/month | Unlimited | Heavy users |

**Advantages**:
- Captures both user types
- Subscription provides predictable revenue
- Tokens offer flexibility

**Disadvantages**:
- More complex to implement
- Two pricing models to maintain

---

## Recommended Token Costs (Final)

Based on value, competition, and costs:

### High-Value Features (10-20 tokens)
- Resume Optimization (15 tokens)
- Career Insights Report (20 tokens)
- Resume Analysis (10 tokens)

### Medium-Value Features (5-12 tokens)
- Detailed Job Matching (5 tokens)
- Cover Letter Generation (12 tokens)
- Interview Prep (8 tokens)

### Quick Features (2-6 tokens)
- Simple Job Matching (2 tokens)
- Salary Analysis (6 tokens)
- Company Research (4 tokens)
- Interview Feedback (5 tokens)

### Utility Features (1-5 tokens)
- Saved Search (5 tokens for 30 days)
- Job Alerts (2 tokens/week)
- PDF Export (1 token)

---

## Next Steps

1. ✅ **Validate pricing** with beta users (survey/interviews)
2. ✅ **Build token system** (database, middleware, UI)
3. ✅ **Integrate Stripe** for token purchases
4. ✅ **Update UI** to show token costs everywhere
5. ✅ **Launch with free tokens** (10-20 per user) to drive adoption
6. ✅ **Monitor usage** and adjust token costs based on data
7. ✅ **Add referral system** to grow virally

---

## Conclusion

**Token-based pricing is ideal for JobAI because**:
- ✅ Removes subscription barrier for casual users
- ✅ Fair pricing aligned with usage
- ✅ Higher perceived value (users see exact costs)
- ✅ Flexible for different user types
- ✅ Easier to upsell (just buy more tokens)
- ✅ No churn management (tokens never expire)

**Recommended starting packages**:
- $5 → 100 tokens (trial users)
- $10 → 250 tokens (occasional users)
- $20 → 600 tokens (active users - best value)

Start with token model, monitor for 3-6 months, then consider hybrid model if needed.
