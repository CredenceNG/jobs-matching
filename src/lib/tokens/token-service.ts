/**
 * Token Service
 *
 * Core business logic for token operations
 * Handles balance checks, deductions, purchases, and history
 *
 * @description Central service for all token-related operations using Prisma/Neon
 * @security All operations are server-side only
 */

import { prisma } from '@/lib/prisma';
import { AIFeature } from '@prisma/client';

// Types
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
    type: 'purchase' | 'spend' | 'bonus' | 'refund';
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    metadata?: Record<string, any>;
    createdAt: string;
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

export interface TokenPackage {
    id: string;
    tier: string;
    name: string;
    tokens: number;
    priceCents: number;
    discountPercentage: number;
    popular: boolean;
    bestValue: boolean;
    stripePriceId?: string;
}

export interface FeatureCost {
    featureKey: string;
    costTokens: number;
    description: string | null;
}

/**
 * Token Service Class
 * All methods are static for easy import and use
 */
export class TokenService {
    /**
     * Initialize user tokens with welcome bonus
     * Called when user signs up
     *
     * @param userId - User's database UUID (not authUserId)
     * @param welcomeBonus - Number of tokens to give (default: 10)
     * @returns Promise<void>
     */
    static async initializeUserTokens(
        userId: string,
        welcomeBonus: number = 10
    ): Promise<void> {
        // Check if already initialized
        const existing = await prisma.userToken.findUnique({
            where: { userId },
        });

        if (existing) {
            return; // Already initialized
        }

        // Create token record
        await prisma.userToken.create({
            data: {
                userId,
                balance: welcomeBonus,
                lifetimeEarned: welcomeBonus,
            },
        });

        // Log welcome bonus transaction
        await prisma.tokenTransaction.create({
            data: {
                userId,
                amount: welcomeBonus,
                type: 'bonus',
                description: 'Welcome bonus',
                metadata: {
                    type: 'welcome',
                    balanceBefore: 0,
                    balanceAfter: welcomeBonus,
                },
            },
        });
    }

    /**
     * Get user's current token balance
     *
     * @param userId - User's database UUID
     * @returns Promise<number> - Current token balance
     */
    static async getBalance(userId: string): Promise<number> {
        const tokens = await prisma.userToken.findUnique({
            where: { userId },
            select: { balance: true },
        });

        if (!tokens) {
            // Initialize if doesn't exist
            await this.initializeUserTokens(userId);
            return 10; // Welcome bonus
        }

        return tokens.balance;
    }

    /**
     * Get balance by auth user ID (for API endpoints)
     *
     * @param userId - User's database UUID
     * @returns Promise<number> - Current token balance
     */
    static async getBalanceByUserId(authUserId: string): Promise<number> {
        const user = await prisma.user.findUnique({
            where: { id: authUserId },
            include: { tokens: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.tokens) {
            // Initialize if doesn't exist
            await this.initializeUserTokens(user.id);
            return 10;
        }

        return user.tokens.balance;
    }

    /**
     * Get full token balance info (including lifetime stats)
     *
     * @param userId - User's database UUID
     * @returns Promise<TokenBalance>
     */
    static async getBalanceInfo(userId: string): Promise<TokenBalance> {
        const tokens = await prisma.userToken.findUnique({
            where: { userId },
            select: {
                balance: true,
                lifetimePurchased: true,
                lifetimeEarned: true,
                lifetimeSpent: true,
            },
        });

        if (!tokens) {
            await this.initializeUserTokens(userId);
            return {
                balance: 10,
                lifetimePurchased: 0,
                lifetimeEarned: 10,
                lifetimeSpent: 0,
            };
        }

        return {
            balance: tokens.balance,
            lifetimePurchased: tokens.lifetimePurchased || 0,
            lifetimeEarned: tokens.lifetimeEarned || 0,
            lifetimeSpent: tokens.lifetimeSpent || 0,
        };
    }

    /**
     * Get full token balance info by auth user ID
     *
     * @param userId - User's database UUID
     * @returns Promise<TokenBalance>
     */
    static async getBalanceInfoByUserId(authUserId: string): Promise<TokenBalance> {
        const user = await prisma.user.findUnique({
            where: { id: authUserId },
            include: { tokens: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.tokens) {
            await this.initializeUserTokens(user.id);
            return {
                balance: 10,
                lifetimePurchased: 0,
                lifetimeEarned: 10,
                lifetimeSpent: 0,
            };
        }

        return {
            balance: user.tokens.balance,
            lifetimePurchased: user.tokens.lifetimePurchased || 0,
            lifetimeEarned: user.tokens.lifetimeEarned || 0,
            lifetimeSpent: user.tokens.lifetimeSpent || 0,
        };
    }

    /**
     * Check if user has unlimited tokens (via premium subscription)
     *
     * @param userId - User's database UUID
     * @returns Promise<boolean>
     */
    static async hasUnlimitedTokens(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isPremium: true },
        });

        // Premium users have unlimited tokens
        return user?.isPremium || false;
    }

    /**
     * Check if user has unlimited tokens by auth user ID
     *
     * @param userId - User's database UUID
     * @returns Promise<boolean>
     */
    static async hasUnlimitedTokensByUserId(authUserId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: authUserId },
            select: { isPremium: true },
        });

        return user?.isPremium || false;
    }

    /**
     * Get feature cost from database
     *
     * @param featureKey - Feature identifier (e.g., 'cover_letter')
     * @returns Promise<number> - Token cost for feature
     */
    static async getFeatureCost(featureKey: string): Promise<number> {
        try {
            // Validate that featureKey is a valid AIFeature enum value
            const validFeatures = ['job_match', 'resume_analysis', 'cover_letter', 'interview_prep', 'salary_analysis', 'company_research', 'resume_optimization'];

            if (!validFeatures.includes(featureKey)) {
                console.error(`Invalid feature key: ${featureKey}. Valid values are:`, validFeatures);
                return 0;
            }

            const feature = await prisma.aIFeatureCost.findUnique({
                where: {
                    feature: featureKey as AIFeature,
                },
                select: { costTokens: true, isActive: true },
            });

            if (!feature || !feature.isActive) {
                console.error(`Feature cost not found or inactive for: ${featureKey}`);
                return 0;
            }

            return feature.costTokens;
        } catch (error) {
            console.error(`Error getting feature cost for ${featureKey}:`, error);
            return 0;
        }
    }

    /**
     * Get all feature costs (for displaying to users)
     *
     * @returns Promise<Record<string, number>> - Map of feature_key to cost
     */
    static async getAllFeatureCosts(): Promise<Record<string, number>> {
        const features = await prisma.aIFeatureCost.findMany({
            where: { isActive: true },
            select: {
                feature: true,
                costTokens: true,
            },
        });

        return features.reduce((acc, item) => {
            acc[item.feature] = item.costTokens;
            return acc;
        }, {} as Record<string, number>);
    }

    /**
     * Get all feature costs with details
     *
     * @returns Promise<FeatureCost[]>
     */
    static async getAllFeatureCostsDetailed(): Promise<FeatureCost[]> {
        const features = await prisma.aIFeatureCost.findMany({
            where: { isActive: true },
            orderBy: {
                costTokens: 'desc',
            },
        });

        return features.map(item => ({
            featureKey: item.feature,
            costTokens: item.costTokens,
            description: item.description,
        }));
    }

    /**
     * Check if user can afford a feature
     *
     * @param userId - User's database UUID
     * @param featureKey - Feature identifier
     * @returns Promise<AffordabilityCheck>
     */
    static async canAffordFeature(
        userId: string,
        featureKey: string
    ): Promise<AffordabilityCheck> {
        // Check if unlimited first
        const isUnlimited = await this.hasUnlimitedTokens(userId);

        if (isUnlimited) {
            return {
                canAfford: true,
                balance: Infinity,
                required: 0,
                isUnlimited: true,
            };
        }

        const balance = await this.getBalance(userId);
        const cost = await this.getFeatureCost(featureKey);

        return {
            canAfford: balance >= cost,
            balance,
            required: cost,
            isUnlimited: false,
        };
    }

    /**
     * Check if user can afford a feature by user ID
     *
     * @param userId - User's database UUID
     * @param featureKey - Feature identifier
     * @returns Promise<AffordabilityCheck>
     */
    static async canAffordFeatureByUserId(
        userId: string,
        featureKey: string
    ): Promise<AffordabilityCheck> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { tokens: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return this.canAffordFeature(user.id, featureKey);
    }

    /**
     * Alias for backward compatibility
     */
    static async canAfford(userId: string, feature: string): Promise<AffordabilityCheck> {
        return this.canAffordFeatureByUserId(userId, feature);
    }

    /**
     * Deduct tokens for a feature usage
     * Atomic operation with transaction logging
     *
     * @param userId - User's database UUID
     * @param featureKey - Feature identifier
     * @param metadata - Optional metadata to store
     * @throws Error if insufficient tokens
     * @returns Promise<DeductionResult>
     */
    static async deductTokens(
        userId: string,
        featureKey: string,
        metadata?: Record<string, any>
    ): Promise<DeductionResult> {
        // Check unlimited first
        const isUnlimited = await this.hasUnlimitedTokens(userId);

        if (isUnlimited) {
            // Log usage but don't deduct
            await this.logSubscriptionUsage(userId, featureKey, metadata);
            return {
                success: true,
                newBalance: Infinity,
                transactionId: 'unlimited',
                isUnlimited: true,
            };
        }

        const cost = await this.getFeatureCost(featureKey);

        // Get current balance
        const currentTokens = await prisma.userToken.findUnique({
            where: { userId },
            select: { balance: true, lifetimeSpent: true },
        });

        if (!currentTokens) {
            throw new Error('Token record not found');
        }

        // Check affordability
        if (currentTokens.balance < cost) {
            throw new Error('INSUFFICIENT_TOKENS');
        }

        const newBalance = currentTokens.balance - cost;

        // Update balance atomically using transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update balance
            await tx.userToken.update({
                where: { userId },
                data: {
                    balance: newBalance,
                    lifetimeSpent: (currentTokens.lifetimeSpent || 0) + cost,
                },
            });

            // Log transaction
            const transaction = await tx.tokenTransaction.create({
                data: {
                    userId,
                    amount: -cost, // Negative for deduction
                    type: 'spend',
                    description: `Used for ${featureKey}`,
                    metadata: {
                        feature_key: featureKey,
                        balanceBefore: currentTokens.balance,
                        balanceAfter: newBalance,
                        ...metadata
                    },
                },
            });

            return transaction;
        });

        return {
            success: true,
            newBalance,
            transactionId: result.id,
            isUnlimited: false,
        };
    }

    /**
     * Deduct tokens by auth user ID
     *
     * @param userId - User's database UUID
     * @param featureKey - Feature identifier
     * @param metadata - Optional metadata
     * @returns Promise<DeductionResult>
     */
    static async deductTokensByUserId(
        authUserId: string,
        featureKey: string,
        metadata?: Record<string, any>
    ): Promise<DeductionResult> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return this.deductTokens(user.id, featureKey, metadata);
    }

    /**
     * Add tokens (from purchase, bonus, or earned)
     *
     * @param userId - User's database UUID
     * @param amount - Number of tokens to add
     * @param type - Transaction type
     * @param description - Human-readable description
     * @param metadata - Optional metadata
     * @returns Promise<number> - New balance
     */
    static async addTokens(
        userId: string,
        amount: number,
        type: 'purchase' | 'bonus' | 'refund',
        description: string,
        metadata?: Record<string, any>
    ): Promise<number> {
        const currentBalance = await this.getBalance(userId);
        const newBalance = currentBalance + amount;

        // Prepare update data
        const updateData: any = { balance: newBalance };

        if (type === 'purchase') {
            const current = await prisma.userToken.findUnique({
                where: { userId },
                select: { lifetimePurchased: true },
            });
            updateData.lifetimePurchased = (current?.lifetimePurchased || 0) + amount;
        } else if (type === 'bonus') {
            const current = await prisma.userToken.findUnique({
                where: { userId },
                select: { lifetimeEarned: true },
            });
            updateData.lifetimeEarned = (current?.lifetimeEarned || 0) + amount;
        }

        // Update balance and log transaction atomically
        await prisma.$transaction(async (tx) => {
            // Update balance
            await tx.userToken.update({
                where: { userId },
                data: updateData,
            });

            // Log transaction
            await tx.tokenTransaction.create({
                data: {
                    userId,
                    amount,
                    type,
                    description,
                    metadata: {
                        balanceBefore: currentBalance,
                        balanceAfter: newBalance,
                        ...metadata,
                    },
                },
            });
        });

        return newBalance;
    }

    /**
     * Get transaction history for user
     *
     * @param userId - User's database UUID
     * @param limit - Number of transactions to fetch
     * @returns Promise<TokenTransaction[]>
     */
    static async getTransactionHistory(
        userId: string,
        limit: number = 50
    ): Promise<TokenTransaction[]> {
        const transactions = await prisma.tokenTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return transactions.map(item => {
            const metadata = item.metadata as Record<string, any> | undefined;
            return {
                id: item.id,
                userId: item.userId,
                amount: item.amount,
                type: item.type,
                balanceBefore: metadata?.balanceBefore ?? 0,
                balanceAfter: metadata?.balanceAfter ?? 0,
                description: item.description || '',
                metadata,
                createdAt: item.createdAt.toISOString(),
            };
        });
    }

    /**
     * Get transaction history by auth user ID
     *
     * @param userId - User's database UUID
     * @param limit - Number of transactions to fetch
     * @returns Promise<TokenTransaction[]>
     */
    static async getTransactionHistoryByUserId(
        authUserId: string,
        limit: number = 50
    ): Promise<TokenTransaction[]> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return this.getTransactionHistory(user.id, limit);
    }

    /**
     * Get all active token packages
     *
     * @returns Promise<TokenPackage[]>
     */
    static async getTokenPackages(): Promise<TokenPackage[]> {
        const packages = await prisma.tokenPackage.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            take: 4, // Only show top 4 packages
        });

        return packages.map(pkg => ({
            id: pkg.id,
            tier: pkg.displayOrder.toString(), // Use display order as tier
            name: pkg.name,
            tokens: pkg.tokens,
            priceCents: pkg.priceCents,
            discountPercentage: 0, // Not in schema, calculate if needed
            popular: pkg.isPopular,
            bestValue: pkg.displayOrder === 3, // Pro Pack is best value
            stripePriceId: pkg.stripePriceId || undefined,
        }));
    }

    /**
     * Log subscription usage (for analytics)
     * @private
     */
    private static async logSubscriptionUsage(
        userId: string,
        featureKey: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        // Log transaction with 0 cost for tracking purposes
        await prisma.tokenTransaction.create({
            data: {
                userId,
                amount: 0,
                type: 'spend',
                description: `Premium usage: ${featureKey}`,
                metadata: {
                    feature_key: featureKey,
                    premium: true,
                    balanceBefore: 0,
                    balanceAfter: 0,
                    ...metadata
                },
            },
        });
    }
}
