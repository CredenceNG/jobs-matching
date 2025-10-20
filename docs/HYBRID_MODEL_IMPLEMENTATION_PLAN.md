# Hybrid Model Implementation Plan
## Adding Token System to Existing Subscription Model

---

## Executive Summary

**Goal**: Implement a hybrid pricing model that offers both tokens (pay-as-you-go) and subscriptions (unlimited monthly usage).

**Timeline**: 2-3 weeks for full implementation

**Approach**:
1. Keep existing subscription infrastructure
2. Add token system in parallel
3. Allow users to choose their preferred model
4. Subscriptions get "unlimited tokens" conceptually

---

## Hybrid Pricing Structure

### Option 1: Pay-As-You-Go (Tokens)

| Package | Tokens | Price | Savings | Best For |
|---------|--------|-------|---------|----------|
| **Starter** | 100 | $5 | - | Trial users |
| **Basic** | 250 | $10 | 20% | Occasional users |
| **Pro** | 600 | $20 | 34% | Active seekers |
| **Power** | 1,500 | $40 | 46% | Heavy users |

### Option 2: Subscriptions (Unlimited)

| Plan | Price | Tokens/Month | Features |
|------|-------|--------------|----------|
| **Monthly** | $5/month | Unlimited* | All AI features unlimited |
| **Annual** | $48/year ($4/mo) | Unlimited* | Save 20% + unlimited AI |

*Unlimited = No token deduction, but rate-limited to prevent abuse (e.g., 100 AI actions/day)

### Hybrid Benefits

**For Users**:
- ✅ Choice: Pick what fits their usage pattern
- ✅ Flexibility: Start with tokens, upgrade to subscription
- ✅ No pressure: Try tokens first, commit later
- ✅ Best value: Subscription = unlimited if using heavily

**For Business**:
- ✅ Recurring revenue from subscriptions
- ✅ Higher LTV from token power users
- ✅ Lower barrier with tokens
- ✅ Upsell path: tokens → subscription

---

## Database Schema

### New Tables

```sql
-- Token balances and metadata
CREATE TABLE user_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    lifetime_purchased INTEGER DEFAULT 0,
    lifetime_earned INTEGER DEFAULT 0,
    lifetime_spent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Token transaction history
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    amount INTEGER NOT NULL, -- Positive for credit, negative for debit
    type VARCHAR(50) NOT NULL, -- 'purchase', 'spent', 'earned', 'bonus', 'refund'
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB, -- Store feature used, package bought, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_user_transactions (user_id, created_at DESC),
    INDEX idx_transaction_type (type)
);

-- Token packages (for purchase options)
CREATE TABLE token_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    tokens INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    discount_percentage INTEGER DEFAULT 0,
    popular BOOLEAN DEFAULT FALSE,
    best_value BOOLEAN DEFAULT FALSE,
    stripe_price_id VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature token costs (configurable)
CREATE TABLE feature_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_key VARCHAR(100) UNIQUE NOT NULL, -- 'job_match_detailed', 'cover_letter', etc.
    feature_name VARCHAR(255) NOT NULL,
    token_cost INTEGER NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'job_search', 'resume', 'career', etc.
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token purchases (Stripe payments)
CREATE TABLE token_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    package_id UUID REFERENCES token_packages(id),
    tokens_purchased INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    INDEX idx_user_purchases (user_id, created_at DESC)
);

-- Subscription modifications (extend existing)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS
    unlimited_tokens BOOLEAN DEFAULT FALSE;

-- Daily usage tracking (for rate limiting)
CREATE TABLE daily_token_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    date DATE NOT NULL,
    tokens_spent INTEGER DEFAULT 0,
    actions_count INTEGER DEFAULT 0,
    metadata JSONB, -- Track which features used
    UNIQUE(user_id, date),
    INDEX idx_user_date (user_id, date DESC)
);
```

### Seed Data

```sql
-- Insert default token packages
INSERT INTO token_packages (name, tokens, price_cents, discount_percentage, popular, best_value, active) VALUES
    ('Starter', 100, 500, 0, FALSE, FALSE, TRUE),
    ('Basic', 250, 1000, 20, FALSE, FALSE, TRUE),
    ('Pro', 600, 2000, 34, TRUE, TRUE, TRUE),
    ('Power', 1500, 4000, 46, FALSE, FALSE, TRUE),
    ('Enterprise', 5000, 10000, 60, FALSE, FALSE, TRUE);

-- Insert feature costs
INSERT INTO feature_costs (feature_key, feature_name, token_cost, description, category, active) VALUES
    ('job_match_simple', 'Simple Job Match', 2, 'Quick compatibility score', 'job_search', TRUE),
    ('job_match_detailed', 'Detailed Job Match', 5, 'Full AI analysis with reasoning', 'job_search', TRUE),
    ('resume_parsing', 'Resume Parsing', 8, 'Extract data from resume upload', 'resume', TRUE),
    ('resume_analysis', 'Resume Analysis', 10, 'Comprehensive feedback on resume', 'resume', TRUE),
    ('resume_optimization', 'Resume Optimization', 15, 'AI-powered improvements', 'resume', TRUE),
    ('cover_letter', 'Cover Letter Generation', 12, 'Tailored cover letter for job', 'application', TRUE),
    ('interview_prep', 'Interview Preparation', 8, '10-15 likely interview questions', 'interview', TRUE),
    ('interview_feedback', 'Interview Answer Feedback', 5, 'AI critique on practice answers', 'interview', TRUE),
    ('career_insights', 'Career Insights Report', 20, 'Weekly personalized career report', 'career', TRUE),
    ('salary_analysis', 'Salary Analysis', 6, 'Market data + negotiation tips', 'career', TRUE),
    ('company_research', 'Company Research', 4, 'AI-compiled company information', 'job_search', TRUE),
    ('skill_gap_analysis', 'Skill Gap Analysis', 10, 'Compare skills vs market demand', 'career', TRUE),
    ('saved_search', 'Saved Search (30 days)', 5, 'Save and track search for 30 days', 'automation', TRUE),
    ('job_alert_weekly', 'Job Alert (per week)', 2, 'Weekly email alerts for matches', 'automation', TRUE);
```

---

## Implementation Phases

### Phase 1: Database Setup (Day 1-2)

**Tasks**:
- [ ] Create Supabase migration for new tables
- [ ] Run migration on dev database
- [ ] Seed token packages and feature costs
- [ ] Test database constraints and indexes

**Files to create**:
```
supabase/migrations/20250115_add_token_system.sql
supabase/seed_token_data.sql
```

**Testing**:
```sql
-- Test token balance update
INSERT INTO user_tokens (user_id, balance) VALUES ('user-uuid', 100);
UPDATE user_tokens SET balance = balance - 5 WHERE user_id = 'user-uuid';

-- Test transaction logging
INSERT INTO token_transactions (user_id, amount, type, balance_before, balance_after, description)
VALUES ('user-uuid', -5, 'spent', 100, 95, 'Used for detailed job match');
```

---

### Phase 2: Backend API (Day 3-5)

#### Token Service Layer

**File**: `src/lib/tokens/token-service.ts`

```typescript
/**
 * Token Service
 *
 * Core business logic for token operations
 * Handles balance checks, deductions, purchases, and history
 */

import { createClient } from '@/lib/supabase/server';

export class TokenService {
    /**
     * Get user's current token balance
     * @description Fetches balance from database
     * @cost Free operation (no tokens charged)
     */
    static async getBalance(userId: string): Promise<number> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('user_tokens')
            .select('balance')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            // Initialize if doesn't exist
            await this.initializeUserTokens(userId);
            return 0;
        }

        return data.balance;
    }

    /**
     * Check if user has unlimited tokens (via subscription)
     */
    static async hasUnlimitedTokens(userId: string): Promise<boolean> {
        const supabase = createClient();

        const { data } = await supabase
            .from('subscriptions')
            .select('status, unlimited_tokens')
            .eq('user_id', userId)
            .single();

        return data?.status === 'active' && data?.unlimited_tokens === true;
    }

    /**
     * Check if user can afford a feature
     * @returns { canAfford: boolean, balance: number, required: number }
     */
    static async canAffordFeature(
        userId: string,
        featureKey: string
    ): Promise<{ canAfford: boolean; balance: number; required: number }> {
        // Check if unlimited first
        const isUnlimited = await this.hasUnlimitedTokens(userId);
        if (isUnlimited) {
            return { canAfford: true, balance: Infinity, required: 0 };
        }

        const balance = await this.getBalance(userId);
        const cost = await this.getFeatureCost(featureKey);

        return {
            canAfford: balance >= cost,
            balance,
            required: cost
        };
    }

    /**
     * Deduct tokens for a feature usage
     * @throws Error if insufficient tokens
     */
    static async deductTokens(
        userId: string,
        featureKey: string,
        metadata?: Record<string, any>
    ): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
        // Check unlimited first
        const isUnlimited = await this.hasUnlimitedTokens(userId);
        if (isUnlimited) {
            // Log usage but don't deduct
            await this.logSubscriptionUsage(userId, featureKey, metadata);
            return { success: true, newBalance: Infinity, transactionId: 'unlimited' };
        }

        const supabase = createClient();
        const cost = await this.getFeatureCost(featureKey);

        // Atomic transaction
        const { data: currentBalance } = await supabase
            .from('user_tokens')
            .select('balance')
            .eq('user_id', userId)
            .single();

        if (!currentBalance || currentBalance.balance < cost) {
            throw new Error('INSUFFICIENT_TOKENS');
        }

        // Deduct tokens
        const newBalance = currentBalance.balance - cost;

        const { error: updateError } = await supabase
            .from('user_tokens')
            .update({
                balance: newBalance,
                lifetime_spent: supabase.raw('lifetime_spent + ?', [cost])
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        // Log transaction
        const { data: transaction } = await supabase
            .from('token_transactions')
            .insert({
                user_id: userId,
                amount: -cost,
                type: 'spent',
                balance_before: currentBalance.balance,
                balance_after: newBalance,
                description: `Used for ${featureKey}`,
                metadata: { feature_key: featureKey, ...metadata }
            })
            .select('id')
            .single();

        return {
            success: true,
            newBalance,
            transactionId: transaction?.id || ''
        };
    }

    /**
     * Add tokens (from purchase or bonus)
     */
    static async addTokens(
        userId: string,
        amount: number,
        type: 'purchase' | 'earned' | 'bonus',
        description: string,
        metadata?: Record<string, any>
    ): Promise<number> {
        const supabase = createClient();

        const currentBalance = await this.getBalance(userId);
        const newBalance = currentBalance + amount;

        await supabase
            .from('user_tokens')
            .update({
                balance: newBalance,
                lifetime_purchased: type === 'purchase'
                    ? supabase.raw('lifetime_purchased + ?', [amount])
                    : supabase.raw('lifetime_purchased'),
                lifetime_earned: type === 'earned' || type === 'bonus'
                    ? supabase.raw('lifetime_earned + ?', [amount])
                    : supabase.raw('lifetime_earned')
            })
            .eq('user_id', userId);

        // Log transaction
        await supabase
            .from('token_transactions')
            .insert({
                user_id: userId,
                amount,
                type,
                balance_before: currentBalance,
                balance_after: newBalance,
                description,
                metadata
            });

        return newBalance;
    }

    /**
     * Get feature cost from database
     */
    static async getFeatureCost(featureKey: string): Promise<number> {
        const supabase = createClient();

        const { data } = await supabase
            .from('feature_costs')
            .select('token_cost')
            .eq('feature_key', featureKey)
            .eq('active', true)
            .single();

        return data?.token_cost || 0;
    }

    /**
     * Get all feature costs (for displaying to users)
     */
    static async getAllFeatureCosts(): Promise<Record<string, number>> {
        const supabase = createClient();

        const { data } = await supabase
            .from('feature_costs')
            .select('feature_key, token_cost')
            .eq('active', true);

        return data?.reduce((acc, item) => {
            acc[item.feature_key] = item.token_cost;
            return acc;
        }, {} as Record<string, number>) || {};
    }

    /**
     * Get transaction history
     */
    static async getTransactionHistory(
        userId: string,
        limit: number = 50
    ): Promise<any[]> {
        const supabase = createClient();

        const { data } = await supabase
            .from('token_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        return data || [];
    }

    /**
     * Initialize user tokens (first time)
     */
    private static async initializeUserTokens(userId: string): Promise<void> {
        const supabase = createClient();

        await supabase
            .from('user_tokens')
            .insert({
                user_id: userId,
                balance: 10, // Welcome bonus
                lifetime_earned: 10
            });

        // Log welcome bonus
        await supabase
            .from('token_transactions')
            .insert({
                user_id: userId,
                amount: 10,
                type: 'bonus',
                balance_before: 0,
                balance_after: 10,
                description: 'Welcome bonus'
            });
    }

    /**
     * Log subscription usage (for analytics)
     */
    private static async logSubscriptionUsage(
        userId: string,
        featureKey: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        const supabase = createClient();
        const today = new Date().toISOString().split('T')[0];

        // Upsert daily usage
        await supabase
            .from('daily_token_usage')
            .upsert({
                user_id: userId,
                date: today,
                actions_count: supabase.raw('COALESCE(actions_count, 0) + 1'),
                metadata: supabase.raw(`COALESCE(metadata, '{}')::jsonb || ?::jsonb`, [
                    JSON.stringify({ [featureKey]: 1 })
                ])
            }, {
                onConflict: 'user_id,date'
            });
    }
}
```

#### API Endpoints

**File**: `src/app/api/tokens/balance/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/tokens/token-service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const balance = await TokenService.getBalance(user.id);
        const isUnlimited = await TokenService.hasUnlimitedTokens(user.id);

        return NextResponse.json({
            balance,
            unlimited: isUnlimited
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
```

**File**: `src/app/api/tokens/deduct/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/tokens/token-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { featureKey, metadata } = body;

        // Check affordability first
        const affordability = await TokenService.canAffordFeature(user.id, featureKey);

        if (!affordability.canAfford) {
            return NextResponse.json(
                {
                    error: 'INSUFFICIENT_TOKENS',
                    balance: affordability.balance,
                    required: affordability.required
                },
                { status: 402 } // Payment Required
            );
        }

        // Deduct tokens
        const result = await TokenService.deductTokens(user.id, featureKey, metadata);

        return NextResponse.json(result);
    } catch (error: any) {
        if (error.message === 'INSUFFICIENT_TOKENS') {
            return NextResponse.json(
                { error: 'Insufficient tokens' },
                { status: 402 }
            );
        }

        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
```

**File**: `src/app/api/tokens/history/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/tokens/token-service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const history = await TokenService.getTransactionHistory(user.id, limit);

        return NextResponse.json({ transactions: history });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
```

**File**: `src/app/api/tokens/purchase/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16'
});

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { packageId } = body;

        // Get package details
        const { data: pkg } = await supabase
            .from('token_packages')
            .select('*')
            .eq('id', packageId)
            .single();

        if (!pkg) {
            return NextResponse.json(
                { error: 'Package not found' },
                { status: 404 }
            );
        }

        // Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: pkg.price_cents,
            currency: 'usd',
            metadata: {
                user_id: user.id,
                package_id: pkg.id,
                tokens: pkg.tokens
            }
        });

        // Log pending purchase
        await supabase
            .from('token_purchases')
            .insert({
                user_id: user.id,
                package_id: pkg.id,
                tokens_purchased: pkg.tokens,
                amount_cents: pkg.price_cents,
                stripe_payment_intent_id: paymentIntent.id,
                status: 'pending'
            });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            packageDetails: pkg
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
```

---

### Phase 3: Stripe Webhook Integration (Day 6-7)

**File**: `src/app/api/webhooks/stripe/route.ts`

Add token purchase handling:

```typescript
// Add to existing webhook handler
case 'payment_intent.succeeded': {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Check if this is a token purchase
    const userId = paymentIntent.metadata.user_id;
    const tokens = parseInt(paymentIntent.metadata.tokens || '0');

    if (userId && tokens > 0) {
        // Credit tokens to user
        await TokenService.addTokens(
            userId,
            tokens,
            'purchase',
            `Purchased ${tokens} tokens`,
            {
                payment_intent_id: paymentIntent.id,
                amount_cents: paymentIntent.amount
            }
        );

        // Update purchase record
        await supabase
            .from('token_purchases')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);
    }
    break;
}
```

---

### Phase 4: Frontend Integration (Day 8-12)

#### Update Pricing Page

**File**: `src/app/pricing/page.tsx`

Add token packages alongside subscriptions:

```typescript
'use client';

import { useState } from 'next/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TokenPackages from '@/components/tokens/TokenPackages';
import SubscriptionPlans from '@/components/premium/SubscriptionPlans';

export default function PricingPage() {
    const [pricingModel, setPricingModel] = useState<'tokens' | 'subscription'>('tokens');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4">
                        Choose Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pricing Model</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Pay as you go with tokens, or get unlimited access with a subscription
                    </p>

                    {/* Pricing Model Toggle */}
                    <Tabs value={pricingModel} onValueChange={(v) => setPricingModel(v as any)} className="w-full max-w-md mx-auto">
                        <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 rounded-xl">
                            <TabsTrigger
                                value="tokens"
                                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                            >
                                💎 Pay As You Go
                            </TabsTrigger>
                            <TabsTrigger
                                value="subscription"
                                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                            >
                                ⭐ Unlimited Access
                            </TabsTrigger>
                        </TabsList>

                        {/* Token Packages */}
                        <TabsContent value="tokens" className="mt-12">
                            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-center text-gray-700">
                                    <strong>No commitment</strong> • Tokens never expire • Pay only for what you use
                                </p>
                            </div>
                            <TokenPackages />
                        </TabsContent>

                        {/* Subscription Plans */}
                        <TabsContent value="subscription" className="mt-12">
                            <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="text-center text-gray-700">
                                    <strong>Unlimited AI features</strong> • Cancel anytime • Best for active users
                                </p>
                            </div>
                            <SubscriptionPlans />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Comparison Table */}
                <ComparisonTable />
            </div>
        </div>
    );
}
```

#### Add Token Balance to Navigation

**File**: `src/components/layout/Navigation.tsx`

```typescript
import TokenBalance from '@/components/tokens/TokenBalance';
import { useTokenBalance } from '@/hooks/useTokenBalance';

export default function Navigation() {
    const { balance, isUnlimited } = useTokenBalance();

    return (
        <nav className="...">
            <div className="flex items-center gap-4">
                {/* Show token balance for logged-in users */}
                {balance !== null && (
                    <TokenBalance balance={balance} compact />
                )}

                {isUnlimited && (
                    <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-bold">
                        ⭐ Unlimited
                    </div>
                )}

                {/* Rest of navigation */}
            </div>
        </nav>
    );
}
```

#### Wrap AI Features with Token Gate

**File**: `src/components/ai/TokenGate.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import TokenConfirmationModal from '@/components/tokens/TokenConfirmationModal';
import TokenCostBadge from '@/components/tokens/TokenCostBadge';

interface TokenGateProps {
    featureKey: string;
    featureName: string;
    description?: string;
    onConfirm: () => Promise<void>;
    children: React.ReactNode;
}

export default function TokenGate({
    featureKey,
    featureName,
    description,
    onConfirm,
    children
}: TokenGateProps) {
    const { balance, isUnlimited, costs } = useTokenBalance();
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const cost = costs[featureKey] || 0;

    const handleClick = () => {
        setShowModal(true);
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            // Call API to deduct tokens
            const response = await fetch('/api/tokens/deduct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureKey })
            });

            if (!response.ok) {
                throw new Error('Failed to deduct tokens');
            }

            // Execute the feature
            await onConfirm();
            setShowModal(false);
        } catch (error) {
            console.error('Token deduction failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="relative">
                {/* Show cost badge */}
                {!isUnlimited && (
                    <div className="mb-2">
                        <TokenCostBadge
                            cost={cost}
                            userBalance={balance}
                            showAffordability
                        />
                    </div>
                )}

                {/* Render children (the button/trigger) */}
                <div onClick={handleClick}>
                    {children}
                </div>
            </div>

            {/* Confirmation Modal */}
            <TokenConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleConfirm}
                action={featureName}
                cost={cost}
                currentBalance={balance}
                description={description}
            />
        </>
    );
}
```

#### Custom Hook for Token Balance

**File**: `src/hooks/useTokenBalance.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';

export function useTokenBalance() {
    const [balance, setBalance] = useState<number>(0);
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [costs, setCosts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBalance();
        fetchCosts();
    }, []);

    const fetchBalance = async () => {
        try {
            const response = await fetch('/api/tokens/balance');
            const data = await response.json();
            setBalance(data.balance);
            setIsUnlimited(data.unlimited);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCosts = async () => {
        try {
            const response = await fetch('/api/tokens/costs');
            const data = await response.json();
            setCosts(data.costs);
        } catch (error) {
            console.error('Failed to fetch costs:', error);
        }
    };

    const refreshBalance = () => {
        fetchBalance();
    };

    return {
        balance,
        isUnlimited,
        costs,
        loading,
        refreshBalance
    };
}
```

---

### Phase 5: Apply Token Gates to AI Features (Day 13-14)

Update all AI feature components to use TokenGate:

**Example**: `src/components/ai/AICoverLetterGenerator.tsx`

```typescript
import TokenGate from '@/components/ai/TokenGate';

export default function AICoverLetterGenerator({ jobId }: { jobId: string }) {
    const handleGenerate = async () => {
        // Actual cover letter generation logic
        const response = await fetch('/api/ai/cover-letter', {
            method: 'POST',
            body: JSON.stringify({ jobId })
        });
        // ... handle response
    };

    return (
        <TokenGate
            featureKey="cover_letter"
            featureName="Generate Cover Letter"
            description="AI will create a tailored cover letter for this job based on your profile"
            onConfirm={handleGenerate}
        >
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold">
                Generate Cover Letter
            </button>
        </TokenGate>
    );
}
```

Repeat for all AI features:
- Job matching
- Resume analysis
- Interview prep
- Career insights
- etc.

---

### Phase 6: Token Purchase Flow (Day 15-16)

**File**: `src/app/tokens/buy/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import TokenPackages from '@/components/tokens/TokenPackages';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BuyTokensPage() {
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const handleSelectPackage = async (packageId: string) => {
        setSelectedPackage(packageId);

        // Create payment intent
        const response = await fetch('/api/tokens/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageId })
        });

        const data = await response.json();
        setClientSecret(data.clientSecret);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-4xl font-bold text-center mb-12">
                    Buy <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Tokens</span>
                </h1>

                {!clientSecret ? (
                    <TokenPackages
                        onSelectPackage={handleSelectPackage}
                        selectedPackage={selectedPackage}
                    />
                ) : (
                    <div className="max-w-md mx-auto">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CheckoutForm />
                        </Elements>
                    </div>
                )}
            </div>
        </div>
    );
}

function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/tokens/success`
            }
        });

        if (error) {
            console.error(error);
        }

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
                {isProcessing ? 'Processing...' : 'Complete Purchase'}
            </button>
        </form>
    );
}
```

---

### Phase 7: Gamification & Rewards (Day 17-18)

**File**: `src/lib/tokens/rewards-service.ts`

```typescript
/**
 * Rewards Service
 *
 * Handles token bonuses, daily rewards, referrals, achievements
 */

import { TokenService } from './token-service';
import { createClient } from '@/lib/supabase/server';

export class RewardsService {
    /**
     * Award daily login bonus (1 token, max 5/week)
     */
    static async awardDailyLogin(userId: string): Promise<{ awarded: boolean; amount: number }> {
        const supabase = createClient();

        // Check last login bonus
        const { data: lastBonus } = await supabase
            .from('token_transactions')
            .select('created_at')
            .eq('user_id', userId)
            .eq('type', 'bonus')
            .like('description', 'Daily login%')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const today = new Date().toISOString().split('T')[0];
        const lastBonusDate = lastBonus?.created_at?.split('T')[0];

        if (lastBonusDate === today) {
            return { awarded: false, amount: 0 };
        }

        // Check weekly limit (5 tokens max)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: weeklyBonuses } = await supabase
            .from('token_transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'bonus')
            .like('description', 'Daily login%')
            .gte('created_at', weekAgo);

        const weeklyTotal = weeklyBonuses?.reduce((sum, b) => sum + b.amount, 0) || 0;

        if (weeklyTotal >= 5) {
            return { awarded: false, amount: 0 };
        }

        // Award bonus
        await TokenService.addTokens(
            userId,
            1,
            'bonus',
            'Daily login bonus',
            { type: 'daily_login' }
        );

        return { awarded: true, amount: 1 };
    }

    /**
     * Award referral bonus
     */
    static async awardReferral(
        referrerId: string,
        referredId: string
    ): Promise<void> {
        // Give 20 tokens to referrer
        await TokenService.addTokens(
            referrerId,
            20,
            'earned',
            'Referral bonus',
            { referred_user_id: referredId }
        );

        // Give 20 tokens to referred user
        await TokenService.addTokens(
            referredId,
            20,
            'bonus',
            'Welcome referral bonus',
            { referrer_id: referrerId }
        );
    }

    /**
     * Check and award achievement bonuses
     */
    static async checkAchievements(userId: string): Promise<void> {
        const supabase = createClient();

        // Get lifetime stats
        const { data: stats } = await supabase
            .from('user_tokens')
            .select('lifetime_spent')
            .eq('user_id', userId)
            .single();

        const lifetimeSpent = stats?.lifetime_spent || 0;

        // Achievement thresholds
        const achievements = [
            { threshold: 100, tokens: 10, name: 'First 100 tokens spent' },
            { threshold: 500, tokens: 50, name: 'Power user: 500 tokens spent' },
            { threshold: 1000, tokens: 100, name: 'Champion: 1000 tokens spent' },
        ];

        for (const achievement of achievements) {
            if (lifetimeSpent >= achievement.threshold) {
                // Check if already awarded
                const { data: existing } = await supabase
                    .from('token_transactions')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('type', 'bonus')
                    .eq('description', achievement.name)
                    .single();

                if (!existing) {
                    await TokenService.addTokens(
                        userId,
                        achievement.tokens,
                        'bonus',
                        achievement.name,
                        { type: 'achievement', threshold: achievement.threshold }
                    );
                }
            }
        }
    }
}
```

---

### Phase 8: Testing & QA (Day 19-20)

#### Testing Checklist

**Token Balance**:
- [ ] Balance displays correctly
- [ ] Unlimited subscription shows "Unlimited"
- [ ] Balance updates after purchase
- [ ] Balance updates after spending

**Token Deduction**:
- [ ] Cannot use feature with insufficient tokens
- [ ] Tokens deducted correctly
- [ ] Transaction logged properly
- [ ] Subscription users not charged tokens

**Token Purchase**:
- [ ] Package selection works
- [ ] Stripe checkout flow completes
- [ ] Tokens credited after payment
- [ ] Receipt email sent

**Edge Cases**:
- [ ] Concurrent token usage (race conditions)
- [ ] Negative balance prevented
- [ ] Database constraints enforced
- [ ] Error handling graceful

**UX**:
- [ ] Cost displayed before action
- [ ] Confirmation modal clear
- [ ] Low balance warning shown
- [ ] Insufficient tokens handled well

---

### Phase 9: Deployment (Day 21)

#### Pre-deployment Checklist

- [ ] Run migrations on production database
- [ ] Seed token packages and feature costs
- [ ] Update Stripe products
- [ ] Configure webhook endpoints
- [ ] Test payment flow in production
- [ ] Monitor error logs
- [ ] Set up analytics tracking

#### Environment Variables

```env
# Add to .env.production
NEXT_PUBLIC_ENABLE_TOKEN_SYSTEM=true
TOKEN_WELCOME_BONUS=10
TOKEN_DAILY_LOGIN_BONUS=1
TOKEN_DAILY_LOGIN_WEEKLY_MAX=5
TOKEN_REFERRAL_BONUS=20
```

---

## Timeline Summary

| Phase | Days | Tasks |
|-------|------|-------|
| **Phase 1** | 1-2 | Database schema + migrations |
| **Phase 2** | 3-5 | Backend API (TokenService, endpoints) |
| **Phase 3** | 6-7 | Stripe webhook integration |
| **Phase 4** | 8-12 | Frontend integration (pricing, nav, gates) |
| **Phase 5** | 13-14 | Apply token gates to all AI features |
| **Phase 6** | 15-16 | Token purchase flow |
| **Phase 7** | 17-18 | Gamification & rewards |
| **Phase 8** | 19-20 | Testing & QA |
| **Phase 9** | 21 | Deployment |

**Total: 3 weeks**

---

## Post-Launch Monitoring

### Week 1 Metrics

- Token purchase conversion rate
- Average purchase size
- Feature usage breakdown
- Token vs subscription split
- Error rate on token operations

### Week 2-4 Optimization

- Adjust token costs based on usage
- A/B test package pricing
- Refine confirmation UX
- Add more gamification

### Month 2-3 Iteration

- Analyze subscription vs token revenue
- Consider removing less popular option
- Add enterprise/team features
- Optimize for retention

---

## Success Criteria

✅ **Technical**:
- Token system stable (99.9% uptime)
- < 100ms latency on balance checks
- Zero negative balances
- All transactions logged

✅ **Business**:
- 30%+ token purchase rate
- Average purchase $15+
- 40%+ repeat buyers
- Combined revenue > subscription-only

✅ **UX**:
- < 5% checkout abandonment
- 4+ star user feedback
- Clear understanding of token costs
- Low support tickets on pricing

---

## Risk Mitigation

### Risk: Users confused by two models

**Mitigation**:
- Clear comparison table
- Recommend based on usage
- Allow switching easily

### Risk: Token abuse

**Mitigation**:
- Rate limiting (100 actions/day even with unlimited)
- Monitor for suspicious patterns
- Prevent account sharing

### Risk: Revenue drop

**Mitigation**:
- Start with conservative token costs
- Monitor closely first month
- Adjust pricing quickly if needed
- Keep subscription option prominent

---

## Conclusion

This hybrid model offers the best of both worlds:
- **Flexibility** via tokens for casual users
- **Predictability** via subscriptions for power users
- **Higher revenue** by capturing all segments
- **Better UX** by letting users choose

Implementation timeline: **3 weeks**
Expected ROI: **2-3x current subscription revenue**

Let's build it! 🚀
