/**
 * Dashboard Content Component
 * 
 * Client-side dashboard content with user interactions.
 * Displays job search stats, recent activity, and navigation.
 * 
 * @description Interactive dashboard components
 */

'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/database';
import { signOut } from '@/lib/auth/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface DashboardContentProps {
    user: {
        id: string;
        email: string;
        fullName?: string | null;
        isAdmin?: boolean;
    };
    userProfile: User | null;
}

export function DashboardContent({ user, userProfile }: DashboardContentProps) {
    const [loading, setLoading] = useState(false);
    const [tokenBalance, setTokenBalance] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const router = useRouter();

    // Fetch token balance
    useEffect(() => {
        async function fetchTokenBalance() {
            try {
                const response = await fetch('/api/tokens/balance');
                if (response.ok) {
                    const data = await response.json();
                    setTokenBalance(data.balance || 0);
                }
            } catch (error) {
                console.error('Error fetching token balance:', error);
                setTokenBalance(0);
            } finally {
                setLoadingBalance(false);
            }
        }

        fetchTokenBalance();

        // Refresh balance every 30 seconds to catch purchases
        const interval = setInterval(fetchTokenBalance, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setLoading(false);
        }
    };

    const isPremium = userProfile?.subscription_status === 'premium';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome back, {userProfile?.full_name || user?.email}!
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Ready to find your next opportunity?
                        </p>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Home Button */}
                        <Link
                            href="/"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            🏠 Home
                        </Link>

                        {/* Token Balance */}
                        {loadingBalance ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                                <span className="text-sm text-gray-600">Loading...</span>
                            </div>
                        ) : (
                            <Link
                                href="/tokens/buy"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-md transition-all"
                            >
                                <Sparkles className="h-4 w-4 text-blue-600" />
                                <div className="flex items-baseline gap-1">
                                    <span className="font-bold text-gray-900 text-lg">{tokenBalance}</span>
                                    <span className="text-xs text-gray-600">tokens</span>
                                </div>
                                {tokenBalance !== null && tokenBalance < 10 && (
                                    <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                                        Low
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Premium Badge */}
                        {isPremium && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                ⭐ Premium
                            </span>
                        )}

                        {/* Sign Out Button */}
                        <button
                            onClick={handleSignOut}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing out...' : 'Sign Out'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium Upgrade Banner - Smart logic based on token balance and premium status */}
            {!isPremium && tokenBalance !== null && (
                <>
                    {/* Full upgrade banner - only if user has 0 tokens */}
                    {tokenBalance === 0 && (
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                        Unlock Your Career Potential 🚀
                                    </h3>
                                    <p className="text-blue-100">
                                        Get unlimited AI job matches, resume analyses, cover letters, and premium career insights.
                                    </p>
                                    <p className="text-blue-200 text-sm mt-2">
                                        Choose between pay-as-you-go tokens or unlimited subscription
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/tokens/buy"
                                        className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center whitespace-nowrap"
                                    >
                                        💎 Buy Tokens
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors text-center whitespace-nowrap"
                                    >
                                        ⭐ View Plans
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Low balance reminder - if user has 1-50 tokens */}
                    {tokenBalance > 0 && tokenBalance <= 50 && (
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg p-4 mb-8 text-white">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                                        Running Low on Tokens ⚡
                                    </h3>
                                    <p className="text-yellow-100 text-sm">
                                        You have {tokenBalance} tokens left. Refill now or upgrade to unlimited premium.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/tokens/buy"
                                        className="bg-white text-orange-600 px-5 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-center whitespace-nowrap text-sm"
                                    >
                                        💎 Refill Tokens
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        className="border-2 border-white text-white px-5 py-2 rounded-lg font-semibold hover:bg-white/10 transition-colors text-center whitespace-nowrap text-sm"
                                    >
                                        View Plans
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No banner if user has >50 tokens - they have sufficient access */}
                </>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Job Searches</p>
                            <p className="text-lg font-semibold text-gray-900">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Saved Jobs</p>
                            <p className="text-lg font-semibold text-gray-900">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Applications</p>
                            <p className="text-lg font-semibold text-gray-900">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">AI Insights</p>
                            <p className="text-lg font-semibold text-gray-900">{isPremium ? '0' : 'Upgrade'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Start Job Search</h3>
                                <p className="text-sm text-gray-500">Find your perfect role</p>
                            </div>
                        </div>
                    </button>

                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-left">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Upload Resume</h3>
                                <p className="text-sm text-gray-500">Get AI-powered insights</p>
                            </div>
                        </div>
                    </button>

                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-left">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">
                                    {isPremium ? 'AI Job Matching' : 'Upgrade to Premium'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {isPremium ? 'Get personalized matches' : 'Unlock AI features'}
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View All
                    </button>
                </div>

                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-500">
                        Start searching for jobs to see your activity here
                    </p>
                </div>
            </div>
        </div>
    );
}