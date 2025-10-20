/**
 * Premium Upgrade Component
 * 
 * Handles premium subscription upgrades for existing users.
 * Integrates with Stripe payment processing and subscription management.
 * 
 * @description Premium subscription upgrade interface with Stripe
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StripeCheckout, { StripeCheckoutModal } from '@/components/stripe/StripeCheckout';
import { getPlanConfig, formatAmount } from '@/lib/stripe/config';

interface PremiumUpgradeProps {
    currentPlan?: 'free' | 'premium';
    onUpgrade?: () => void;
    userEmail: string;
    userName: string;
}

const premiumFeatures = [
    {
        category: 'Job Search Management',
        features: [
            'Save job searches and results',
            'Organize jobs into custom lists',
            'Track application status',
            'Quick access to saved searches'
        ]
    },
    {
        category: 'Smart Job Alerts',
        features: [
            'Email notifications for matching jobs',
            'Customizable alert frequency',
            'Location-based job alerts',
            'Industry & role-specific filtering'
        ]
    },
    {
        category: 'Export & Sharing',
        features: [
            'Export job lists to PDF',
            'Download results as CSV',
            'Share job opportunities',
            'Print-friendly formats'
        ]
    },
    {
        category: 'All AI Features Included',
        features: [
            'AI job matching (unlimited)',
            'AI resume analysis (unlimited)',
            'AI cover letter generation (unlimited)',
            'AI interview preparation (unlimited)',
            'Career insights & analytics (unlimited)'
        ]
    }
];

export default function PremiumUpgrade({
    currentPlan = 'free',
    onUpgrade,
    userEmail,
    userName
}: PremiumUpgradeProps) {
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const monthlyPlan = getPlanConfig('monthly');
    const annualPlan = getPlanConfig('annual');

    const handleUpgradeClick = (plan: 'monthly' | 'annual') => {
        setError(null);
        setSelectedPlan(plan);
        setShowCheckout(true);
    };

    const handleStripeSuccess = (subscriptionId: string) => {
        setSuccess(true);
        setShowCheckout(false);
        onUpgrade?.();

        // Redirect to dashboard after a short delay
        setTimeout(() => {
            router.push('/dashboard?upgraded=true');
        }, 2000);
    };

    const handleStripeError = (error: string) => {
        setError(error);
        setShowCheckout(false);
    };

    // Success state
    if (success) {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <div className="bg-green-50 border border-green-200 rounded-xl p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-green-900 mb-2">
                        Welcome to Premium! 🎉
                    </h3>
                    <p className="text-green-700 mb-4">
                        Your subscription has been activated successfully. You now have access to all premium features!
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (currentPlan === 'premium') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                    You're Premium!
                </h3>
                <p className="text-green-700">
                    You already have access to all premium features. Enjoy your enhanced job search experience!
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Save Job Searches & Get Alerts
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Upgrade to Premium to save your searches, organize jobs, and receive email alerts when matching positions are posted.
                </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
                {/* Monthly Plan */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Monthly Plan
                        </h3>
                        <div className="flex items-baseline justify-center mb-4">
                            <span className="text-4xl font-bold text-gray-900">$5</span>
                            <span className="text-lg text-gray-600 ml-2">per month</span>
                        </div>
                        <p className="text-sm text-gray-600">
                            Billed monthly, cancel anytime
                        </p>
                    </div>

                    <button
                        onClick={() => handleUpgradeClick('monthly')}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Choose Monthly Plan
                    </button>
                </div>

                {/* Annual Plan */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-500 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                            Save 20%
                        </span>
                    </div>
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Annual Plan
                        </h3>
                        <div className="flex items-baseline justify-center mb-2">
                            <span className="text-4xl font-bold text-gray-900">$4</span>
                            <span className="text-lg text-gray-600 ml-2">per month</span>
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                            Billed annually ($48/year)
                        </div>
                        <p className="text-sm text-gray-600">
                            Best value - save $12/year
                        </p>
                    </div>

                    <button
                        onClick={() => handleUpgradeClick('annual')}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    >
                        Choose Annual Plan
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
                    <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
            )}

            {/* Feature Comparison */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {premiumFeatures.map((category, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            {category.category}
                        </h4>
                        <ul className="space-y-3">
                            {category.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                                    <svg
                                        className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5 mr-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* FAQ Section */}
            <div className="bg-gray-50 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                    Frequently Asked Questions
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                            Can I cancel anytime?
                        </h4>
                        <p className="text-sm text-gray-600">
                            Yes, you can cancel your subscription at any time. You'll continue to have premium access until the end of your billing period.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                            Is there a money-back guarantee?
                        </h4>
                        <p className="text-sm text-gray-600">
                            We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                            Will my data be secure?
                        </h4>
                        <p className="text-sm text-gray-600">
                            Your data is encrypted and stored securely. We never share your personal information with third parties.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                            What payment methods do you accept?
                        </h4>
                        <p className="text-sm text-gray-600">
                            We accept all major credit cards, PayPal, and other secure payment methods through our payment processor.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stripe Checkout Modal */}
            <StripeCheckoutModal
                isOpen={showCheckout}
                onClose={() => setShowCheckout(false)}
                priceId={getPlanConfig(selectedPlan)?.priceId || ''}
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
                userEmail={userEmail}
                userName={userName}
            />
        </div>
    );
}