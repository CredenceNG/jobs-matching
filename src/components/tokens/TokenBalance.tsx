/**
 * Token Balance Component
 *
 * Displays user's current token balance with visual appeal
 * Shows equivalent actions they can perform
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Plus, TrendingUp, Zap } from 'lucide-react';

interface TokenBalanceProps {
    balance: number;
    compact?: boolean;
    showActions?: boolean;
}

export default function TokenBalance({
    balance,
    compact = false,
    showActions = true
}: TokenBalanceProps) {
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Calculate what user can do with their tokens
    const equivalentActions = [
        { name: 'AI Job Matches', cost: 5, icon: '🎯' },
        { name: 'Cover Letters', cost: 12, icon: '📝' },
        { name: 'Resume Analyses', cost: 10, icon: '📊' },
        { name: 'Interview Preps', cost: 8, icon: '💼' },
    ];

    const getLowBalanceWarning = () => {
        if (balance === 0) return { level: 'critical', message: 'Out of tokens' };
        if (balance < 10) return { level: 'warning', message: 'Low balance' };
        if (balance < 50) return { level: 'info', message: 'Running low' };
        return null;
    };

    const warning = getLowBalanceWarning();

    if (compact) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-gray-900">{balance}</span>
                <span className="text-xs text-gray-600">tokens</span>
                {warning && (
                    <span className={`text-xs font-medium ${
                        warning.level === 'critical' ? 'text-red-600' :
                        warning.level === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                    }`}>
                        {warning.message}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-blue-100 uppercase tracking-wide">Your Balance</p>
                        <p className="text-3xl font-bold">{balance} <span className="text-lg">tokens</span></p>
                    </div>
                </div>

                {warning && (
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        warning.level === 'critical' ? 'bg-red-500/20 border border-red-400' :
                        warning.level === 'warning' ? 'bg-yellow-500/20 border border-yellow-400' :
                        'bg-blue-500/20 border border-blue-400'
                    }`}>
                        {warning.message}
                    </div>
                )}
            </div>

            {/* Equivalent Actions */}
            {showActions && balance > 0 && (
                <div className="mb-4">
                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="text-xs text-blue-100 hover:text-white transition-colors mb-2 flex items-center gap-1"
                    >
                        <Zap className="h-3 w-3" />
                        What can I do with {balance} tokens?
                    </button>

                    {showBreakdown && (
                        <div className="grid grid-cols-2 gap-2">
                            {equivalentActions.map((action) => {
                                const count = Math.floor(balance / action.cost);
                                if (count === 0) return null;

                                return (
                                    <div
                                        key={action.name}
                                        className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{action.icon}</span>
                                            <div>
                                                <p className="text-xs text-blue-100">{action.name}</p>
                                                <p className="text-sm font-bold">≈ {count}×</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* CTA */}
            <div className="flex gap-2">
                <Link
                    href="/tokens/buy"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
                >
                    <Plus className="h-5 w-5" />
                    Buy Tokens
                </Link>
                <Link
                    href="/tokens/history"
                    className="px-4 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/30"
                >
                    <TrendingUp className="h-5 w-5" />
                </Link>
            </div>

            {/* Out of tokens CTA */}
            {balance === 0 && (
                <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <p className="text-sm text-blue-100 mb-2">
                        Get started with our Starter package
                    </p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-bold">100 tokens</p>
                            <p className="text-xs text-blue-100">Just $5</p>
                        </div>
                        <Link
                            href="/tokens/buy?package=starter"
                            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
