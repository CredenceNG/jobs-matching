/**
 * useTokenBalance Hook
 *
 * React hook for managing token balance state
 * Provides real-time balance updates and feature cost information
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface TokenBalanceState {
    balance: number;
    isUnlimited: boolean;
    costs: Record<string, number>;
    loading: boolean;
    error: string | null;
}

export function useTokenBalance() {
    const [state, setState] = useState<TokenBalanceState>({
        balance: 0,
        isUnlimited: false,
        costs: {},
        loading: true,
        error: null
    });

    /**
     * Fetch current balance from API
     */
    const fetchBalance = useCallback(async () => {
        try {
            const response = await fetch('/api/tokens/balance');

            if (!response.ok) {
                if (response.status === 401) {
                    // User not logged in - that's okay
                    setState(prev => ({
                        ...prev,
                        loading: false,
                        balance: 0,
                        isUnlimited: false
                    }));
                    return;
                }
                throw new Error('Failed to fetch balance');
            }

            const data = await response.json();
            setState(prev => ({
                ...prev,
                balance: data.balance,
                isUnlimited: data.unlimited,
                loading: false,
                error: null
            }));
        } catch (error: any) {
            console.error('Error fetching balance:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
        }
    }, []);

    /**
     * Fetch feature costs from API
     */
    const fetchCosts = useCallback(async () => {
        try {
            const response = await fetch('/api/tokens/costs');

            if (!response.ok) {
                throw new Error('Failed to fetch costs');
            }

            const data = await response.json();
            setState(prev => ({
                ...prev,
                costs: data.costs
            }));
        } catch (error: any) {
            console.error('Error fetching costs:', error);
        }
    }, []);

    /**
     * Initial fetch on mount
     */
    useEffect(() => {
        fetchBalance();
        fetchCosts();
    }, [fetchBalance, fetchCosts]);

    /**
     * Refresh balance (call after token operations)
     */
    const refreshBalance = useCallback(() => {
        fetchBalance();
    }, [fetchBalance]);

    /**
     * Check if user can afford a feature
     */
    const canAfford = useCallback((featureKey: string): boolean => {
        if (state.isUnlimited) return true;
        const cost = state.costs[featureKey] || 0;
        return state.balance >= cost;
    }, [state.balance, state.isUnlimited, state.costs]);

    /**
     * Get cost for a specific feature
     */
    const getCost = useCallback((featureKey: string): number => {
        return state.costs[featureKey] || 0;
    }, [state.costs]);

    return {
        balance: state.balance,
        isUnlimited: state.isUnlimited,
        costs: state.costs,
        loading: state.loading,
        error: state.error,
        refreshBalance,
        canAfford,
        getCost
    };
}
