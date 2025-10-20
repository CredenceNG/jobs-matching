/**
 * Signup Page
 * 
 * User registration page with email/password signup.
 * Handles user registration flow and creates user profile.
 * 
 * @description Registration form with Supabase Auth integration
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth/auth-client';
import { StripeCheckoutModal } from '@/components/stripe/StripeCheckout';
import { getPlanConfig, formatAmount } from '@/lib/stripe/config';
import HomeButton from '@/components/ui/HomeButton';

type PlanType = 'free' | 'premium';

interface PlanFeatures {
    name: string;
    price: string;
    period: string;
    features: string[];
    popular?: boolean;
}

const plans: Record<PlanType, PlanFeatures> = {
    free: {
        name: 'Free Plan',
        price: '$0',
        period: 'forever',
        features: [
            'Full access to AI job matching',
            'Full access to resume analysis',
            'Full access to cover letter generation',
            'Full access to interview preparation',
            'Full access to career insights',
            'All AI features included'
        ]
    },
    premium: {
        name: 'Premium Plan',
        price: '$5',
        period: 'per month',
        popular: true,
        features: [
            'Everything in Free Plan',
            'Save job searches & results',
            'Organize jobs into lists',
            'Email job alerts & notifications',
            'Export results to PDF/CSV',
            'Track application status',
            'Annual plan: $4/month (save 20%)'
        ]
    }
};

export default function SignupPage() {
    const [step, setStep] = useState<'plan' | 'details'>('plan');
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showStripeCheckout, setShowStripeCheckout] = useState(false);
    const [createdUserId, setCreatedUserId] = useState<string | null>(null);

    const monthlyPlanConfig = getPlanConfig('monthly');

    const router = useRouter();

    const validateForm = (): string | null => {
        if (!fullName.trim()) return 'Full name is required';
        if (!email.trim()) return 'Email is required';
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (password !== confirmPassword) return 'Passwords do not match';
        if (!acceptedTerms) return 'You must accept the terms and conditions';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate form
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            // For free accounts, proceed with normal signup
            if (selectedPlan === 'free') {
                const { user } = await signUp(email, password, fullName);

                if (user) {
                    setSuccess(true);
                    router.push('/dashboard');
                }
            } else {
                // For premium accounts, create account first, then show Stripe checkout
                const { user } = await signUp(email, password, fullName);

                if (user) {
                    setCreatedUserId(user.id);
                    setShowStripeCheckout(true);
                }
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            console.error('Signup error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanContinue = () => {
        setStep('details');
    };

    const handleStripeSuccess = (subscriptionId: string) => {
        setShowStripeCheckout(false);
        setSuccess(true);
    };

    const handleStripeError = (error: string) => {
        setError(`Payment failed: ${error}`);
        setShowStripeCheckout(false);
        // User account was created but payment failed
        // They can try again later from the upgrade page
    };

    const handleStripeCancel = () => {
        setShowStripeCheckout(false);
        setSuccess(true); // Show success but mention they're on free plan
    };

    // Plan Selection Step
    if (step === 'plan') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Choose Your JobAI Plan
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Start your AI-powered job search journey. Choose the plan that fits your career goals.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {Object.entries(plans).map(([planKey, plan]) => {
                            const isSelected = selectedPlan === planKey;
                            const isPremium = planKey === 'premium';

                            return (
                                <div
                                    key={planKey}
                                    className={`relative bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300 ${isSelected
                                            ? 'ring-4 ring-blue-500 transform scale-105'
                                            : 'hover:shadow-2xl hover:scale-102'
                                        } ${isPremium ? 'border-2 border-blue-500' : ''}`}
                                    onClick={() => setSelectedPlan(planKey as PlanType)}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-baseline justify-center">
                                            <span className="text-4xl font-bold text-gray-900">
                                                {plan.price}
                                            </span>
                                            <span className="text-lg text-gray-600 ml-2">
                                                {plan.period}
                                            </span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <svg
                                                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 mr-3"
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
                                                <span className="text-gray-600 text-sm">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="text-center">
                                        <div className={`w-6 h-6 mx-auto rounded-full border-2 ${isSelected
                                                ? 'bg-blue-500 border-blue-500'
                                                : 'border-gray-300'
                                            } flex items-center justify-center`}>
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-8">
                        <button
                            onClick={handlePlanContinue}
                            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
                        >
                            Continue with {plans[selectedPlan].name}
                        </button>

                        <p className="text-gray-600 mt-4 text-sm">
                            You can upgrade or downgrade your plan at any time
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show success message after signup
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Account Created Successfully!
                        </h1>

                        <p className="text-gray-600 mb-6">
                            {selectedPlan === 'premium' && !createdUserId ?
                                'Your premium subscription has been activated! ' : ''
                            }
                            We've sent a verification email to <strong>{email}</strong>.
                            Please check your inbox and click the verification link to activate your account.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/auth/login')}
                                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Go to Login
                            </button>

                            <button
                                onClick={() => setSuccess(false)}
                                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Back to Signup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Stripe Checkout Modal
    if (showStripeCheckout && monthlyPlanConfig) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Complete Your Premium Signup
                        </h1>
                        <p className="text-gray-600">
                            Your account has been created! Now let's set up your premium subscription.
                        </p>
                    </div>

                    <StripeCheckoutModal
                        isOpen={true}
                        onClose={handleStripeCancel}
                        priceId={monthlyPlanConfig.priceId}
                        onSuccess={handleStripeSuccess}
                        onError={handleStripeError}
                        userEmail={email}
                        userName={fullName}
                    />
                </div>
            </div>
        );
    }

    // Account Details Step
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Home Button */}
                <div>
                    <HomeButton />
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header with Back Button */}
                    <div className="text-center mb-8">
                        <div className="flex items-center mb-4">
                            <button
                                onClick={() => setStep('plan')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900 flex-1">
                                Create Your Account
                            </h1>
                        </div>

                        {/* Plan Selection Summary */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-blue-900">
                                        {plans[selectedPlan].name}
                                    </p>
                                    <p className="text-blue-700 text-sm">
                                        {plans[selectedPlan].price} {plans[selectedPlan].period}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStep('plan')}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    Change Plan
                                </button>
                            </div>
                        </div>

                        <p className="text-gray-600">
                            Complete your profile to get started with JobAI
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                autoComplete="name"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Create a strong password"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Confirm your password"
                            />
                        </div>

                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="acceptedTerms"
                                    name="acceptedTerms"
                                    type="checkbox"
                                    required
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="acceptedTerms" className="text-gray-700">
                                    I agree to the{' '}
                                    <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Creating account...
                                </div>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or</span>
                            </div>
                        </div>
                    </div>

                    {/* Social Signup (Future Enhancement) */}
                    <div className="mt-6">
                        <button
                            type="button"
                            disabled
                            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google (Coming Soon)
                        </button>
                    </div>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link
                                href="/auth/login"
                                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}