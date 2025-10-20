/**
 * Token Purchase Success Page
 *
 * Shows confirmation after successful token purchase
 * Displays new balance and suggested next actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import TokenBalance from '@/components/tokens/TokenBalance';

export default function TokenSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { balance, refreshBalance } = useTokenBalance();
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        // Verify payment and refresh balance
        const verifyPayment = async () => {
            const paymentIntentId = searchParams.get('payment_intent');

            if (!paymentIntentId) {
                router.push('/tokens/buy');
                return;
            }

            try {
                // Call confirm endpoint to credit tokens
                const response = await fetch('/api/tokens/confirm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ paymentIntentId }),
                });

                if (!response.ok) {
                    console.error('Failed to confirm purchase');
                }

                // Wait a moment then refresh balance
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Refresh balance
                await refreshBalance();
            } catch (error) {
                console.error('Error confirming purchase:', error);
            } finally {
                setIsVerifying(false);
            }
        };

        verifyPayment();
    }, [searchParams, router, refreshBalance]);

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">Verifying your purchase...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Success Message */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                        <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Purchase <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Successful!</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Your tokens have been added to your account. You're all set to unlock powerful AI features!
                    </p>
                </div>

                {/* Token Balance Display */}
                <div className="max-w-md mx-auto mb-12">
                    <TokenBalance balance={balance} showActions={false} />
                </div>

                {/* Next Steps */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-blue-600" />
                        What You Can Do Now
                    </h2>

                    <div className="space-y-4">
                        <Link
                            href="/search"
                            className="block p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        Find Your Perfect Job
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Use AI-powered job matching to discover opportunities
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        <Link
                            href="/resume"
                            className="block p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        Optimize Your Resume
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Get AI-powered resume analysis and improvements
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        <Link
                            href="/ai-features"
                            className="block p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        Explore All AI Features
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Generate cover letters, prep for interviews, and more
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Receipt Info */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 text-center">
                    <p className="text-sm text-gray-700">
                        A receipt has been sent to your email. You can view your transaction history in your{' '}
                        <Link href="/tokens/history" className="text-blue-600 hover:text-blue-700 font-semibold">
                            account dashboard
                        </Link>
                        .
                    </p>
                </div>

                {/* Back to Dashboard */}
                <div className="mt-8 text-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
