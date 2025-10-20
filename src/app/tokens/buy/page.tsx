/**
 * Token Purchase Page
 *
 * Allows users to select and purchase token packages
 * Integrates with Stripe for payment processing
 */

'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import TokenPackages from '@/components/tokens/TokenPackages';
import { ArrowLeft, Shield, CreditCard, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BuyTokensPage() {
    const router = useRouter();
    const [pricingModel, setPricingModel] = useState<'tokens' | 'subscription'>('tokens');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check session via API
                const response = await fetch('/api/auth/me');
                const data = await response.json();

                if (!response.ok || !data.user) {
                    // Redirect to login with return URL
                    router.push('/auth/login?redirect=/tokens/buy');
                    return;
                }

                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/auth/login?redirect=/tokens/buy');
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleSelectPackage = async (packageId: string) => {
        setSelectedPackage(packageId);
        setIsCreatingPayment(true);
        setError(null);

        try {
            // Create payment intent
            const response = await fetch('/api/tokens/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId })
            });

            if (!response.ok) {
                throw new Error('Failed to create payment');
            }

            const data = await response.json();
            setClientSecret(data.clientSecret);
        } catch (error: any) {
            console.error('Error creating payment:', error);
            setError(error.message);
        } finally {
            setIsCreatingPayment(false);
        }
    };

    const handleSubscriptionPurchase = async (plan: 'monthly' | 'annual') => {
        setIsCreatingPayment(true);
        setError(null);

        try {
            // Create subscription checkout session
            const response = await fetch('/api/subscriptions/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const data = await response.json();

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error('Error creating subscription checkout:', error);
            setError(error.message);
            setIsCreatingPayment(false);
        }
    };

    // Show loading state while checking authentication
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, don't render anything (redirect will happen)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>

                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Choose Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pricing</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                            Pay as you go with tokens, or get unlimited access with a subscription
                        </p>

                        {/* Pricing Model Toggle */}
                        <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl mb-8">
                            <button
                                onClick={() => setPricingModel('tokens')}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                    pricingModel === 'tokens'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'text-gray-700 hover:text-gray-900'
                                }`}
                            >
                                💎 Pay As You Go
                            </button>
                            <button
                                onClick={() => setPricingModel('subscription')}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                    pricingModel === 'subscription'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'text-gray-700 hover:text-gray-900'
                                }`}
                            >
                                ⭐ Unlimited Access
                            </button>
                        </div>
                    </div>
                </div>

                {!clientSecret ? (
                    <>
                        {/* Token Packages View */}
                        {pricingModel === 'tokens' && (
                            <>
                                <div className="mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-200 max-w-3xl mx-auto">
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            Why Choose Tokens?
                                        </h3>
                                        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                <span>No commitment</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                <span>Tokens never expire</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                <span>Pay only for what you use</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <TokenPackages
                                    onSelectPackage={handleSelectPackage}
                                    selectedPackage={selectedPackage}
                                />
                            </>
                        )}

                        {/* Subscription Plans View */}
                        {pricingModel === 'subscription' && (
                            <>
                                <div className="mb-8 p-6 bg-purple-50 rounded-2xl border border-purple-200 max-w-3xl mx-auto">
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            Why Choose Subscription?
                                        </h3>
                                        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                <span>Unlimited AI features</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                <span>Best for active users</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                <span>Cancel anytime</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Cycle Toggle */}
                                <div className="flex items-center justify-center mb-8">
                                    <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                        Monthly
                                    </span>
                                    <button
                                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                            billingCycle === 'annual' ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                    <span className={`ml-3 ${billingCycle === 'annual' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                        Annual
                                    </span>
                                    {billingCycle === 'annual' && (
                                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                            Save 20%
                                        </span>
                                    )}
                                </div>

                                {/* Subscription Plans */}
                                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                                    {/* Monthly Plan */}
                                    <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            Monthly Plan
                                        </h3>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                ${billingCycle === 'monthly' ? '25' : '20'}
                                            </span>
                                            <span className="text-gray-600">/month</span>
                                        </div>
                                        <p className="text-gray-600 mb-6">
                                            {billingCycle === 'monthly' ? 'Billed monthly, cancel anytime' : 'Billed annually at $240/year'}
                                        </p>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span>Unlimited AI job matching</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span>Unlimited resume analysis</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span>Unlimited cover letters</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span>Unlimited interview prep</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span>Priority support</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleSubscriptionPurchase(billingCycle)}
                                            disabled={isCreatingPayment}
                                            className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-center hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreatingPayment ? 'Loading...' : 'Get Started'}
                                        </button>
                                    </div>

                                    {/* Annual Plan - Highlighted */}
                                    <div className="relative bg-white rounded-2xl p-8 border-2 border-blue-500 shadow-xl hover:scale-105 transition-all">
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                                                ⭐ Best Value
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            Annual Plan
                                        </h3>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                $20
                                            </span>
                                            <span className="text-gray-600">/month</span>
                                        </div>
                                        <div className="mb-4">
                                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                                                💰 Save $60/year
                                            </div>
                                        </div>
                                        <p className="text-gray-600 mb-6">
                                            Billed annually at $240/year
                                        </p>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span className="font-semibold">Everything in Monthly, plus:</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span>2 months free (save 20%)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span>Lock in current pricing</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span>VIP support</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <span>Early access to new features</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleSubscriptionPurchase(billingCycle)}
                                            disabled={isCreatingPayment}
                                            className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-center hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreatingPayment ? 'Loading...' : 'Get Started'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
                                <p className="text-sm text-red-600 text-center">{error}</p>
                            </div>
                        )}

                        {isCreatingPayment && (
                            <div className="mt-8 text-center">
                                <div className="inline-flex items-center gap-2 text-gray-600">
                                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                                    Preparing checkout...
                                </div>
                            </div>
                        )}

                        {/* Trust Indicators */}
                        <div className="mt-12 max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-3 gap-6 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Shield className="h-8 w-8 text-green-600" />
                                    <h3 className="font-semibold text-gray-900">Secure Payment</h3>
                                    <p className="text-sm text-gray-600">
                                        Powered by Stripe, industry-leading payment security
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <CreditCard className="h-8 w-8 text-blue-600" />
                                    <h3 className="font-semibold text-gray-900">Instant Credit</h3>
                                    <p className="text-sm text-gray-600">
                                        Tokens credited to your account immediately
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="font-semibold text-gray-900">Never Expire</h3>
                                    <p className="text-sm text-gray-600">
                                        Your tokens are yours forever, no expiration
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="max-w-md mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                Complete Your Purchase
                            </h2>
                            <Elements
                                stripe={stripePromise}
                                options={{
                                    clientSecret,
                                    appearance: {
                                        theme: 'stripe',
                                        variables: {
                                            colorPrimary: '#2563eb',
                                        }
                                    }
                                }}
                            >
                                <CheckoutForm clientSecret={clientSecret} />
                            </Elements>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Stripe Checkout Form Component
 */
function CheckoutForm({ clientSecret }: { clientSecret: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setError(null);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/tokens/success`
                }
            });

            if (error) {
                setError(error.message || 'Payment failed');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard className="h-5 w-5" />
                        Complete Purchase
                    </>
                )}
            </button>

            <p className="text-xs text-gray-500 text-center">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                Payment processed securely by Stripe.
            </p>
        </form>
    );
}
