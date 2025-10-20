/**
 * Token System Types
 *
 * TypeScript type definitions for the token system
 */

export type TokenTransactionType = 'purchase' | 'spent' | 'earned' | 'bonus' | 'refund';
export type PackageTier = 'starter' | 'basic' | 'pro' | 'power' | 'enterprise';
export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type FeatureCategory = 'job_search' | 'resume' | 'application' | 'interview' | 'career' | 'automation';

export interface TokenBalance {
    balance: number;
    lifetimePurchased: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
}

export interface TokenTransaction {
    id: string;
    userId: string;
    amount: number;
    type: TokenTransactionType;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface TokenPackage {
    id: string;
    tier: PackageTier;
    name: string;
    tokens: number;
    priceCents: number;
    priceDisplay: string; // "$5.00"
    discountPercentage: number;
    popular: boolean;
    bestValue: boolean;
    stripePriceId?: string;
    equivalents?: PackageEquivalent[];
}

export interface PackageEquivalent {
    action: string;
    count: number;
}

export interface FeatureCost {
    featureKey: string;
    featureName: string;
    tokenCost: number;
    description: string;
    category: FeatureCategory;
    active: boolean;
}

export interface AffordabilityCheck {
    canAfford: boolean;
    balance: number;
    required: number;
    isUnlimited: boolean;
}

export interface DeductionResult {
    success: boolean;
    newBalance: number;
    transactionId: string;
    isUnlimited: boolean;
}

export interface TokenPurchase {
    id: string;
    userId: string;
    packageId: string;
    tokensPurchased: number;
    amountCents: number;
    stripePaymentIntentId: string;
    stripeChargeId?: string;
    status: PurchaseStatus;
    createdAt: string;
    completedAt?: string;
}

export interface DailyUsage {
    id: string;
    userId: string;
    date: string;
    tokensSpent: number;
    actionsCount: number;
    metadata: Record<string, any>;
}

export interface Referral {
    id: string;
    referrerId: string;
    referredId: string;
    bonusAwarded: boolean;
    createdAt: string;
}

// API Response Types
export interface BalanceResponse {
    balance: number;
    unlimited: boolean;
    lifetimeStats?: TokenBalance;
}

export interface CostsResponse {
    costs: Record<string, number>;
    features?: FeatureCost[];
}

export interface DeductResponse {
    success: boolean;
    newBalance: number;
    transactionId: string;
    unlimited: boolean;
}

export interface PurchaseResponse {
    clientSecret: string;
    packageDetails: TokenPackage;
}

export interface HistoryResponse {
    transactions: TokenTransaction[];
    total: number;
}

// Error Types
export class InsufficientTokensError extends Error {
    constructor(
        public balance: number,
        public required: number
    ) {
        super('INSUFFICIENT_TOKENS');
        this.name = 'InsufficientTokensError';
    }
}

export class FeatureNotFoundError extends Error {
    constructor(public featureKey: string) {
        super(`Feature not found: ${featureKey}`);
        this.name = 'FeatureNotFoundError';
    }
}

export class PackageNotFoundError extends Error {
    constructor(public packageId: string) {
        super(`Package not found: ${packageId}`);
        this.name = 'PackageNotFoundError';
    }
}
