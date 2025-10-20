/**
 * Subscription Purchase Success Page
 *
 * Shows confirmation after successful subscription purchase
 * Activates subscription and redirects to dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Sparkles, ArrowRight, Crown } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(true);
    const [subscriptionPlan, setSubscriptionPlan] = useState<string>('');

    useEffect(() => {
        // Verify subscription and activate
        const verifySubscription = async () => {
            const sessionId = searchParams.get('session_id');

            if (!sessionId) {
                router.push('/tokens/buy');
                return;
            }

            try {
                // Call confirm endpoint to activate subscription
                const response = await fetch('/api/subscriptions/confirm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ sessionId }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setSubscriptionPlan(data.plan || 'premium');
                } else {
                    console.error('Failed to confirm subscription');
                }

                // Wait a moment before showing success
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error('Error confirming subscription:', error);
            } finally {
                setIsVerifying(false);
            }
        };

        verifySubscription();
    }, [searchParams, router]);

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">Activating your subscription...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Success Message */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
                        <Crown className="h-10 w-10 text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Premium!</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Your subscription is now active. Enjoy unlimited access to all AI-powered features!
                    </p>
                </div>

                {/* Premium Badge */}
                <div className="max-w-md mx-auto mb-12">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center shadow-2xl">
                        <Crown className="h-12 w-12 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Premium Member</h2>
                        <p className="text-blue-100">
                            {subscriptionPlan === 'annual' ? 'Annual Plan' : 'Monthly Plan'}
                        </p>
                        <div className="mt-4 pt-4 border-t border-blue-400">
                            <p className="text-sm text-blue-100">Unlimited AI Features Activated</p>
                        </div>
                    </div>
                </div>

                {/* What You Can Do Now */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-blue-600" />
                        Unlimited Access to Everything
                    </h2>

                    <div className="space-y-4">
                        <Link
                            href="/search"
                            className="block p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        🎯 AI Job Matching
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Unlimited job matches with detailed AI analysis
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
                                        📝 Resume Optimization
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Unlimited resume analysis and improvements
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        <Link
                            href="/cover-letter"
                            className="block p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        ✍️ Cover Letter Generator
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Unlimited personalized cover letters
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        <Link
                            href="/interview-prep"
                            className="block p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        💼 Interview Preparation
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Unlimited practice questions and feedback
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Billing Info */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 text-center mb-8">
                    <p className="text-sm text-gray-700">
                        Your subscription will automatically renew. You can manage or cancel your subscription anytime in your{' '}
                        <Link href="/settings/billing" className="text-blue-600 hover:text-blue-700 font-semibold">
                            billing settings
                        </Link>
                        . A receipt has been sent to your email.
                    </p>
                </div>

                {/* Go to Dashboard */}
                <div className="text-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                        <Crown className="h-5 w-5" />
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
